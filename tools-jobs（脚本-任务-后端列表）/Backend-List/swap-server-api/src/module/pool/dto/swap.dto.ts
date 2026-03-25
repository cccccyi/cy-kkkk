import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

// swap
export class SwapDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    required: true,
  })
  wallet: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    required: true,
  })
  poolId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    required: true,
  })
  actionType: string;

  @IsString()
  @IsOptional()
  @Matches(/^\d+(\.\d{1,18})?$/, {
    message: 'token1 amount must be a valid decimal number with up to 18 decimal places',
  })
  @ApiProperty({
    required: false,
  })
  token1Amount?: string;

  @IsString()
  @IsOptional()
  @Matches(/^\d+(\.\d{1,18})?$/, {
    message: 'token2 amount must be a valid decimal number with up to 18 decimal places',
  })
  @ApiProperty({
    required: false,
  })
  token2Amount?: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    required: true,
  })
  poolUtxo: string;

  // 待广播的交易
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  txHexList: string[];
}
