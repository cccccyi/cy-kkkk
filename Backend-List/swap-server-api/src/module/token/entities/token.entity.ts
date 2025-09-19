import { Entity, Column, PrimaryColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { TokenDayData } from './token-day-data.entity';
import { TokenHourData } from './token-hour-data.entity';
import { TokenCandlestick } from '../dto/token-candlestick.dto';

@ObjectType()
@Entity()
export class Token {
  @Field(() => ID)
  @PrimaryColumn({ type: 'varchar', length: 42 })
  id: string; // token address

  @Field({ nullable: true })
  @Column({ type: 'varchar', nullable: true })
  name: string;

  @Field({ nullable: true })
  @Column({ type: 'varchar', nullable: true })
  symbol: string;

  // 添加代币描述字段
  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true, comment: '代币描述信息' })
  description?: string;

  @Field(() => String) // BigInt 用 String 暴露
  @Column({ type: 'bigint', default: 0 })
  poolCount: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'numeric', precision: 78, scale: 0, nullable: true })
  totalSupply: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'numeric', precision: 78, scale: 18, nullable: true })
  totalValueLocked: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'numeric', precision: 78, scale: 18, nullable: true })
  totalValueLockedUSD: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'numeric', precision: 78, scale: 18, nullable: true })
  totalValueLockedUSDUntracked: string;

  @Field(() => String)
  @Column({ type: 'bigint', default: 0 })
  txCount: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'numeric', precision: 78, scale: 18, nullable: true })
  untrackedVolumeUSD: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'numeric', precision: 78, scale: 18, nullable: true })
  volume: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'numeric', precision: 78, scale: 18, nullable: true })
  volumeUSD: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'numeric', precision: 78, scale: 18, nullable: true })
  feesUSD: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'numeric', precision: 78, scale: 18, nullable: true })
  derivedETH: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'numeric', precision: 78, scale: 18, nullable: true })
  currentPrice: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'numeric', precision: 78, scale: 18, nullable: true, comment: '1小时价格变化率' })
  priceChange1h: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'numeric', precision: 78, scale: 18, nullable: true, comment: '24小时价格变化率' })
  priceChange24h: string;

  @Field(() => Int, { nullable: true })
  @Column({ type: 'int', default: 18 })
  decimals: number;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;

  @Field(() => [TokenDayData], { nullable: true })
  @OneToMany(() => TokenDayData, (tokenDayData) => tokenDayData.token)
  dayData: TokenDayData[];

  // 添加与小时数据的关联
  @Field(() => [TokenHourData], { nullable: true })
  @OneToMany(() => TokenHourData, (tokenHourData) => tokenHourData.token)
  hourData: TokenHourData[];

  // 添加新的交易量字段
  @Field(() => String, { nullable: true })
  @Column({ type: 'numeric', precision: 78, scale: 18, nullable: true, comment: '1小时交易量(USD)' })
  volumeUSD1h: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'numeric', precision: 78, scale: 18, nullable: true, comment: '1天交易量(USD)' })
  volumeUSD1d: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'numeric', precision: 78, scale: 18, nullable: true, comment: '1周交易量(USD)' })
  volumeUSD1w: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'numeric', precision: 78, scale: 18, nullable: true, comment: '1月交易量(USD)' })
  volumeUSD1m: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'numeric', precision: 78, scale: 18, nullable: true, comment: '1年交易量(USD)' })
  volumeUSD1y: string;

  // 添加52周最高价格和最低价格字段
  @Field(() => String, { nullable: true })
  @Column({ type: 'numeric', precision: 78, scale: 18, nullable: true, comment: '52周最高价格(USD)' })
  highPrice52w: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'numeric', precision: 78, scale: 18, nullable: true, comment: '52周最低价格(USD)' })
  lowPrice52w: string;

  @Field(() => [TokenCandlestick], { nullable: true })
  candlestickData24h?: TokenCandlestick[];
}
