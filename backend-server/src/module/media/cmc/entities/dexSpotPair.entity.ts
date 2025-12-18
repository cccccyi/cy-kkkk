import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base';

@Entity('dt_crawl_market_pairs_list_dex_spot', {
  comment: 'DEX-SPOT交易对—CMC数据',
})
export class DexSpotPairEntity extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id', comment: 'ID' })
  public id: number;

  @Column({ type: 'int', name: 'platformId', comment: '平台ID' })
  public platformId: number;

  @Column({ type: 'varchar', name: 'platformName', length: 64, comment: '平台名称' })
  public platformName: string;

  @Column({ type: 'varchar', name: 'dexerPlatformName', length: 64, comment: 'DEX平台缩写' })
  public dexerPlatformName: string;

  @Column({ type: 'int', name: 'platformCryptoId', comment: '平台货币ID' })
  public platformCryptoId: number;

  @Column({ type: 'int', name: 'poolId', comment: '流动性池唯一标识ID' })
  public poolId: number;

  @Column({ type: 'varchar', name: 'pairContractAddress', length: 64, comment: '合约地址' })
  public pairContractAddress: string;

  @Column({ type: 'varchar', name: 'factoryAddress', length: 64, comment: '合约地址' })
  public factoryAddress: string;

  @Column({ type: 'int', name: 'dexerId', comment: '所属交易所ID' })
  public dexerId: number;

  @Column({ type: 'varchar', name: 'dexerName', length: 64, comment: '所属交易所名称' })
  public dexerName: string;

  @Column({ type: 'int', name: 'baseCurrencyId', comment: '基础货币ID' })
  public baseCurrencyId: number;

  @Column({ type: 'int', name: 'baseTokenId', comment: '基础货币ID' })
  public baseTokenId: number;

  @Column({ type: 'varchar', name: 'baseTokenName', length: 64, comment: '基础代币名称' })
  public baseTokenName: string;

  @Column({ type: 'varchar', name: 'baseTokenAddress', length: 64, comment: '基础代币地址' })
  public baseTokenAddress: string;

  @Column({ type: 'varchar', name: 'baseTokenSymbol', length: 64, comment: '基础代币代号' })
  public baseTokenSymbol: string;

  @Column({ type: 'varchar', name: 'baseTelegramUrl', length: 64, comment: '基础代币项目tg' })
  public baseTelegramUrl: string;

  @Column({ type: 'varchar', name: 'baseTwitterUrl', length: 64, comment: '基础代币项目X' })
  public baseTwitterUrl: string;

  @Column({ type: 'varchar', name: 'baseWebsiteUrl', length: 64, comment: '支出代币项目网址' })
  public baseWebsiteUrl: string;

  @Column({ type: 'int', name: 'quoteCryptoId', comment: '报价代币ID' })
  public quoteCryptoId: string;

  @Column({ type: 'int', name: 'quotoTokenId', comment: '报价代币ID' })
  public quotoTokenId: string;

  @Column({ type: 'varchar', name: 'quotoTokenName', length: 64, comment: '报价代币名称' })
  public quotoTokenName: string;

  @Column({ type: 'varchar', name: 'quotoTokenAddress', length: 64, comment: '报价代币地址' })
  public quotoTokenAddress: string;

  @Column({ type: 'varchar', name: 'quotoTokenSymbol', length: 64, comment: '报价代币代号' })
  public quotoTokenSymbol: string;

  @Column({ type: 'decimal', name: 'marketCap', default: 0, comment: '市值' })
  public marketCap: number;

  @Column({ type: 'decimal', name: 'fdv', default: 0, comment: '完全稀释价值' })
  public fdv: number;

  @Column({ type: 'decimal', name: 'liquidity', default: 0, comment: '流动性价值' })
  public liquidity: number;

  @Column({ type: 'varchar', name: 'marketUrl', length: 64, comment: '市场URL' })
  public marketUrl: string;

  @Column({ type: 'int', name: 'reverseOrder', comment: '交易对顺序是否反转' })
  public reverseOrder: number;

  @Column({ type: 'int', name: 'rank', comment: '排行' })
  public rank: number;

  @Column({ type: 'int', name: 'poolCreatedDate', comment: '创建时间戳秒' })
  public poolCreatedDate: number;

  @Column({ type: 'decimal', name: 'priceUsd', default: 0, comment: '基础代币当前价格USD' })
  public priceUsd: number;

  @Column({ type: 'decimal', name: 'priceQuote', default: 0, comment: '基础代币相对于报价代币的价格' })
  public priceQuote: number;

  @Column({ type: 'decimal', name: 'basePrice5m', default: 0, comment: '基础代币价格-过去5分钟变化' })
  public basePrice5m: number;

  @Column({ type: 'decimal', name: 'quotePrice5m', default: 0, comment: '报价代币价格-过去5分钟变化' })
  public quotePrice5m: number;

  @Column({ type: 'decimal', name: 'basePrice1h', default: 0, comment: '基础代币价格-过去1小时变化' })
  public basePrice1h: number;

  @Column({ type: 'decimal', name: 'quotePrice1h', default: 0, comment: '报价代币价格-过去1小时变化' })
  public quotePrice1h: number;

  @Column({ type: 'decimal', name: 'basePrice4h', default: 0, comment: '基础代币价格-过去4小时变化' })
  public basePrice4h: number;

  @Column({ type: 'decimal', name: 'quotePrice4h', default: 0, comment: '报价代币价格-过去4小时变化' })
  public quotePrice4h: number;

  @Column({ type: 'decimal', name: 'volumeUsd24h', default: 0, comment: '24小时交易量USD' })
  public volumeUsd24h: number;

  @Column({ type: 'decimal', name: 'txns24h', default: 0, comment: '24小时交易数量' })
  public txns24h: number;

  @Column({ type: 'decimal', name: 'baseChange24h', default: 0, comment: '基础代币-过去24小时变化' })
  public baseChange24h: number;

  @Column({ type: 'decimal', name: 'quoteChange24h', default: 0, comment: '报价代币-过去24小时变化' })
  public quoteChange24h: number;

  @Column({ type: 'decimal', name: 'baseChange7d', default: 0, comment: '基础代币-过去7天变化' })
  public baseChange7d: number;

  @Column({ type: 'decimal', name: 'quoteChange7d', default: 0, comment: '报价代币-过去7天变化' })
  public quoteChange7d: number;

  @Column({ type: 'varchar', name: 'logo', length: 64, comment: '图标' })
  public logo: string;
}
