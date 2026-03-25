import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ResultData } from 'src/common/utils/result';
import { ExportTable } from 'src/common/utils/export';
import { FutunnCoinEntity } from './entities/futunn.entity';
import { CoinEntity } from './entities/coin.entity';
import { ExchangeEntity } from './entities/exchange.entity';
import { PairEntity } from './entities/pair.entity';
import { DexSpotPairEntity } from './entities/dexSpotPair.entity';
import { DataSource } from 'typeorm';
import { Response } from 'express';
import { CreateDeviceInfoDto, ListCmcCoinDto, ListCoinDto, ListDexSpotPairDto, ListExchangeDto, ListPairDto } from './dto/index';
@Injectable()
export class CmcService {
  constructor(
    @InjectRepository(FutunnCoinEntity)
    private readonly futunnCoinEntityRep: Repository<FutunnCoinEntity>,
    @InjectRepository(CoinEntity)
    private readonly coinEntityRep: Repository<CoinEntity>,
    @InjectRepository(ExchangeEntity)
    private readonly exchangeEntityRep: Repository<ExchangeEntity>,
    @InjectRepository(PairEntity)
    private readonly pairEntityRep: Repository<PairEntity>,
    @InjectRepository(DexSpotPairEntity)
    private readonly dexSpotPairRep: Repository<DexSpotPairEntity>,
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  async broker() {
    const results = await this.futunnCoinEntityRep
      .createQueryBuilder('c')
      .select('c.exchange', 'exchange')
      .addSelect('COUNT(*)', 'num')
      .addSelect('SUM(c.turnover_24h)', 'all_turnover')
      .groupBy('c.exchange')
      .orderBy('SUM(c.turnover_24h)', 'DESC')
      .getRawMany();

    const list = results.map((item) => ({
      name: item.exchange,
      coinCount: item.num,
      turnover_24h: item.all_turnover,
    }));

    const total = results.length;

    return ResultData.ok({
      list,
      total,
    });
  }

  async findFutunnCoinList(query: ListCoinDto) {
    const entity = this.futunnCoinEntityRep
      .createQueryBuilder('c')
      .select([
        'c.id',
        'c.exchange',
        'c.source',
        'c.stockId',
        'c.name',
        'c.stockCode',
        'c.iconUrl',
        'c.price',
        'c.priceChange',
        'c.changeRatio',
        'c.priceDirect',
        'c.priceLastClose',
        'c.priceOpen',
        'c.priceHighest',
        'c.priceLowest',
        'c.volume',
        'c.turnover',
        'c.priceHighest_24h',
        'c.priceLowest_24h',
        'c.volume_24h',
        'c.turnover_24h',
        'c.priceChange_24h',
        'c.ratioPriceChange_24h',
        'c.outstandingShares',
        'c.outstandingMarketCap',
      ]);

    entity.andWhere("c.stockCode!='SPICEUSDC'");

    if (!query.exchange) {
      query.exchange = '富途';
    }
    if (query.exchange) {
      entity.andWhere('exchange = :exchange', { exchange: query.exchange });
    }

    if (query.coin) {
      entity.andWhere('stockCode = :stockCode', { stockCode: query.coin });
    }

    if (query.pageSize && query.pageNum) {
      entity.skip(query.pageSize * (query.pageNum - 1)).take(query.pageSize);
    }

    const [list, total] = await entity.getManyAndCount();

    return ResultData.ok({
      list,
      total,
    });
  }

  // CMC 代币列表
  async findCmcCoinsAll(query: ListCmcCoinDto) {
    const entity = this.coinEntityRep
      .createQueryBuilder('c')
      .select([
        'c.id',
        'c.name',
        'c.symbol',
        'c.slug',
        'c.cmcRank',
        'c.marketPairCount',
        'c.circulatingSupply',
        'c.totalSupply',
        'c.maxSupply',
        'c.price',
        'c.high24h',
        'c.low24h',
        'c.low7d',
        'c.high7d',
        'c.low30d',
        'c.high30d',
        'c.low90d',
        'c.high90d',
        'c.low52w',
        'c.high52w',
        'c.lowAllTime',
        'c.highAllTime',
        'c.volume24h',
        'c.volume7d',
        'c.volume30d',
        'c.marketCap',
        'c.percentChange1h',
        'c.percentChange24h',
        'c.percentChange7d',
        'c.percentChange30d',
        'c.percentChange60d',
        'c.percentChange90d',
        'c.percentChange1y',
        'c.dominance',
        'c.turnover',
        'c.logo',
      ]);

    entity.where('c.cmcRank is not null');
    if (query.symbol) {
      entity.andWhere('symbol LIKE :keyword', { keyword: `%${query.symbol}%` });
    }

    entity.orderBy('c.cmcRank', 'ASC');

    if (query.pageSize && query.pageNum) {
      entity.skip(query.pageSize * (query.pageNum - 1)).take(query.pageSize);
    }

    const [list, total] = await entity.getManyAndCount();

    return ResultData.ok({
      list,
      total,
    });
  }

  // 交易所列表
  async findExchangesAll(query: ListExchangeDto) {
    const entity = this.exchangeEntityRep
      .createQueryBuilder('c')
      .select([
        'c.id',
        'c.name',
        'c.slug',
        'c.rank',
        'c.derivativesRank',
        'c.dexStatus',
        'c.platformId',
        'c.score',
        'c.filteredTotalVol24h',
        'c.totalVol7d',
        'c.totalVol30d',
        'c.spotVol24h',
        'c.derivativesVol24h',
        'c.derivativesOpenInterests',
        'c.derivativesMarketPairs',
        'c.totalVolChgPct24h',
        'c.totalVolChgPct7d',
        'c.totalVolChgPct30d',
        'c.visits',
        'c.liquidity',
        'c.numMarkets',
        'c.numCoins',
        'c.type',
        'c.descriptionZh',
        'c.websiteUrl',
        'c.feeUrl',
        'c.chatUrl',
        'c.twitterUrl',
        'c.logo',
      ]);

    if (query.dexStatus !== undefined) {
      entity.andWhere('dexStatus = :dexStatus', { dexStatus: query.dexStatus });
    }
    if (query.slug) {
      entity.andWhere('slug LIKE :keyword', { keyword: `%${query.slug}%` });
    }
    if (query.category && query.category == 'perpetual') {
      entity.andWhere('c.derivativesRank is not null');
      entity.orderBy('c.derivativesRank', 'ASC');
    } else {
      entity.andWhere('c.rank is not null');
      entity.orderBy('c.rank', 'ASC');
    }

    if (query.pageSize && query.pageNum) {
      entity.skip(query.pageSize * (query.pageNum - 1)).take(query.pageSize);
    }

    const [list, total] = await entity.getManyAndCount();

    return ResultData.ok({
      list,
      total,
    });
  }

  // 交易对列表
  async findPairAll(query: ListPairDto) {
    const entity = this.pairEntityRep
      .createQueryBuilder('p')
      .select([
        'p.id',
        'p.marketId',
        'p.marketPair',
        'p.rank',
        'p.exchangeId',
        'p.exchangeName',
        'p.exchangeSlug',
        'p.category',
        'p.marketUrl',
        'p.baseSymbol',
        'p.baseCurrencyId',
        'p.baseCurrencyName',
        'p.baseCurrencySlug',
        'p.quoteSymbol',
        'p.quoteCurrencyId',
        'p.price',
        'p.volumeUsd',
        'p.effectiveLiquidity',
        'p.volumeBase',
        'p.volumeQuote',
        'p.depthUsdNegativeTwo',
        'p.depthUsdPositiveTwo',
        'p.volumePercent',
        'p.openInterestUsd',
        'p.indexPrice',
        'p.indexBasis',
        'p.fundingRate',
        'p.type',
      ]);

    if (query.exchangeSlug) {
      entity.andWhere('exchangeSlug = :exchangeSlug', { exchangeSlug: query.exchangeSlug });
    }
    if (query.category) {
      entity.andWhere('category = :category', { category: query.category });
    }
    if (query.keyword) {
      entity.andWhere('marketPair LIKE :keyword', { keyword: `%${query.keyword}%` });
    }

    entity.orderBy('p.rank', 'ASC');

    if (query.pageSize && query.pageNum) {
      entity.skip(query.pageSize * (query.pageNum - 1)).take(query.pageSize);
    }

    const [list, total] = await entity.getManyAndCount();

    return ResultData.ok({
      list,
      total,
    });
  }

  // DEX SPOT 交易对列表
  async findDexSpotPairAll(query: ListDexSpotPairDto) {
    const entity = this.dexSpotPairRep
      .createQueryBuilder('p')
      .select([
        'p.id',
        'p.poolId',
        'p.platformId',
        'p.platformName',
        'p.dexerPlatformName',
        'p.platformCryptoId',
        'p.pairContractAddress',
        'p.factoryAddress',
        'p.dexerId',
        'p.dexerName',
        'p.baseCurrencyId',
        'p.baseTokenId',
        'p.baseTokenName',
        'p.baseTokenAddress',
        'p.baseTokenSymbol',
        'p.baseTelegramUrl',
        'p.baseTwitterUrl',
        'p.baseWebsiteUrl',
        'p.quoteCryptoId',
        'p.quotoTokenId',
        'p.quotoTokenName',
        'p.quotoTokenAddress',
        'p.quotoTokenSymbol',
        'p.marketCap',
        'p.fdv',
        'p.liquidity',
        'p.marketUrl',
        'p.reverseOrder',
        'p.rank',
        'p.poolCreatedDate',
        'p.priceUsd',
        'p.priceQuote',
        'p.basePrice5m',
        'p.quotePrice5m',
        'p.basePrice1h',
        'p.quotePrice1h',
        'p.basePrice4h',
        'p.quotePrice4h',
        'p.volumeUsd24h',
        'p.txns24h',
        'p.baseChange24h',
        'p.quoteChange24h',
        'p.baseChange7d',
        'p.quoteChange7d',
      ]);

    if (query.dexerId) {
      entity.andWhere('dexerId = :dexerId', { dexerId: query.dexerId });
    }
    if (query.keyword) {
      entity.andWhere('baseTokenName LIKE :keyword', { keyword: `%${query.keyword}%` });
    }

    entity.orderBy('p.rank', 'ASC');

    if (query.pageSize && query.pageNum) {
      entity.skip(query.pageSize * (query.pageNum - 1)).take(query.pageSize);
    }

    const [list, total] = await entity.getManyAndCount();
    const pairs = [];
    for (const pair of list) {
      pairs.push({
        id: pair.id,
        marketId: pair.poolId,
        marketPair: pair.baseTokenSymbol + '/' + pair.quotoTokenSymbol,
        rank: pair.rank,
        exchangeId: pair.dexerId,
        exchangeName: pair.dexerName,
        exchangeSlug: '',
        category: 'spot',
        marketUrl: pair.marketUrl,
        baseSymbol: pair.baseTokenSymbol,
        baseCurrencyId: pair.baseCurrencyId,
        baseCurrencyName: pair.baseTokenName,
        baseCurrencySlug: '',
        quoteSymbol: pair.quotoTokenSymbol,
        quoteCurrencyId: pair.quoteCryptoId,
        price: pair.priceUsd,
        volumeUsd: pair.volumeUsd24h,
        effectiveLiquidity: pair.liquidity,
        volumeBase: pair.txns24h,
        volumeQuote: 0,
        depthUsdNegativeTwo: 0,
        depthUsdPositiveTwo: 0,
        volumePercent: 0,
        openInterestUsd: 0,
        indexPrice: 0,
        indexBasis: 0,
        fundingRate: 0,
        logo: pair.logo,
        type: 'cex',
        baseTokenAddress: pair.baseTokenAddress,
        marketCap: pair.marketCap,
      });
    }

    return ResultData.ok({
      pairs,
      total,
    });
  }
}
