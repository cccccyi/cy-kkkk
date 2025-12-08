import { ObjectType, Field, Int, Float } from '@nestjs/graphql';

// 简化的代币信息 DTO
@ObjectType()
export class SwapToken {
  @Field(() => String)
  id: string;

  @Field(() => String)
  symbol: string;

  @Field(() => String)
  name: string; // 添加name字段

  @Field(() => Int)
  decimals: number;
}

// 交易历史 DTO
@ObjectType()
export class Swap {
  @Field(() => String)
  id: string;

  @Field(() => Int)
  timestamp: number;

  @Field(() => SwapToken)
  token0: SwapToken;

  @Field(() => SwapToken)
  token1: SwapToken;

  @Field(() => String)
  amount0: string;

  @Field(() => String)
  amount1: string;

  @Field(() => String)
  amountUSD: string;

  @Field(() => String)
  sqrtPriceX96: string;

  @Field(() => Int)
  tick: number;

  @Field(() => Int)
  logIndex: number;
}