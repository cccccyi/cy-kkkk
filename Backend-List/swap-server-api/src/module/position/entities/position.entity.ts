import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('position')
export class Position {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 64, comment: '用户钱包地址' })
  @Index()
  userAddress: string;

  @Column({ type: 'varchar', length: 64, comment: '流动性池ID' })
  @Index()
  poolId: string;

  @Column({ type: 'varchar', length: 64, comment: '代币0地址' })
  token0: string;

  @Column({ type: 'varchar', length: 64, comment: '代币1地址' })
  token1: string;

  @Column({ type: 'varchar', length: 255, comment: '流动性代币ID' })
  liquidityTokenId: string;

  @Column({ type: 'decimal', precision: 30, scale: 18, default: 0, comment: '流动性数量' })
  liquidity: string;

  @Column({ type: 'decimal', precision: 30, scale: 18, default: 0, comment: '价格下限' })
  tickLower: string;

  @Column({ type: 'decimal', precision: 30, scale: 18, default: 0, comment: '价格上限' })
  tickUpper: string;

  @Column({ type: 'decimal', precision: 30, scale: 18, default: 0, comment: '代币0数量' })
  amount0: string;

  @Column({ type: 'decimal', precision: 30, scale: 18, default: 0, comment: '代币1数量' })
  amount1: string;

  @Column({ type: 'varchar', length: 20, default: 'active', comment: '状态: active, closed, removed' })
  @Index()
  status: string;

  @Column({ type: 'varchar', length: 255, nullable: true, comment: '交易哈希' })
  txHash: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP', comment: '更新时间' })
  updatedAt: Date;
}