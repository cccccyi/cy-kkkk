import { ObjectType, Field, Int, Float } from '@nestjs/graphql';
import { SwapToken } from './swap.dto';

@ObjectType()
export class PoolV3 {
  @Field(() => String)
  id: string;

  @Field(() => Float)
  volumeUSD: number;

  @Field(() => Float)
  volumeToken1: number;

  @Field(() => Float)
  volumeToken0: number;

  @Field(() => Float)
  untrackedVolumeUSD: number;

  @Field(() => Int)
  txCount: number;

  @Field(() => Float)
  totalValueLockedUSDUntracked: number;

  @Field(() => Float)
  totalValueLockedUSD: number;

  @Field(() => Float)
  totalValueLockedToken1: number;

  @Field(() => Float)
  totalValueLockedToken0: number;

  @Field(() => Float)
  token1Price: number;

  @Field(() => Float)
  totalValueLockedETH: number;

  @Field(() => Float)
  token0Price: number;

  @Field(() => Int)
  tick: number;

  @Field(() => String)
  sqrtPrice: string;

  @Field(() => Int)
  observationIndex: number;

  @Field(() => Int)
  liquidityProviderCount: number;

  @Field(() => String)
  liquidity: string;

  @Field(() => Float)
  feesUSD: number;

  @Field(() => Int)
  feeTier: number;

  @Field(() => Int)
  createdAtTimestamp: number;

  @Field(() => Int)
  createdAtBlockNumber: number;

  @Field(() => Float)
  collectedFeesUSD: number;

  @Field(() => Float)
  collectedFeesToken1: number;

  @Field(() => Float)
  collectedFeesToken0: number;

  @Field(() => SwapToken)
  token0: SwapToken;

  @Field(() => SwapToken)
  token1: SwapToken;
}