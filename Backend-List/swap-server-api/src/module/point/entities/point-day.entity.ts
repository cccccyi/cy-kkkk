import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('point_day')
export class PointDay {
  @PrimaryColumn({ name: 'user_address', type: 'varchar', length: 64, comment: '用户钱包地址' })
  @Index()
  userAddress: string;

  @PrimaryColumn({ type: 'date', comment: '日期' })
  @Index()
  date: Date;

  @Column({ name: 'pool_points', type: 'decimal', precision: 30, scale: 6, default: 0, comment: '当日获得的池子积分' })
  poolPoints: number;

  @Column({ name: 'trading_points', type: 'decimal', precision: 30, scale: 6, default: 0, comment: '当日获得的交易积分' })
  tradingPoints: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP', comment: '更新时间' })
  updatedAt: Date;
}