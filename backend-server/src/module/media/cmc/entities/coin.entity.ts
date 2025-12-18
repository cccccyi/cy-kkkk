import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base';

@Entity('dt_crawl_cmc_coin_list', {
  comment: '代币—CMC数据',
})
export class CoinEntity extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id', comment: 'ID' })
  public id: number;

  @Column({ type: 'varchar', name: 'name', length: 64, comment: '名称' })
  public name: string;

  @Column({ type: 'varchar', name: 'symbol', length: 64, comment: 'symbol' })
  public symbol: string;

  @Column({ type: 'varchar', name: 'slug', length: 64, comment: '标识' })
  public slug: string;

  @Column({ type: 'int', name: 'cmcRank', comment: '排行' })
  public cmcRank: number;

  @Column({ type: 'int', name: 'marketPairCount', comment: '交易对数量' })
  public marketPairCount: number;

  @Column({ type: 'decimal', name: 'circulatingSupply', default: 0, comment: '流通供给量' })
  public circulatingSupply: number;

  @Column({ type: 'decimal', name: 'totalSupply', default: 0, comment: '总供给量，已发行的代币总量' })
  public totalSupply: number;

  @Column({ type: 'decimal', name: 'maxSupply', default: 0, comment: '最大供给量' })
  public maxSupply: number;

  @Column({ type: 'decimal', name: 'price', default: 0, comment: '价格' })
  public price: number;

  @Column({ type: 'decimal', name: 'high24h', default: 0, comment: '近24H最高价' })
  public high24h: number;

  @Column({ type: 'decimal', name: 'low24h', default: 0, comment: '近24H最低价' })
  public low24h: number;

  @Column({ type: 'decimal', name: 'low7d', default: 0, comment: '近7天最低价' })
  public low7d: number;

  @Column({ type: 'decimal', name: 'high7d', default: 0, comment: '近7天最高价' })
  public high7d: number;

  @Column({ type: 'decimal', name: 'low30d', default: 0, comment: '近30天最低价' })
  public low30d: number;

  @Column({ type: 'decimal', name: 'high30d', default: 0, comment: '近30天最高价' })
  public high30d: number;

  @Column({ type: 'decimal', name: 'low90d', default: 0, comment: '近90天最低价' })
  public low90d: number;

  @Column({ type: 'decimal', name: 'high90d', default: 0, comment: '近90天最高价' })
  public high90d: number;

  @Column({ type: 'decimal', name: 'low52w', default: 0, comment: '近52周最低价' })
  public low52w: number;

  @Column({ type: 'decimal', name: 'high52w', default: 0, comment: '近52周最高价' })
  public high52w: number;

  @Column({ type: 'decimal', name: 'lowAllTime', default: 0, comment: '历史最低价' })
  public lowAllTime: number;

  @Column({ type: 'decimal', name: 'highAllTime', default: 0, comment: '历史最高价' })
  public highAllTime: number;

  @Column({ type: 'decimal', name: 'volume24h', default: 0, comment: '24小时交易量' })
  public volume24h: number;

  @Column({ type: 'decimal', name: 'volume7d', default: 0, comment: '7天交易量' })
  public volume7d: number;

  @Column({ type: 'decimal', name: 'volume30d', default: 0, comment: '30天交易量' })
  public volume30d: number;

  @Column({ type: 'decimal', name: 'marketCap', default: 0, comment: '市值' })
  public marketCap: number;

  @Column({ type: 'decimal', name: 'percentChange1h', default: 0, comment: '价格变化1小时' })
  public percentChange1h: number;

  @Column({ type: 'decimal', name: 'percentChange24h', default: 0, comment: '价格变化24小时' })
  public percentChange24h: number;

  @Column({ type: 'decimal', name: 'percentChange7d', default: 0, comment: '价格变化7天' })
  public percentChange7d: number;

  @Column({ type: 'decimal', name: 'percentChange30d', default: 0, comment: '价格变化30天' })
  public percentChange30d: number;

  @Column({ type: 'decimal', name: 'percentChange60d', default: 0, comment: '价格变化60天' })
  public percentChange60d: number;

  @Column({ type: 'decimal', name: 'percentChange90d', default: 0, comment: '价格变化90天' })
  public percentChange90d: number;

  @Column({ type: 'decimal', name: 'percentChange1y', default: 0, comment: '价格变化1年' })
  public percentChange1y: number;

  @Column({ type: 'decimal', name: 'dominance', default: 0, comment: '市场占有率' })
  public dominance: number;

  @Column({ type: 'decimal', name: 'turnover', default: 0, comment: '24小时换手率 24小时交易量/市值' })
  public turnover: number;

  @Column({ type: 'varchar', name: 'logo', length: 64, comment: '图标' })
  public logo: string;
}
