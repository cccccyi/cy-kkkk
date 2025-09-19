import { Entity, Column, ManyToOne, Index, PrimaryColumn } from 'typeorm';
import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { Token } from './token.entity';

@ObjectType()
@Entity()
@Index(['token', 'periodStartUnix']) // 更新复合索引
export class TokenHourData {
  @Field(() => ID)
  @PrimaryColumn({ type: 'varchar', length: 64, comment: '唯一 ID（tokenId-小时时间戳）' })
  id: string;

  @Field(() => Token)
  @ManyToOne(() => Token, { onDelete: 'CASCADE' })
  token: Token;

  @Field(() => Int)
  @Column({ type: 'int', comment: '小时时间戳（UTC 整点秒级时间戳）' })
  periodStartUnix: number;

  @Field(() => String, { nullable: true })
  @Column({ type: 'numeric', precision: 78, scale: 18, nullable: true, comment: '小时交易量(USD)' })
  volumeUSD: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'numeric', precision: 78, scale: 18, nullable: true, comment: '小时收盘价（USD）' })
  close: string;

  // 添加其他字段
  @Field(() => String, { nullable: true })
  @Column({ type: 'numeric', precision: 78, scale: 18, nullable: true, comment: '小时价格（USD）' })
  priceUSD: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'numeric', precision: 78, scale: 18, nullable: true, comment: '小时最高价（USD）' })
  high: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'numeric', precision: 78, scale: 18, nullable: true, comment: '小时最低价（USD）' })
  low: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'numeric', precision: 78, scale: 18, nullable: true, comment: '小时开盘价（USD）' })
  open: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'numeric', precision: 78, scale: 18, nullable: true, comment: '小时交易量' })
  volume: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'numeric', precision: 78, scale: 18, nullable: true, comment: '未跟踪交易量(USD)' })
  untrackedVolumeUSD: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'numeric', precision: 78, scale: 18, nullable: true, comment: '总锁仓价值(USD)' })
  totalValueLockedUSD: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'numeric', precision: 78, scale: 18, nullable: true, comment: '总锁仓价值' })
  totalValueLocked: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'numeric', precision: 78, scale: 18, nullable: true, comment: '小时手续费(USD)' })
  feesUSD: string;
}