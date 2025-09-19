import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index, PrimaryColumn } from 'typeorm';

@Entity('position_day_liquidity')
export class PositionDayLiquidity {
  // 使用复合主键：poolAddress + userAddress + date + tickLower + tickUpper
  @PrimaryColumn({ type: 'varchar', length: 64, comment: '池子地址' })
  pool: string;

  @PrimaryColumn({ name: 'user_address', type: 'varchar', length: 64, comment: '用户钱包地址' })
  @Index()
  userAddress: string;

  @PrimaryColumn({ type: 'date', comment: '日期' })
  @Index()
  date: Date;

  @PrimaryColumn({ name: 'tick_lower', type: 'bigint', comment: '价格下限' })
  tickLower: number;

  @PrimaryColumn({ name: 'tick_upper', type: 'bigint', comment: '价格上限' })
  tickUpper: number;

  @Column({ type: 'varchar', length: 64, comment: '代币0地址' })
  token0: string;

  @Column({ type: 'varchar', length: 64, comment: '代币1地址' })
  token1: string;

  // 增加precision值以避免数值溢出
  @Column({ type: 'decimal', precision: 40, scale: 0, default: 0, comment: '净流动性数量' })
  liquidity: string;

  @Column({ type: 'decimal', precision: 40, scale: 18, default: 0, comment: '净代币0数量' })
  amount0: string;

  @Column({ type: 'decimal', precision: 40, scale: 18, default: 0, comment: '净代币1数量' })
  amount1: string;

  @Column({ name: 'total_mint_liquidity', type: 'decimal', precision: 40, scale: 0, default: 0, comment: '添加的流动性总量' })
  totalMintLiquidity: string;

  @Column({ name: 'total_burn_liquidity', type: 'decimal', precision: 40, scale: 0, default: 0, comment: '移除的流动性总量' })
  totalBurnLiquidity: string;

  @Column({ name: 'liquidity_usd', type: 'decimal', precision: 40, scale: 18, default: 0, nullable: true, comment: '按美元计算的流动性价值' })
  liquidityUSD?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP', comment: '更新时间' })
  updatedAt: Date;
}