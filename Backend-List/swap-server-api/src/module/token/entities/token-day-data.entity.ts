import { Entity, Column, ManyToOne, Index, PrimaryColumn } from 'typeorm';
import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { Token } from './token.entity';

@ObjectType()
@Entity()
@Index(['token', 'date']) // 复合索引，提高查询效率
export class TokenDayData {
  @Field(() => ID)
  @PrimaryColumn({ type: 'varchar', length: 64, comment: '唯一 ID（tokenId-日期）' })
  id: string;

  @Field(() => Token)
  @ManyToOne(() => Token, (token) => token.dayData, { onDelete: 'CASCADE' })
  token: Token;

  @Field(() => Int)
  @Column({ type: 'int', comment: '日期（UTC 0 点秒级时间戳）' })
  date: number;

  @Field(() => String, { nullable: true })
  @Column({ type: 'numeric', precision: 78, scale: 18, nullable: true, comment: '当天收盘价（USD）' })
  close: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'numeric', precision: 78, scale: 18, nullable: true, comment: '日期（UTC 0 点秒级时间戳）' })
  feesUSD: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'numeric', precision: 78, scale: 18, nullable: true, comment: '当天最高价（USD）' })
  high: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'numeric', precision: 78, scale: 18, nullable: true, comment: '当天最低价（USD）' })
  low: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'numeric', precision: 78, scale: 18, nullable: true, comment: '当天开盘价（USD）' })
  open: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'numeric', precision: 78, scale: 18, nullable: true, comment: '当天价格（USD，通常是最后一笔）' })
  priceUSD: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'numeric', precision: 78, scale: 18, nullable: true, comment: '当天锁仓数量（token 数量）' })
  totalValueLocked: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'numeric', precision: 78, scale: 18, nullable: true, comment: '当天锁仓价值（USD）' })
  totalValueLockedUSD: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'numeric', precision: 78, scale: 18, nullable: true, comment: '未跟踪的交易量（USD）' })
  untrackedVolumeUSD: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'numeric', precision: 78, scale: 18, nullable: true, comment: '当天交易量（token 数量）' })
  volume: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'numeric', precision: 78, scale: 18, nullable: true, comment: '当天交易量（USD）' })
  volumeUSD: string;
}
