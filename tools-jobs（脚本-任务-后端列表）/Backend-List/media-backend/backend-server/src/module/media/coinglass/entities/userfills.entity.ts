import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base';

@Entity('dt_hyperliquid_user_fills', {
  comment: '最新鲸鱼交易记录',
})
export class UserFillsEntity extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id', comment: 'ID' })
  public id: number;

  @Column({ type: 'varchar', name: 'coin', length: 128, comment: '币' })
  public coin: string;

  @Column({ type: 'decimal', name: 'px', default: 0, comment: '价格' })
  public px: number;

  @Column({ type: 'decimal', name: 'sz', default: 0, comment: '数量' })
  public sz: number;

  @Column({ type: 'varchar', name: 'side', length: 50, comment: '仓位' })
  public side: string;

  @Column({ type: 'int', name: 'time', default: 0, comment: '操作时间' })
  public time: number;

  @Column({ type: 'varchar', name: 'start_position', length: 50, comment: '' })
  public startPosition: string;

  @Column({ type: 'varchar', name: 'dir', length: 50, comment: '方向' })
  public dir: string;

  @Column({ type: 'varchar', name: 'close_pnl', length: 50, comment: '' })
  public closePnl: string;

  @Column({ type: 'varchar', name: 'hash', length: 50, comment: '交易hash' })
  public hash: string;

  @Column({ type: 'varchar', name: 'oid', length: 50, comment: '' })
  public oid: string;

  @Column({ type: 'varchar', name: 'crossed', length: 50, comment: '' })
  public crossed: string;

  @Column({ type: 'decimal', name: 'fee', default: 0, comment: '手续费' })
  public fee: number;

  @Column({ type: 'varchar', name: 'tid', length: 128, comment: 'tid' })
  public tid: string;

  @Column({ type: 'varchar', name: 'fee_token', length: 128, comment: '手续费计价币' })
  public feeToken: string;

  @Column({ type: 'varchar', name: 'user_id', length: 128, comment: '用户' })
  public userId: string;
}
