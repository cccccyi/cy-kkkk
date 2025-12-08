import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('collect')
export class Collect {
  @PrimaryColumn({ type: 'varchar', length: 80, comment: '实体的唯一标识符' })
  id: string;

  // 关联的交易哈希
  @Column({ name: 'transaction_hash' })
  @Index()
  transactionHash: string;

  // 事件发生的时间戳
  @Column({ type: 'bigint' })
  @Index()
  timestamp: number;

  // 发生Collect操作的交易池地址
  @Column()
  @Index()
  pool: string;

  // 流动性所属合约
  @Column({ nullable: true })
  @Index()
  owner?: string;

  // 手续费收取者的钱包地址
  @Column({ nullable: true })
  @Index()
  origin?: string;  

  // 本次Collect操作收取的token0代币数量
  @Column({ type: 'decimal', precision: 30, scale: 18 })
  amount0: string;

  // 本次Collect操作收取的token1代币数量
  @Column({ type: 'decimal', precision: 30, scale: 18 })
  amount1: string;

  // 基于当前代币价格计算的手续费总美元价值
  @Column({ name: 'amount_usd', type: 'decimal', precision: 30, scale: 18, nullable: true })
  amountUSD?: string;

  // 流动性头寸的下限价格刻度
  @Column({ name: 'tick_lower', type: 'bigint' })
  @Index()
  tickLower: number;

  // 流动性头寸的上限价格刻度
  @Column({ name: 'tick_upper', type: 'bigint' })
  @Index()
  tickUpper: number;

  // 该事件在交易日志中的索引位置
  @Column({ name: 'log_index', type: 'bigint', nullable: true })
  logIndex?: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP', comment: '更新时间' })
  updatedAt: Date;
}