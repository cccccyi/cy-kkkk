import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base';

@Entity('dt_crawl_exchange_list', {
  comment: '交易所—CMC数据',
})
export class ExchangeEntity extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id', comment: 'ID' })
  public id: number;

  @Column({ type: 'varchar', name: 'name', length: 64, comment: '名称' })
  public name: string;

  @Column({ type: 'varchar', name: 'slug', length: 64, comment: '标识' })
  public slug: string;

  @Column({ type: 'int', name: 'rank', comment: '排行' })
  public rank: number;

  @Column({ type: 'int', name: 'derivativesRank', comment: '衍生品排行' })
  public derivativesRank: number;

  @Column({ type: 'int', name: 'dexStatus', comment: '0为CEX,1为DEX' })
  public dexStatus: number;

  @Column({ type: 'int', name: 'platformId', comment: 'platformId' })
  public platformId: number;

  @Column({ type: 'decimal', name: 'score', default: 0, comment: '综合评分' })
  public score: number;

  @Column({ type: 'decimal', name: 'filteredTotalVol24h', default: 0, comment: '24H交易量，页面显示' })
  public filteredTotalVol24h: number;

  @Column({ type: 'decimal', name: 'totalVol24h', default: 0, comment: '24H总交易量' })
  public totalVol24h: number;

  @Column({ type: 'decimal', name: 'totalVolAdjusted24h', default: 0, comment: '调整后24H总交易量' })
  public totalVolAdjusted24h: number;

  @Column({ type: 'decimal', name: 'totalVol7d', default: 0, comment: '过去7天总交易量' })
  public totalVol7d: number;

  @Column({ type: 'decimal', name: 'totalVol30d', default: 0, comment: '过去30天总交易量' })
  public totalVol30d: number;

  @Column({ type: 'decimal', name: 'spotVol24h', default: 0, comment: '现货市场24H交易量' })
  public spotVol24h: number;

  @Column({ type: 'decimal', name: 'derivativesVol24h', default: 0, comment: '衍生品市场24H交易量' })
  public derivativesVol24h: number;

  @Column({ type: 'decimal', name: 'derivativesOpenInterests', default: 0, comment: '衍生品市场未平仓合约总量' })
  public derivativesOpenInterests: number;

  @Column({ type: 'decimal', name: 'derivativesMarketPairs', default: 0, comment: '衍生品市场交易对数量' })
  public derivativesMarketPairs: number;

  @Column({ type: 'decimal', name: 'totalVolChgPct24h', default: 0, comment: '24H总交易量变化百分比' })
  public totalVolChgPct24h: number;

  @Column({ type: 'decimal', name: 'totalVolChgPct7d', default: 0, comment: '7天总交易量变化百分比' })
  public totalVolChgPct7d: number;

  @Column({ type: 'decimal', name: 'totalVolChgPct30d', default: 0, comment: '30天总交易量变化百分比' })
  public totalVolChgPct30d: number;

  @Column({ type: 'int', name: 'visits', default: 0, comment: '交易所访问量' })
  public visits: number;

  @Column({ type: 'int', name: 'liquidity', default: 0, comment: '流动性评分' })
  public liquidity: number;

  @Column({ type: 'int', name: 'numMarkets', default: 0, comment: '交易对总数' })
  public numMarkets: number;

  @Column({ type: 'int', name: 'numCoins', default: 0, comment: '币种数量' })
  public numCoins: number;

  @Column({ type: 'varchar', name: 'type', comment: '类型-与采集请求有关' })
  public type: string;

  @Column({ type: 'varchar', name: 'descriptionEn', comment: '描述信息-英文' })
  public descriptionEn: string;

  @Column({ type: 'varchar', name: 'descriptionZh', comment: '描述信息-中文' })
  public descriptionZh: string;

  @Column({ type: 'varchar', name: 'websiteUrl', length: 128, comment: '网站链接' })
  public websiteUrl: string;

  @Column({ type: 'varchar', name: 'feeUrl', length: 256, comment: '费用链接' })
  public feeUrl: string;

  @Column({ type: 'varchar', name: 'chatUrl', length: 256, comment: '聊天链接' })
  public chatUrl: string;

  @Column({ type: 'varchar', name: 'twitterUrl', length: 256, comment: 'X链接' })
  public twitterUrl: string;

  @Column({ type: 'varchar', name: 'logo', length: 64, comment: '图标' })
  public logo: string;
}
