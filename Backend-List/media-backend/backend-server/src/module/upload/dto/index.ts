import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsString, Matches, Max, MaxLength, Min } from 'class-validator';
import { MAX_CHUNK_COUNT } from '../upload-security';

const UPLOAD_ID_PATTERN = /^[a-f0-9]{32}$/i;
const FLAT_FILE_NAME_PATTERN = /^[^/\\\0]+$/;

export class FileUploadDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  file: any;
}
export class uploadIdDto {
  @ApiProperty({ type: 'string' })
  @IsString()
  @Matches(UPLOAD_ID_PATTERN)
  uploadId: string;
}
export class ChunkFileDto {
  @ApiProperty({ type: 'integer', minimum: 0, maximum: MAX_CHUNK_COUNT - 1 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(MAX_CHUNK_COUNT - 1)
  index: number;
  @ApiProperty({ type: 'integer', minimum: 1, maximum: MAX_CHUNK_COUNT })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_CHUNK_COUNT)
  totalChunks: number;
  @ApiProperty({ type: 'string' })
  @IsString()
  @Matches(UPLOAD_ID_PATTERN)
  uploadId: string;
  @ApiProperty({ type: 'string' })
  @IsString()
  @MaxLength(255)
  @Matches(FLAT_FILE_NAME_PATTERN)
  fileName: string;
}

export class ChunkMergeFileDto {
  @ApiProperty({ type: 'string' })
  @IsString()
  @Matches(UPLOAD_ID_PATTERN)
  uploadId: string;
  @ApiProperty({ type: 'string' })
  @IsString()
  @MaxLength(255)
  @Matches(FLAT_FILE_NAME_PATTERN)
  fileName: string;
}
