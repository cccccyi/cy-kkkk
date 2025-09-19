import { ObjectType, Field, Int, Float } from '@nestjs/graphql';
import { TokenCandlestickEntity } from '../../swap/entities/token-candlestick.entity';

@ObjectType()
export class TokenCandlestick {
  @Field(() => String)
  tokenAddress: string;

  @Field(() => Int)
  timestamp: number;

  @Field(() => String)
  open: string;

  @Field(() => String)
  high: string;

  @Field(() => String)
  low: string;

  @Field(() => String)
  close: string;

  @Field(() => String)
  volumeUSD: string;

  @Field(() => Int)
  tradeCount: number;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;

  // 从实体转换为DTO
  static fromEntity(entity: TokenCandlestickEntity): TokenCandlestick {
    const dto = new TokenCandlestick();
    dto.tokenAddress = entity.tokenAddress;
    dto.timestamp = entity.timestamp;
    dto.open = entity.open;
    dto.high = entity.high;
    dto.low = entity.low;
    dto.close = entity.close;
    dto.volumeUSD = entity.volumeUSD;
    dto.tradeCount = entity.tradeCount;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }
}