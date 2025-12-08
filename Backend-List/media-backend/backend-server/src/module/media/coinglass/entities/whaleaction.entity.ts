import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base';

@Entity('dt_hyperliquid_action', {
  comment: '最新鲸鱼动态',
})
export class WhaleActionEntity extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id', comment: 'ID' })
  public id: number;

  @Column({ type: 'varchar', name: 'coin', length: 128, comment: '币' })
  public coin: string;

  @Column({ type: 'decimal', name: 'create_timestamp', default: 0, comment: '操作时间' })
  public createTimestamp: number;

  @Column({ type: 'decimal', name: 'entry_price', default: 0, comment: '价格' })
  public entryPrice: number;

  @Column({ type: 'decimal', name: 'liquidation_price', default: 0, comment: '爆仓价格' })
  public liquidationPrice: number;

  @Column({ type: 'varchar', name: 'position_usd', length: 50, comment: '仓位' })
  public positionUsd: string;

  @Column({ type: 'decimal', name: 'size', default: 0, comment: '仓位/币' })
  public size: number;

  @Column({ type: 'varchar', name: 'state', length: 128, comment: '类型1买入开多、2卖出开空、3卖出平多、4买入平空' })
  public state: string;

  @Column({ type: 'varchar', name: 'user_id', length: 128, comment: '用户' })
  public userId: string;
}
