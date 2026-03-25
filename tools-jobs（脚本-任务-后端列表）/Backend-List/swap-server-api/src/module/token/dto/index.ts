import { IsString, IsJSON, IsEnum, IsPhoneNumber, Min, Length, IsOptional, IsBoolean, IsNumber, IsNotEmpty, IsPositive, Validate, Matches, IsNumberString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { PagingDto } from 'src/common/dto/index';

export enum StatusEnum {
  STATIC = '0',
  DYNAMIC = '1',
}
export enum TypeEnum {
  Instruct = '1',
  Notice = '2',
}
export class CreateNoticeDto {
  @IsString()
  @Length(0, 50)
  noticeTitle: string;

  @IsString()
  @IsEnum(TypeEnum)
  noticeType: string;

  @ApiProperty({
    required: true,
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  remark?: string;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsEnum(StatusEnum)
  status?: string;

  @IsOptional()
  @IsString()
  noticeContent?: string;
}

export class UpdateNoticeDto extends CreateNoticeDto {
  @IsNumber()
  noticeId: number;
}

export class ListNoticeDto extends PagingDto {
  @IsOptional()
  @IsString()
  @Length(0, 50)
  noticeTitle?: string;

  @IsOptional()
  @IsString()
  @IsEnum(TypeEnum)
  noticeType?: string;

  @IsOptional()
  @IsString()
  createBy?: string;
}

// Token列表
export class ListTokenDto extends PagingDto {
  @IsOptional()
  @IsString()
  @ApiProperty({
    required: false,
  })
  keyword?: string;
}

// Pairs列表
export class ListPairsDto extends PagingDto {
  @IsOptional()
  @IsString()
  name?: string;
}

// 部署流动性
export class DeployLiquidityDto {
  @IsString()
  @IsNotEmpty()
  poolId: string;

  @IsString()
  @IsNotEmpty()
  poolAddr: string;

  @IsString()
  @IsNotEmpty()
  poolName: string;

  @IsString()
  @IsNotEmpty()
  poolSymbol: string;

  @IsNumber()
  @IsNotEmpty()
  decimals: number;

  @IsString()
  @IsNotEmpty()
  token1Addr: string;

  @IsString()
  @IsNotEmpty()
  token2Addr: string;

  @IsString()
  @IsNotEmpty()
  userAddr: string;

  @IsString()
  @IsNotEmpty()
  genesisTxid: string;

  @IsString()
  @IsNotEmpty()
  genesisTxHex: string;

  @IsString()
  @IsNotEmpty()
  revealTxid: string;

  @IsString()
  @IsNotEmpty()
  revealTxHex: string;
}
