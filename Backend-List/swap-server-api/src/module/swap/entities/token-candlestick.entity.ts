import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('token_candlestick', { comment: '代币分钟级别K线数据' })
@Index(['tokenAddress', 'timestamp'])
export class TokenCandlestickEntity {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint', comment: 'ID' })
  id: number;

  @Index()
  @Column({ name: 'token_address', type: 'varchar', length: 42, comment: '代币地址' })
  tokenAddress: string;

  @Index()
  @Column({ name: 'timestamp', type: 'int', comment: '时间戳（分钟级别）' })
  timestamp: number;

  @Column({ name: 'open', type: 'decimal', precision: 32, scale: 18, comment: '开盘价' })
  open: string;

  @Column({ name: 'high', type: 'decimal', precision: 32, scale: 18, comment: '最高价' })
  high: string;

  @Column({ name: 'low', type: 'decimal', precision: 32, scale: 18, comment: '最低价' })
  low: string;

  @Column({ name: 'close', type: 'decimal', precision: 32, scale: 18, comment: '收盘价' })
  close: string;

  @Column({ name: 'volume_usd', type: 'decimal', precision: 32, scale: 18, comment: '交易量(USD)' })
  volumeUSD: string;

  @Column({ name: 'trade_count', type: 'int', comment: '交易次数' })
  tradeCount: number;

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', comment: '更新时间' })
  updatedAt: Date;
}