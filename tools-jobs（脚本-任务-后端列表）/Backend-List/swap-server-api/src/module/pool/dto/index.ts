import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { PagingDto } from 'src/common/dto/index';

// Pairs列表
export class ListPairsDto extends PagingDto {
  @IsOptional()
  @IsString()
  @ApiProperty({
    required: false,
  })
  keyword?: string;
}

// 查找指定池子
export class AgentDeployPoolDto {
  @IsString()
  @IsOptional()
  @ApiProperty({
    required: true,
  })
  poolId: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    required: true,
  })
  token1Addr: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    required: true,
  })
  token2Addr: string;
}
