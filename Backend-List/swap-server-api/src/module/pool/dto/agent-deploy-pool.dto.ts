import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

// 部署池子
export class AgentDeployPoolDto {
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
  token1Addr: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    required: true,
  })
  token2Addr: string;

  // 提供费用交易
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    required: true,
  })
  txHex: string;
}
