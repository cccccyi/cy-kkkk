import { BadRequestException, ForbiddenException, Injectable, Inject, PayloadTooLargeException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { ResultData } from 'src/common/utils/result';
import { SysUploadEntity } from './entities/upload.entity';
import { ChunkFileDto, ChunkMergeFileDto } from './dto/index';
import { GenerateUUID } from 'src/common/utils/index';
import fs from 'fs';
import path from 'path';
import COS from 'cos-nodejs-sdk-v5';
import {
  AllowedImage,
  createSafeImageFileName,
  MAX_CHUNK_COUNT,
  MAX_IMAGE_UPLOAD_BYTES,
  parseChunkInteger,
  validateChunkBuffer,
  validateImageBuffer,
  validateUploadId,
} from './upload-security';

type ChunkMetadata = {
  totalChunks: number;
};

@Injectable()
export class UploadService {
  private cos = new COS({
    SecretId: this.config.get('cos.secretId'),
    SecretKey: this.config.get('cos.secretKey'),
    FileParallelLimit: 3,
    ChunkParallelLimit: 8,
    ChunkSize: 1024 * 1024 * 8,
  });
  private isLocal: boolean;

  constructor(
    @InjectRepository(SysUploadEntity)
    private readonly sysUploadEntityRep: Repository<SysUploadEntity>,
    @Inject(ConfigService)
    private config: ConfigService,
  ) {
    this.isLocal = this.config.get('app.file.isLocal');
  }

  async singleFileUpload(file: Express.Multer.File) {
    const image = validateImageBuffer(file?.buffer);
    const res = this.isLocal
      ? await this.saveImageLocal(file.buffer, image)
      : await this.saveImageCos(this.config.get('cos.location'), file.buffer, image);

    const uploadId = GenerateUUID();
    await this.sysUploadEntityRep.save({
      uploadId,
      ...res,
      ext: path.extname(res.newFileName),
      size: file.buffer.length,
    });
    return res;
  }

  async getChunkUploadId() {
    return ResultData.ok({ uploadId: GenerateUUID() });
  }

  async chunkFileUpload(file: Express.Multer.File, body: ChunkFileDto) {
    const uploadId = validateUploadId(body?.uploadId);
    const index = parseChunkInteger(body?.index, 'index', 0, MAX_CHUNK_COUNT - 1);
    const totalChunks = parseChunkInteger(body?.totalChunks, 'totalChunks', 1, MAX_CHUNK_COUNT);
    if (index >= totalChunks) {
      throw new BadRequestException('index必须小于totalChunks');
    }

    const chunk = validateChunkBuffer(file);
    const chunkDir = this.getChunkDirectory(uploadId);
    fs.mkdirSync(chunkDir, { recursive: true, mode: 0o700 });
    this.ensureChunkMetadata(chunkDir, totalChunks);

    const chunkPath = path.join(chunkDir, `${index}.part`);
    if (fs.existsSync(chunkPath)) {
      const existing = fs.readFileSync(chunkPath);
      if (!existing.equals(chunk)) {
        throw new BadRequestException('该序号的文件分片已存在且内容不同');
      }
      return ResultData.ok();
    }

    const existingSize = this.getChunkFiles(chunkDir).reduce((total, filePath) => total + fs.statSync(filePath).size, 0);
    if (existingSize + chunk.length > MAX_IMAGE_UPLOAD_BYTES) {
      throw new PayloadTooLargeException('合并后的图片大小不能超过10MB');
    }

    fs.writeFileSync(chunkPath, chunk, { flag: 'wx', mode: 0o600 });
    return ResultData.ok();
  }

  async checkChunkFile(body: ChunkFileDto) {
    const uploadId = validateUploadId(body?.uploadId);
    const index = parseChunkInteger(body?.index, 'index', 0, MAX_CHUNK_COUNT - 1);
    const chunkPath = path.join(this.getChunkDirectory(uploadId), `${index}.part`);
    return fs.existsSync(chunkPath) ? ResultData.ok() : ResultData.fail(500, '文件不存在');
  }

  async chunkMergeFile(body: ChunkMergeFileDto) {
    const uploadId = validateUploadId(body?.uploadId);
    const chunkDir = this.getChunkDirectory(uploadId);
    if (!fs.existsSync(chunkDir)) {
      return ResultData.fail(500, '文件不存在');
    }

    const { totalChunks } = this.readChunkMetadata(chunkDir);
    const chunks: Buffer[] = [];
    let totalSize = 0;
    for (let index = 0; index < totalChunks; index += 1) {
      const chunkPath = path.join(chunkDir, `${index}.part`);
      if (!fs.existsSync(chunkPath) || !fs.statSync(chunkPath).isFile()) {
        throw new BadRequestException(`缺少文件分片${index}`);
      }
      const chunk = fs.readFileSync(chunkPath);
      totalSize += chunk.length;
      if (totalSize > MAX_IMAGE_UPLOAD_BYTES) {
        throw new PayloadTooLargeException('合并后的图片大小不能超过10MB');
      }
      chunks.push(chunk);
    }

    const buffer = Buffer.concat(chunks, totalSize);
    const image = validateImageBuffer(buffer);
    const res = this.isLocal
      ? await this.saveImageLocal(buffer, image)
      : await this.saveImageCos(this.config.get('cos.location'), buffer, image);

    await this.sysUploadEntityRep.save({
      uploadId,
      ...res,
      ext: path.extname(res.newFileName),
      size: buffer.length,
    });
    fs.rmSync(chunkDir, { recursive: true, force: true });
    return ResultData.ok(res);
  }

  private getPublicUploadRoot(): string {
    const configuredLocation = this.config.get<string>('app.file.location');
    if (!configuredLocation) {
      throw new Error('Missing app.file.location configuration');
    }
    return path.resolve(process.cwd(), configuredLocation);
  }

  private getPrivateChunkRoot(): string {
    const publicRoot = this.getPublicUploadRoot();
    return path.join(path.dirname(publicRoot), `.${path.basename(publicRoot)}-chunks`);
  }

  private getChunkDirectory(uploadId: string): string {
    return path.join(this.getPrivateChunkRoot(), validateUploadId(uploadId));
  }

  private getChunkFiles(chunkDir: string): string[] {
    return fs
      .readdirSync(chunkDir)
      .filter((name) => /^\d+\.part$/.test(name))
      .map((name) => path.join(chunkDir, name));
  }

  private ensureChunkMetadata(chunkDir: string, totalChunks: number): void {
    const metadataPath = path.join(chunkDir, 'metadata.json');
    if (!fs.existsSync(metadataPath)) {
      try {
        fs.writeFileSync(metadataPath, JSON.stringify({ totalChunks }), { flag: 'wx', mode: 0o600 });
        return;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
          throw error;
        }
      }
    }

    const metadata = this.readChunkMetadata(chunkDir);
    if (metadata.totalChunks !== totalChunks) {
      throw new BadRequestException('totalChunks与上传任务不一致');
    }
  }

  private readChunkMetadata(chunkDir: string): ChunkMetadata {
    try {
      const metadata = JSON.parse(fs.readFileSync(path.join(chunkDir, 'metadata.json'), 'utf8')) as ChunkMetadata;
      const totalChunks = parseChunkInteger(metadata?.totalChunks, 'totalChunks', 1, MAX_CHUNK_COUNT);
      return { totalChunks };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('上传任务元数据无效');
    }
  }

  private async saveImageLocal(buffer: Buffer, image: AllowedImage) {
    const baseDirPath = this.getPublicUploadRoot();
    fs.mkdirSync(baseDirPath, { recursive: true, mode: 0o700 });

    let newFileName: string;
    let targetFile: string;
    for (;;) {
      newFileName = createSafeImageFileName(image);
      targetFile = path.join(baseDirPath, newFileName);
      try {
        fs.writeFileSync(targetFile, buffer, { flag: 'wx', mode: 0o600 });
        break;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
          throw error;
        }
      }
    }

    const serveRoot = String(this.config.get('app.file.serveRoot') || '');
    const fileName = serveRoot ? path.posix.join('/', serveRoot, newFileName) : newFileName;
    return {
      fileName,
      newFileName,
      url: this.joinUrl(this.config.get('app.file.domain'), fileName),
    };
  }

  private async saveImageCos(targetDir: string, buffer: Buffer, image: AllowedImage) {
    let newFileName: string;
    let targetFile: string;
    for (;;) {
      newFileName = createSafeImageFileName(image);
      targetFile = path.posix.join(String(targetDir || ''), newFileName).replace(/^\/+/, '');
      const { statusCode } = await this.cosHeadObject(targetFile);
      if (statusCode !== 200) {
        break;
      }
    }

    await this.cos.putObject({
      Bucket: this.config.get('cos.bucket'),
      Region: this.config.get('cos.region'),
      Key: targetFile,
      Body: buffer,
      ContentType: 'application/octet-stream',
      ContentDisposition: `attachment; filename="${newFileName}"`,
    });
    return {
      fileName: targetFile,
      newFileName,
      url: this.joinUrl(this.config.get('cos.domain'), targetFile),
    };
  }

  private joinUrl(domain: string, fileName: string): string {
    const normalizedDomain = String(domain || '').replace(/\/+$/, '');
    const normalizedFileName = String(fileName || '').replace(/^\/+/, '');
    return `${normalizedDomain}/${normalizedFileName}`;
  }

  async getChunkUploadResult(uploadId: string) {
    const safeUploadId = validateUploadId(uploadId);
    const data = await this.sysUploadEntityRep.findOne({
      where: { uploadId: safeUploadId },
      select: ['status', 'fileName', 'newFileName', 'url'],
    });

    if (!data) {
      return ResultData.fail(500, '文件不存在');
    }
    return ResultData.ok({
      data,
      msg: data.status === '0' ? '上传成功' : '上传中',
    });
  }

  async cosHeadObject(targetFile: string) {
    try {
      return await this.cos.headObject({
        Bucket: this.config.get('cos.bucket'),
        Region: this.config.get('cos.region'),
        Key: targetFile,
      });
    } catch (error) {
      return error as { statusCode?: number };
    }
  }

  async getAuthorization() {
    throw new ForbiddenException('已禁用无法进行内容校验的对象存储直传');
  }
}
