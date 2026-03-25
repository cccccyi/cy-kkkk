import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base';

@Entity('dt_crawl_market_pairs_list', {
  comment: '交易对—CMC数据',
})
export class PairEntity extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id', comment: 'ID' })
  public id: number;

  @Column({ type: 'int', name: 'marketId', comment: '唯一标识' })
  public marketId: number;

  @Column({ type: 'varchar', name: 'marketPair', length: 64, comment: '交易对' })
  public marketPair: string;

  @Column({ type: 'int', name: 'rank', comment: '排行' })
  public rank: number;

  @Column({ type: 'int', name: 'exchangeId', comment: '所属交易所ID' })
  public exchangeId: number;

  @Column({ type: 'varchar', name: 'exchangeName', length: 32, comment: '所属交易所名称' })
  public exchangeName: string;

  @Column({ type: 'varchar', name: 'exchangeSlug', length: 32, comment: '所属交易所Slug' })
  public exchangeSlug: string;

  @Column({ type: 'varchar', name: 'category', length: 32, comment: '类型spot现货' })
  public category: string;

  @Column({ type: 'varchar', name: 'marketUrl', length: 128, comment: '链接' })
  public marketUrl: string;

  @Column({ type: 'varchar', name: 'baseSymbol', length: 32, comment: '基础货币符号' })
  public baseSymbol: string;

  @Column({ type: 'int', name: 'baseCurrencyId', comment: '基础货币ID' })
  public baseCurrencyId: number;

  @Column({ type: 'varchar', name: 'baseCurrencyName', length: 64, comment: '基础货币' })
  public baseCurrencyName: string;

  @Column({ type: 'varchar', name: 'baseCurrencySlug', length: 64, comment: '基础货币' })
  public baseCurrencySlug: string;

  @Column({ type: 'varchar', name: 'quoteSymbol', length: 64, comment: '报价货币' })
  public quoteSymbol: string;

  @Column({ type: 'int', name: 'quoteCurrencyId', comment: '报价货币' })
  public quoteCurrencyId: number;

  @Column({ type: 'decimal', name: 'price', default: 0, comment: '当前价格' })
  public price: number;

  @Column({ type: 'decimal', name: 'volumeUsd', default: 0, comment: '24H交易量' })
  public volumeUsd: number;

  @Column({ type: 'int', name: 'effectiveLiquidity', comment: '有效流动性' })
  public effectiveLiquidity: number;

  @Column({ type: 'decimal', name: 'volumeBase', default: 0, comment: '24H基础货币交易量' })
  public volumeBase: number;

  @Column({ type: 'decimal', name: 'volumeQuote', default: 0, comment: '24H报价货币交易量' })
  public volumeQuote: number;

  @Column({ type: 'decimal', name: 'depthUsdNegativeTwo', default: 0, comment: '卖单方向-2%价格深度' })
  public depthUsdNegativeTwo: number;

  @Column({ type: 'decimal', name: 'depthUsdPositiveTwo', default: 0, comment: '买单方向+2%价格深度' })
  public depthUsdPositiveTwo: number;

  @Column({ type: 'decimal', name: 'volumePercent', default: 0, comment: '交易对交易量占交易所总交易量的百分比' })
  public volumePercent: number;

  @Column({ type: 'decimal', name: 'openInterestUsd', default: 0, comment: '未平仓合约' })
  public openInterestUsd: number;

  @Column({ type: 'decimal', name: 'indexPrice', default: 0, comment: '指数价格' })
  public indexPrice: number;

  @Column({ type: 'decimal', name: 'indexBasis', default: 0, comment: '基差' })
  public indexBasis: number;

  @Column({ type: 'decimal', name: 'fundingRate', default: 0, comment: '资金费率' })
  public fundingRate: number;

  @Column({ type: 'varchar', name: 'type', length: 64, comment: '交易所类型' })
  public type: string;
}
