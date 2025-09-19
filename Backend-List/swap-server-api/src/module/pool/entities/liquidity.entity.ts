import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('dex_liquidity', {
  comment: '流动性操作记录',
})
export class LiquidityEntity {
  @PrimaryGeneratedColumn({ name: 'id', type: 'int', comment: 'ID' })
  public id: number; // 主键，自动递增

  @Index()
  @Column({ name: 'pool_id', type: 'varchar', length: 128, comment: '池子 ID' })
  poolId: string;

  @Index()
  @Column({ name: 'wallet', type: 'varchar', length: 42, comment: '钱包地址' })
  wallet: string;

  @Column({ name: 'action_type', type: 'enum', enum: ['add', 'remove'] })
  public actionType: 'ADD' | 'REMOVE'; //操作类型：添加或移除流动性

  @Column({ name: 'token1_amount', type: 'decimal', precision: 32, scale: 18, default: 0 })
  public token1Amount: string;

  @Column({ name: 'token2_amount', type: 'decimal', precision: 32, scale: 18, default: 0 })
  public token2Amount: string;

  @Column({ name: 'tx_id', type: 'varchar', length: 66, comment: '交易哈希（成功广播后的交易哈希）' })
  public txId: string;

  @Column({ name: 'status', type: 'varchar', length: 64, comment: '链上状态' })
  public status: string;

  @CreateDateColumn({ name: 'broadcasted_at', comment: '广播完成时间' })
  public broadcastedAt: Date;

  @Column({ name: 'confirmations', type: 'int', comment: '交易查询，confirmations' })
  public confirmations: number;

  @Column({ name: 'blocktime', type: 'int', comment: '交易查询，blocktime' })
  public blocktime: number;

  @CreateDateColumn({ name: 'checked_at', comment: '检查时间' })
  public checkedAt: Date;

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  public createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', comment: '更新时间，自动更新为当前时间' })
  public updatedAt: Date;
}
