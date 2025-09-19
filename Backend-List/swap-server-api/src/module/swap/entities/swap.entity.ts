import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('swap', { comment: '从子图同步的交易数据' })
export class SwapEntity {
  @PrimaryColumn({ type: 'varchar', length: 80, comment: '唯一标识符，格式为交易哈希#日志索引' })
  id: string;

  // 关联的交易哈希
  @Column({ name: 'transaction_hash', type: 'varchar', length: 128, comment: '交易哈希' })
  @Index()
  transactionHash: string;

  @Column({ type: 'bigint', comment: '交易发生的时间戳' })
  @Index()
  timestamp: number;

  @Column({ name: 'pool', type: 'varchar', length: 42, comment: '发生交换的流动性池地址' })
  @Index()
  pool: string;

  @Column({ name: 'token0', type: 'varchar', length: 42, comment: '池中交易对的第一个代币地址' })
  @Index()
  token0: string;

  @Column({ name: 'token1', type: 'varchar', length: 42, comment: '池中交易对的第二个代币地址' })
  @Index()
  token1: string;

  @Column({ type: 'varchar', length: 42, comment: '发起交换的地址' })
  @Index()
  sender: string;

  @Column({ type: 'varchar', length: 42, comment: '接收交换结果的地址' })
  @Index()
  recipient: string;

  @Column({ type: 'varchar', length: 42, comment: '发起交易的外部账户地址(EOA)' })
  @Index()
  origin: string;

  @Column({ type: 'decimal', precision: 30, scale: 18, comment: 'token0的交换数量' })
  amount0: string;

  @Column({ type: 'decimal', precision: 30, scale: 18, comment: 'token1的交换数量' })
  amount1: string;

  @Column({ name: 'amount_usd', type: 'decimal', precision: 30, scale: 18, comment: '交换金额的美元价值' })
  amountUSD: string;

  @Column({ name: 'sqrt_price_x96', type: 'decimal', precision: 60, scale: 0, comment: '交换后的价格平方根，以Q64.96定点数格式表示' })
  sqrtPriceX96: string;

  @Column({ type: 'bigint', comment: '交换后的价格位，代表池中的当前价格水平' })
  tick: number;

  @Column({ name: 'log_index', type: 'bigint', nullable: true, comment: '事件在交易日志中的索引位置' })
  logIndex: number;

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', comment: '更新时间' })
  updatedAt: Date;
}