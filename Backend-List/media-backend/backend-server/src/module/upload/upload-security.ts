import { BadRequestException, PayloadTooLargeException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import path from 'path';
import { inflateSync } from 'zlib';

export const MAX_IMAGE_UPLOAD_BYTES = 10 * 1024 * 1024;
export const MAX_CHUNK_COUNT = 1000;

export type AllowedImage = {
  extension: 'jpg' | 'png' | 'webp';
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
};

const PNG_SIGNATURE = Buffer.from('89504e470d0a1a0a', 'hex');
const PNG_IEND = Buffer.from('0000000049454e44ae426082', 'hex');
const JPEG_SIGNATURE = Buffer.from('ffd8ff', 'hex');
const WEBP_RIFF = Buffer.from('RIFF', 'ascii');
const WEBP_SIGNATURE = Buffer.from('WEBP', 'ascii');
const WEBP_CHUNK_TYPES = new Set(['VP8 ', 'VP8L', 'VP8X']);
const UPLOAD_ID_PATTERN = /^[a-f0-9]{32}$/i;
const MAX_IMAGE_PIXELS = 16_000_000;
const CRC32_TABLE = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return value >>> 0;
});

function startsWith(buffer: Buffer, signature: Buffer): boolean {
  return buffer.length >= signature.length && buffer.subarray(0, signature.length).equals(signature);
}

function endsWith(buffer: Buffer, signature: Buffer): boolean {
  return buffer.length >= signature.length && buffer.subarray(buffer.length - signature.length).equals(signature);
}

function crc32(buffer: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = CRC32_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngDecodedSize(width: number, height: number, bitsPerPixel: number, interlace: number): number {
  const passSize = (xStart: number, yStart: number, xStep: number, yStep: number) => {
    const passWidth = width <= xStart ? 0 : Math.ceil((width - xStart) / xStep);
    const passHeight = height <= yStart ? 0 : Math.ceil((height - yStart) / yStep);
    return passWidth && passHeight ? passHeight * (1 + Math.ceil((passWidth * bitsPerPixel) / 8)) : 0;
  };
  if (interlace === 0) {
    return passSize(0, 0, 1, 1);
  }
  return [
    [0, 0, 8, 8],
    [4, 0, 8, 8],
    [0, 4, 4, 8],
    [2, 0, 4, 4],
    [0, 2, 2, 4],
    [1, 0, 2, 2],
    [0, 1, 1, 2],
  ].reduce((size, pass) => size + passSize(pass[0], pass[1], pass[2], pass[3]), 0);
}

function isValidPng(buffer: Buffer): boolean {
  if (!startsWith(buffer, PNG_SIGNATURE) || !endsWith(buffer, PNG_IEND)) {
    return false;
  }

  let offset = PNG_SIGNATURE.length;
  let width = 0;
  let height = 0;
  let bitsPerPixel = 0;
  let interlace = 0;
  let seenHeader = false;
  let seenImageData = false;
  let imageDataEnded = false;
  const imageData: Buffer[] = [];

  while (offset + 12 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const typeStart = offset + 4;
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    const chunkEnd = dataEnd + 4;
    if (dataEnd < dataStart || chunkEnd > buffer.length) {
      return false;
    }

    const type = buffer.subarray(typeStart, dataStart).toString('ascii');
    if (!/^[A-Za-z]{4}$/.test(type) || crc32(buffer.subarray(typeStart, dataEnd)) !== buffer.readUInt32BE(dataEnd)) {
      return false;
    }

    if (!seenHeader) {
      if (type !== 'IHDR' || length !== 13) {
        return false;
      }
      width = buffer.readUInt32BE(dataStart);
      height = buffer.readUInt32BE(dataStart + 4);
      const bitDepth = buffer[dataStart + 8];
      const colorType = buffer[dataStart + 9];
      const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[colorType];
      const allowedDepths = {
        0: [1, 2, 4, 8, 16],
        2: [8, 16],
        3: [1, 2, 4, 8],
        4: [8, 16],
        6: [8, 16],
      }[colorType];
      interlace = buffer[dataStart + 12];
      if (
        !width ||
        !height ||
        width * height > MAX_IMAGE_PIXELS ||
        !channels ||
        !allowedDepths?.includes(bitDepth) ||
        buffer[dataStart + 10] !== 0 ||
        buffer[dataStart + 11] !== 0 ||
        (interlace !== 0 && interlace !== 1)
      ) {
        return false;
      }
      bitsPerPixel = channels * bitDepth;
      seenHeader = true;
    } else if (type === 'IHDR') {
      return false;
    } else if (type === 'IDAT') {
      if (imageDataEnded || length === 0) {
        return false;
      }
      seenImageData = true;
      imageData.push(buffer.subarray(dataStart, dataEnd));
    } else if (seenImageData && type !== 'IEND') {
      imageDataEnded = true;
    }

    if (type === 'IEND') {
      if (length !== 0 || !seenImageData || chunkEnd !== buffer.length) {
        return false;
      }
      const expectedSize = pngDecodedSize(width, height, bitsPerPixel, interlace);
      try {
        return inflateSync(Buffer.concat(imageData), { maxOutputLength: expectedSize + 1 }).length === expectedSize;
      } catch {
        return false;
      }
    }

    if (type[0] === type[0].toUpperCase() && !['IHDR', 'PLTE', 'IDAT'].includes(type)) {
      return false;
    }
    offset = chunkEnd;
  }
  return false;
}

function isStartOfFrame(marker: number): boolean {
  return marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);
}

function isValidJpeg(buffer: Buffer): boolean {
  if (!startsWith(buffer, JPEG_SIGNATURE) || buffer.length < 12) {
    return false;
  }
  let offset = 2;
  let seenFrame = false;
  let seenScan = false;

  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) {
      return false;
    }
    while (offset < buffer.length && buffer[offset] === 0xff) {
      offset += 1;
    }
    const marker = buffer[offset++];
    if (marker === 0xd9) {
      return seenFrame && seenScan && offset === buffer.length;
    }
    if (marker === 0x00 || marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd7) || offset + 2 > buffer.length) {
      return false;
    }
    const segmentLength = buffer.readUInt16BE(offset);
    if (segmentLength < 2 || offset + segmentLength > buffer.length) {
      return false;
    }
    const dataStart = offset + 2;
    const segmentEnd = offset + segmentLength;

    if (isStartOfFrame(marker)) {
      if (segmentLength < 8) {
        return false;
      }
      const height = buffer.readUInt16BE(dataStart + 1);
      const width = buffer.readUInt16BE(dataStart + 3);
      const components = buffer[dataStart + 5];
      if (!width || !height || width * height > MAX_IMAGE_PIXELS || segmentLength !== 8 + components * 3) {
        return false;
      }
      seenFrame = true;
    }

    if (marker === 0xda) {
      const components = buffer[dataStart];
      if (!seenFrame || segmentLength !== 6 + components * 2) {
        return false;
      }
      seenScan = true;
      offset = segmentEnd;
      let scanBytes = 0;
      while (offset < buffer.length) {
        if (buffer[offset] !== 0xff) {
          scanBytes += 1;
          offset += 1;
          continue;
        }
        const next = buffer[offset + 1];
        if (next === 0x00 || (next >= 0xd0 && next <= 0xd7)) {
          scanBytes += 1;
          offset += 2;
          continue;
        }
        if (next === 0xff) {
          offset += 1;
          continue;
        }
        break;
      }
      if (!scanBytes) {
        return false;
      }
      continue;
    }
    offset = segmentEnd;
  }
  return false;
}

function isValidWebp(buffer: Buffer): boolean {
  if (
    buffer.length < 30 ||
    !startsWith(buffer, WEBP_RIFF) ||
    !buffer.subarray(8, 12).equals(WEBP_SIGNATURE) ||
    buffer.readUInt32LE(4) + 8 !== buffer.length
  ) {
    return false;
  }
  let offset = 12;
  let validImageChunks = 0;
  while (offset + 8 <= buffer.length) {
    const type = buffer.subarray(offset, offset + 4).toString('ascii');
    const length = buffer.readUInt32LE(offset + 4);
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    const chunkEnd = dataEnd + (length % 2);
    if (dataEnd < dataStart || chunkEnd > buffer.length) {
      return false;
    }
    if (type === 'VP8 ') {
      if (
        length < 10 ||
        (buffer[dataStart] & 1) !== 0 ||
        !buffer.subarray(dataStart + 3, dataStart + 6).equals(Buffer.from('9d012a', 'hex'))
      ) {
        return false;
      }
      const width = buffer.readUInt16LE(dataStart + 6) & 0x3fff;
      const height = buffer.readUInt16LE(dataStart + 8) & 0x3fff;
      if (!width || !height || width * height > MAX_IMAGE_PIXELS) {
        return false;
      }
      validImageChunks += 1;
    } else if (type === 'VP8L') {
      if (length < 5 || buffer[dataStart] !== 0x2f) {
        return false;
      }
      const dimensions = buffer.readUInt32LE(dataStart + 1);
      const width = (dimensions & 0x3fff) + 1;
      const height = ((dimensions >>> 14) & 0x3fff) + 1;
      if ((dimensions >>> 29) !== 0 || width * height > MAX_IMAGE_PIXELS) {
        return false;
      }
      validImageChunks += 1;
    }
    offset = chunkEnd;
  }
  return offset === buffer.length && validImageChunks === 1;
}

export function detectAllowedImage(buffer: Buffer): AllowedImage | null {
  if (!Buffer.isBuffer(buffer)) {
    return null;
  }

  if (isValidPng(buffer)) {
    return { extension: 'png', mimeType: 'image/png' };
  }

  if (isValidJpeg(buffer)) {
    return { extension: 'jpg', mimeType: 'image/jpeg' };
  }

  if (WEBP_CHUNK_TYPES.has(buffer.subarray(12, 16).toString('ascii')) && isValidWebp(buffer)) {
    return { extension: 'webp', mimeType: 'image/webp' };
  }

  return null;
}

export function validateImageBuffer(buffer: Buffer): AllowedImage {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new BadRequestException('请选择要上传的图片');
  }
  if (buffer.length > MAX_IMAGE_UPLOAD_BYTES) {
    throw new PayloadTooLargeException('图片大小不能超过10MB');
  }

  const image = detectAllowedImage(buffer);
  if (!image) {
    throw new BadRequestException('仅支持有效的 JPEG、PNG 或 WebP 图片');
  }
  return image;
}

export function validateChunkBuffer(file: Express.Multer.File): Buffer {
  if (!file || !Buffer.isBuffer(file.buffer) || file.buffer.length === 0) {
    throw new BadRequestException('请选择要上传的文件分片');
  }
  if (file.buffer.length > MAX_IMAGE_UPLOAD_BYTES) {
    throw new PayloadTooLargeException('文件分片大小不能超过10MB');
  }
  return file.buffer;
}

export function validateUploadId(uploadId: string): string {
  if (typeof uploadId !== 'string' || !UPLOAD_ID_PATTERN.test(uploadId)) {
    throw new BadRequestException('无效的上传任务Id');
  }
  return uploadId.toLowerCase();
}

export function parseChunkInteger(value: unknown, fieldName: string, minimum: number, maximum: number): number {
  const numberValue = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(numberValue) || numberValue < minimum || numberValue > maximum) {
    throw new BadRequestException(`${fieldName}参数无效`);
  }
  return numberValue;
}

export function createSafeImageFileName(image: AllowedImage): string {
  return `${randomUUID().replaceAll('-', '')}.${image.extension}`;
}

export function getStaticImageMimeType(filePath: string): AllowedImage['mimeType'] | null {
  switch (path.extname(filePath).toLowerCase()) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.webp':
      return 'image/webp';
    default:
      return null;
  }
}
