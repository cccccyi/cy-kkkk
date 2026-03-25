import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base';

@Entity('dt_fear_greed_index', {
  comment: '恐惧贪婪指数',
})
export class FearGreedEntity extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id', comment: 'ID' })
  public id: number;

  @Column({ type: 'int', name: 'create_timestamp', default: 0, comment: '记录时间' })
  public createTimestamp: number;

  @Column({ type: 'int', name: 'current_value', default: 0, comment: '当前数值' })
  public currentValue: number;

  @Column({ type: 'int', name: 'yesterday_value', default: 0, comment: '昨日数值' })
  public yesterdayValue: number;

  @Column({ type: 'int', name: 'last_week_value', default: 0, comment: '上周数值' })
  public lastWeekValue: number;

  @Column({ type: 'int', name: 'bearish_value', default: 0, comment: '看跌投票数' })
  public bearishValue: number;

  @Column({ type: 'int', name: 'bullish_value', default: 0, comment: '看涨投票数' })
  public bullishValue: number;
}
