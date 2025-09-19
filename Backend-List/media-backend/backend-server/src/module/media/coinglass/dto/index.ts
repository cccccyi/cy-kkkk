import { IsString, IsJSON, IsEnum, IsPhoneNumber, IsArray, Min, Length, IsOptional, IsBoolean, IsNumber, IsNumberString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PagingDto } from 'src/common/dto/index';

export enum StatusEnum {
  STATIC = '0',
  DYNAMIC = '1',
}

export class CreatePostDto {
  @IsString()
  @Length(0, 50)
  postName: string;

  @IsString()
  @Length(0, 64)
  postCode: string;

  @IsOptional()
  @IsString()
  @IsEnum(StatusEnum)
  status?: string;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  remark?: string;

  @ApiProperty({ required: true })
  @IsOptional()
  @IsNumber()
  postSort?: number;
}

export class UpdatePostDto extends CreatePostDto {
  @ApiProperty({
    required: true,
  })
  @IsString()
  postId: string;
}

export class ListWhaleDto extends PagingDto {
  @IsOptional()
  @IsString()
  coin?: string;

  @IsOptional()
  @IsString()
  direction?: string;

  @IsOptional()
  @IsString()
  pnl?: string;

  @IsOptional()
  @IsString()
  funding?: string;
}

export class ListUserFillsDto extends PagingDto {
  @IsOptional()
  @IsString()
  userId?: string;
}

export class CrawlQueryDto {
  @ApiProperty({
    required: true,
  })
  @IsString()
  interval: string;
}
