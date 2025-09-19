import { Entity, Column, PrimaryColumn, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ObjectType, Field, ID, Float, Int } from '@nestjs/graphql';
import { Token } from '../../token/entities/token.entity';
import { PoolDayData } from './pool-day-data.entity';

// 在Pool实体类前面添加一个新的GraphQL类型定义
@ObjectType()
export class CandlestickData {
  @Field(() => Int)
  timestamp: number;

  @Field(() => Float)
  volumeUSD: number;

  @Field(() => Float, { nullable: true })
  avgPrice: number | null;

  @Field(() => Float, { nullable: true })
  highPrice: number | null;

  @Field(() => Float, { nullable: true })
  lowPrice: number | null;

  @Field(() => Float, { nullable: true })
  openPrice: number | null;

  @Field(() => Float, { nullable: true })
  closePrice: number | null;

  @Field(() => Int)
  txCount: number;

  @Field(() => Float, { nullable: true })
  tvlUSD: number | null;
}

// 修改Pool类中的volumeStats字段
@ObjectType()
@Entity()
export class Pool {
  @Field()
  @PrimaryColumn({ type: 'varchar', length: 42, comment: 'Pool 地址' })
  id: string;

  @Field(() => Float)
  @Column({ type: 'decimal', nullable: true, comment: '池子总交易量 USD' })
  volumeUSD: number;

  @Field(() => Float)
  @Column({ type: 'decimal', nullable: true, comment: 'Token0 的交易量' })
  volumeToken0: number;

  @Field(() => Float)
  @Column({ type: 'decimal', nullable: true, comment: 'Token1 的交易量' })
  volumeToken1: number;

  @Field(() => Float)
  @Column({ type: 'decimal', nullable: true, comment: '未跟踪的交易量 USD' })
  untrackedVolumeUSD: number;

  @Field(() => Int)
  @Column({ type: 'int', nullable: true, comment: '交易次数' })
  txCount: number;

  @Field(() => Float)
  @Column({ type: 'decimal', nullable: true, comment: '未跟踪的 TVL USD' })
  totalValueLockedUSDUntracked: number;

  @Field(() => Float)
  @Column({ type: 'decimal', nullable: true, comment: '总锁仓 TVL USD' })
  totalValueLockedUSD: number;

  @Field(() => Float)
  @Column({ type: 'decimal', nullable: true, comment: 'Token0 总锁仓量' })
  totalValueLockedToken0: number;

  @Field(() => Float)
  @Column({ type: 'decimal', nullable: true, comment: 'Token1 总锁仓量' })
  totalValueLockedToken1: number;

  @Field(() => Float)
  @Column({ type: 'decimal', nullable: true, comment: 'Token0 价格' })
  token0Price: number;

  @Field(() => Float)
  @Column({ type: 'decimal', nullable: true, comment: 'Token1 价格' })
  token1Price: number;

  @Field(() => Float)
  @Column({ type: 'decimal', nullable: true, comment: '总锁仓 TVL ETH' })
  totalValueLockedETH: number;

  @Field(() => Int)
  @Column({ type: 'int', nullable: true, comment: '当前 tick 值' })
  tick: number;

  @Field(() => Float)
  @Column({ type: 'decimal', nullable: true, comment: '当前 sqrtPriceX96' })
  sqrtPrice: number;

  @Field(() => Int)
  @Column({ type: 'int', nullable: true, comment: '观察索引' })
  observationIndex: number;

  @Field(() => Int)
  @Column({ type: 'int', nullable: true, comment: '流动性提供者数量' })
  liquidityProviderCount: number;

  @Field(() => Float)
  @Column({ type: 'decimal', nullable: true, comment: '池子流动性' })
  liquidity: number;

  @Field(() => Float)
  @Column({ type: 'decimal', nullable: true, comment: '池子累计手续费 USD' })
  feesUSD: number;

  @Field(() => Int)
  @Column({ type: 'int', nullable: true, comment: '手续费等级（Fee Tier）' })
  feeTier: number;

  @Field(() => Int)
  @Column({ type: 'int', nullable: true, comment: '创建时间戳' })
  createdAtTimestamp: number;

  @Field(() => Int)
  @Column({ type: 'int', nullable: true, comment: '创建区块号' })
  createdAtBlockNumber: number;

  @Field(() => Float)
  @Column({ type: 'decimal', nullable: true, comment: '已收手续费 USD' })
  collectedFeesUSD: number;

  @Field(() => Float)
  @Column({ type: 'decimal', nullable: true, comment: '已收 Token0 手续费' })
  collectedFeesToken0: number;

  @Field(() => Float)
  @Column({ type: 'decimal', nullable: true, comment: '已收 Token1 手续费' })
  collectedFeesToken1: number;

  // 添加1天和30天交易量字段
  @Field(() => Float)
  @Column({ type: 'decimal', nullable: true, comment: '1天交易量 USD' })
  volumeUSD1D: number;

  @Field(() => Float)
  @Column({ type: 'decimal', nullable: true, comment: '30天交易量 USD' })
  volumeUSD30D: number;

  @Field(() => Token)
  @ManyToOne(() => Token)
  token0: Token;

  @Field(() => Token)
  @ManyToOne(() => Token)
  token1: Token;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;

  @Field(() => [PoolDayData], { nullable: true })
  @OneToMany(() => PoolDayData, (poolDayData) => poolDayData.pool)
  dayData: PoolDayData[];

  @Field(() => [CandlestickData], { nullable: true })
  volumeStats?: CandlestickData[];
}
