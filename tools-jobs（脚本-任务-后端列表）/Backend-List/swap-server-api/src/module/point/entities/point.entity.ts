import { Entity, PrimaryColumn, Column, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
@Entity('point')
export class Point {
  @Field(() => ID)
  @PrimaryColumn({ name: 'user_address', type: 'varchar', length: 64, comment: '用户钱包地址' })
  @Index()
  userAddress: string;

  @Field(() => Number)
  @Column({ name: 'liquidity_points', type: 'decimal', precision: 30, scale: 6, default: 0, comment: '累计获得的提供流动性积分' })
  liquidityPoints: number;

  @Field(() => Number)
  @Column({ name: 'trading_points', type: 'decimal', precision: 30, scale: 6, default: 0, comment: '累计获得的交易积分' })
  tradingPoints: number;

  @Field(() => Date)
  @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', comment: '创建时间' })
  createdAt: Date;

  @Field(() => Date)
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP', comment: '更新时间' })
  updatedAt: Date;
}