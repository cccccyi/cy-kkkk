import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ObjectType, Field, Int, Float } from '@nestjs/graphql';
import { Pool } from './pool.entity';

@ObjectType()
@Entity({ name: 'pool_day_data' })
export class PoolDayData {
  @Field()
  @PrimaryColumn({ type: 'varchar', comment: '唯一 ID (poolId-date)' })
  id: string;

  @Field(() => Float)
  @Column({ type: 'decimal', nullable: true, comment: '收盘价 (close)' })
  close: number;

  @Field(() => Int)
  @Column({ type: 'int', comment: '日期 (UTC 秒级时间戳，按天划分)' })
  date: number;

  @Field(() => Float)
  @Column({ type: 'decimal', nullable: true, comment: '当天手续费收入 USD' })
  feesUSD: number;

  @Field(() => Float)
  @Column({ type: 'decimal', nullable: true, comment: '当天最高价 (high)' })
  high: number;

  @Field(() => Float)
  @Column({ type: 'decimal', nullable: true, comment: '当天池子流动性' })
  liquidity: number;

  @Field(() => Float)
  @Column({ type: 'decimal', nullable: true, comment: '当天最低价 (low)' })
  low: number;

  @Field(() => Float)
  @Column({ type: 'decimal', nullable: true, comment: '当天开盘价 (open)' })
  open: number;

  @Field(() => Float)
  @Column({ type: 'decimal', nullable: true, comment: '当天 sqrtPriceX96' })
  sqrtPrice: number;

  @Field(() => Int)
  @Column({ type: 'int', nullable: true, comment: '当天 tick 值' })
  tick: number;

  @Field(() => Float)
  @Column({ type: 'decimal', nullable: true, comment: '当天 token0 价格' })
  token0Price: number;

  @Field(() => Float)
  @Column({ type: 'decimal', nullable: true, comment: '当天 token1 价格' })
  token1Price: number;

  @Field(() => Float)
  @Column({ type: 'decimal', nullable: true, comment: '当天总锁仓价值 (TVL USD)' })
  tvlUSD: number;

  @Field(() => Int)
  @Column({ type: 'int', nullable: true, comment: '当天交易次数' })
  txCount: number;

  @Field(() => Float)
  @Column({ type: 'decimal', nullable: true, comment: '当天交易量 Token0' })
  volumeToken0: number;

  @Field(() => Float)
  @Column({ type: 'decimal', nullable: true, comment: '当天交易量 Token1' })
  volumeToken1: number;

  @Field(() => Float)
  @Column({ type: 'decimal', nullable: true, comment: '当天交易量 USD' })
  volumeUSD: number;

  // 关联 Pool
  @Field(() => Pool)
  @ManyToOne(() => Pool, { eager: false })
  @JoinColumn({ name: 'poolId' })
  pool: Pool;

  @Column({ type: 'varchar', length: 42, comment: 'Pool 地址' })
  poolId: string;
}
