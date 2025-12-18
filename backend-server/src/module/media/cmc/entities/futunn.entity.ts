import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base';

@Entity('dt_crawl_brokerage_coin_list', {
  comment: '券商_加密货币',
})
export class FutunnCoinEntity extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id', comment: 'ID' })
  public id: number;

  @Column({ type: 'varchar', name: 'exchange', length: 32, comment: '所属券商 futnn  shengli' })
  public exchange: string;

  @Column({ type: 'varchar', name: 'source', length: 32, comment: '数据来源 hashkey osl' })
  public source: string;

  @Column({ type: 'int', name: 'stockId', comment: '平台内的ID' })
  public stockId: number;

  @Column({ type: 'varchar', name: 'name', length: 32, comment: '名称' })
  public name: string;

  @Column({ type: 'varchar', name: 'stockCode', length: 32, comment: '对应代码' })
  public stockCode: string;

  @Column({ type: 'varchar', name: 'iconUrl', length: 32, comment: '图标链接' })
  public iconUrl: string;

  @Column({ type: 'decimal', name: 'price', default: 0, comment: '价格' })
  public price: number;

  @Column({ type: 'decimal', name: 'priceChange', default: 0, comment: '价格变化' })
  public priceChange: number;

  @Column({ type: 'varchar', name: 'changeRatio', length: 32, comment: '价格变化率' })
  public changeRatio: string;

  @Column({ type: 'varchar', name: 'priceDirect', length: 32, comment: '价格趋势' })
  public priceDirect: string;

  @Column({ type: 'decimal', name: 'priceLastClose', default: 0, comment: '上次收盘价' })
  public priceLastClose: number;

  @Column({ type: 'decimal', name: 'priceOpen', default: 0, comment: '开盘价' })
  public priceOpen: number;

  @Column({ type: 'decimal', name: 'priceHighest', default: 0, comment: '最高价' })
  public priceHighest: number;

  @Column({ type: 'decimal', name: 'priceLowest', default: 0, comment: '最低价' })
  public priceLowest: number;

  @Column({ type: 'decimal', name: 'volume', default: 0, comment: '今日成交量' })
  public volume: number;

  @Column({ type: 'decimal', name: 'turnover', default: 0, comment: '今日成交额' })
  public turnover: number;

  @Column({ type: 'decimal', name: 'priceHighest_24h', default: 0, comment: '近24H最高价' })
  public priceHighest_24h: number;

  @Column({ type: 'decimal', name: 'priceLowest_24h', default: 0, comment: '近24H最低价' })
  public priceLowest_24h: number;

  @Column({ type: 'decimal', name: 'volume_24h', default: 0, comment: '近24H成交量' })
  public volume_24h: number;

  @Column({ type: 'decimal', name: 'turnover_24h', default: 0, comment: '近24H成交额' })
  public turnover_24h: number;

  @Column({ type: 'decimal', name: 'priceChange_24h', default: 0, comment: '近24H价格变化' })
  public priceChange_24h: number;

  @Column({ type: 'varchar', name: 'ratioPriceChange_24h', length: 32, comment: '近24H价格变化率' })
  public ratioPriceChange_24h: string;

  @Column({ type: 'varchar', name: 'outstandingShares', length: 32, comment: '流通供应量' })
  public outstandingShares: string;

  @Column({ type: 'varchar', name: 'outstandingMarketCap', length: 32, comment: '流通市值' })
  public outstandingMarketCap: string;

  @Column({ type: 'decimal', name: 'priceHighestHistory', default: 0, comment: '历史最高价' })
  public priceHighestHistory: number;

  @Column({ type: 'decimal', name: 'priceLowestHistory', default: 0, comment: '历史最低价' })
  public priceLowestHistory: number;

  @Column({ type: 'decimal', name: 'priceHighest_52week', default: 0, comment: '52周最高价' })
  public priceHighest_52week: number;

  @Column({ type: 'decimal', name: 'priceLowest_52week', default: 0, comment: '52周最低价' })
  public priceLowest_52week: number;
}
