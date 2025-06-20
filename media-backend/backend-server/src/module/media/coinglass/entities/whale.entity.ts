import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base';

@Entity('dt_hyperliquid_list', {
  comment: '巨鲸操作记录',
})
export class WhaleEntity extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id', comment: 'ID' })
  public id: number;

  @Column({ type: 'varchar', name: 'coin', length: 128, comment: '币' })
  public coin: string;

  @Column({ type: 'decimal', name: 'create_timestamp', default: 0, comment: '开仓时间' })
  public createTimestamp: number;

  @Column({ type: 'decimal', name: 'entry_price', default: 0, comment: '开仓价格' })
  public entryPrice: number;

  @Column({ type: 'decimal', name: 'funding_fee', default: 0, comment: '资金费' })
  public fundingFee: number;

  @Column({ type: 'varchar', name: 'leverage', comment: '杠杆' })
  public leverage: string;

  @Column({ type: 'decimal', name: 'liquidation_price', default: 0, comment: '爆仓价格' })
  public liquidationPrice: number;

  @Column({ type: 'decimal', name: 'margin', default: 0, comment: '保证金' })
  public margin: number;

  @Column({ type: 'varchar', name: 'position_type', comment: 'position_type' })
  public positionType: string;

  @Column({ type: 'varchar', name: 'position_usd', length: 50, comment: '仓位' })
  public positionUsd: string;

  @Column({ type: 'decimal', name: 'price', default: 0, comment: '价格' })
  public price: number;

  @Column({ type: 'decimal', name: 'size', default: 0, comment: '仓位/币' })
  public size: number;

  @Column({ type: 'varchar', name: 'type', length: 128, comment: 'in_reply_to_status_id' })
  public type: string;

  @Column({ type: 'decimal', name: 'unrealized_pnl', default: 0, comment: '未实现盈亏' })
  public unrealizedPnl: number;

  @Column({ type: 'int', name: 'update_time_api', comment: '修改时间' })
  public updateTimeApi: number;

  @Column({ type: 'varchar', name: 'user_id', length: 128, comment: '用户' })
  public userId: string;
}
