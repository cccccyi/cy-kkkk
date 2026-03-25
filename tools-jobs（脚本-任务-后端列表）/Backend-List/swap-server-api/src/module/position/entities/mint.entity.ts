import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index, PrimaryColumn } from 'typeorm';

@Entity('mint')
export class Mint {
  @PrimaryColumn({ type: 'varchar', length: 80, comment: 'ID' })
  id: number;

  @Column({ name: 'tx_id' })
  @Index()
  txId: string;

  // 关联的交易哈希
  @Column({ name: 'transaction_hash' })
  @Index()
  transactionHash: string;

  // 交易时间戳
  @Column({ type: 'bigint' })
  @Index()
  timestamp: number;

  // 流动性添加的目标交易池地址
  @Column()
  @Index()
  pool: string;

  // 交易池中的代币0地址
  @Column()
  @Index()
  token0: string;

  // 交易池中的代币1地址
  @Column()
  @Index()
  token1: string;

  // 流动性仓位的所有者地址
  @Column()
  @Index()
  owner: string;

  // 执行mint操作的地址
  @Column({ nullable: true })
  @Index()
  sender?: string;

  // 交易的原始发起地址（EOA）
  @Column()
  @Index()
  origin: string;

  // 添加的流动性数量
  @Column({ type: 'bigint' })
  amount: string;

  // 实际添加的token0数量
  @Column({ type: 'decimal', precision: 30, scale: 18 })
  amount0: string;

  // 实际添加的token1数量
  @Column({ type: 'decimal', precision: 30, scale: 18 })
  amount1: string;

  // 按美元计算的添加流动性总价值
  @Column({ name: 'amount_usd', type: 'decimal', precision: 30, scale: 18, nullable: true })
  amountUSD?: string;

  // 流动性添加的价格区间下限
  @Column({ name: 'tick_lower', type: 'bigint' })
  @Index()
  tickLower: number;

  // 流动性添加的价格区间上限
  @Column({ name: 'tick_upper', type: 'bigint' })
  @Index()
  tickUpper: number;

  // 事件在交易日志中的索引位置
  @Column({ name: 'log_index', type: 'bigint', nullable: true })
  logIndex?: number;

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', comment: '更新时间，自动更新为当前时间' })
  updatedAt: Date;
}