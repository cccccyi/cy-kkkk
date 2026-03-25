import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ResultData } from 'src/common/utils/result';
import { WhaleEntity } from './entities/whale.entity';
import { WhaleActionEntity } from './entities/whaleaction.entity';
import { UserFillsEntity } from './entities/userfills.entity';
import { FearGreedEntity } from './entities/fearGreed.entity';
import { CrawlDataEntity } from './entities/crawlData.entity';
import { ListWhaleDto, ListUserFillsDto, CrawlQueryDto } from './dto/index';

@Injectable()
export class CoinglassService {
  constructor(
    @InjectRepository(WhaleEntity)
    private readonly whaleEntityRep: Repository<WhaleEntity>,
    @InjectRepository(WhaleActionEntity)
    private readonly actionEntityRep: Repository<WhaleActionEntity>,
    @InjectRepository(UserFillsEntity)
    private readonly userFillsEntityRep: Repository<UserFillsEntity>,
    @InjectRepository(FearGreedEntity)
    private readonly fearGreedEntityRep: Repository<FearGreedEntity>,
    @InjectRepository(CrawlDataEntity)
    private readonly crawlDataEntityRep: Repository<CrawlDataEntity>,
  ) {}

  async findAll(query: ListWhaleDto) {
    const entity = this.whaleEntityRep
      .createQueryBuilder('w')
      .select([
        'w.id',
        'w.coin',
        'w.createTimestamp',
        'w.entryPrice',
        'w.fundingFee',
        'w.leverage',
        'w.liquidationPrice',
        'w.margin',
        'w.positionType',
        'w.positionUsd',
        'w.price',
        'w.size',
        'w.type',
        'w.unrealizedPnl',
        'w.updateTimeApi',
        'w.userId',
      ]);
    entity.where('w.delFlag = 0');

    if (query.coin) {
      entity.andWhere('w.coin = :coin', { coin: query.coin });
    }
    if (query.direction) {
      if (query.direction == 'long') {
        entity.andWhere('w.size > 0');
      } else if (query.direction == 'short') {
        entity.andWhere('w.size < 0');
      }
    }
    if (query.pnl) {
      if (query.pnl == 'profit') {
        entity.andWhere('w.unrealizedPnl > 0');
      } else if (query.direction == 'loss') {
        entity.andWhere('w.unrealizedPnl < 0');
      }
    }
    if (query.funding) {
      if (query.funding == 'profit') {
        entity.andWhere('w.fundingFee > 0');
      } else {
        entity.andWhere('w.funding_fee < 0');
      }
    }

    entity.orderBy('w.positionUsd', 'DESC');

    if (query.pageSize && query.pageNum) {
      entity.skip(query.pageSize * (query.pageNum - 1)).take(query.pageSize);
    }

    const [list, total] = await entity.getManyAndCount();

    return ResultData.ok({
      list,
      total,
    });
  }

  async statistic(query: ListWhaleDto) {
    const entity = this.whaleEntityRep
      .createQueryBuilder('w')
      .select([
        'SUM(w.positionUsd) AS allPositionUsd',
        'SUM(CASE WHEN w.size > 0 THEN w.positionUsd ELSE 0 END) AS longPosition',
        'SUM(CASE WHEN w.size < 0 THEN w.positionUsd ELSE 0 END) AS shortPosition',
        'SUM(w.margin) AS allMargin',
        'SUM(CASE WHEN w.size > 0 THEN w.margin ELSE 0 END) AS longLargin',
        'SUM(CASE WHEN w.size < 0 THEN w.margin ELSE 0 END) AS shortMargin',
        'SUM(w.unrealizedPnl) AS allUnrealizedPnl',
        'SUM(CASE WHEN w.size > 0 THEN w.unrealizedPnl ELSE 0 END) AS longUnrealizedPnl',
        'SUM(CASE WHEN w.size < 0 THEN w.unrealizedPnl ELSE 0 END) AS shortUnrealizedPnl',
        'SUM(w.fundingFee) AS allFundingFee',
        'SUM(CASE WHEN w.size > 0 THEN w.fundingFee ELSE 0 END) AS longFundingFee',
        'SUM(CASE WHEN w.size < 0 THEN w.fundingFee ELSE 0 END) AS shortFundingFee',
      ]);
    entity.where('w.delFlag = 0');

    if (query.coin) {
      entity.andWhere('w.coin = :coin', { coin: query.coin });
    }
    if (query.direction) {
      if (query.direction == 'long') {
        entity.andWhere('w.size > 0');
      } else if (query.direction == 'short') {
        entity.andWhere('w.size < 0');
      }
    }
    if (query.pnl) {
      if (query.pnl == 'profit') {
        entity.andWhere('w.unrealizedPnl > 0');
      } else if (query.direction == 'loss') {
        entity.andWhere('w.unrealizedPnl < 0');
      }
    }
    if (query.funding) {
      if (query.funding == 'profit') {
        entity.andWhere('w.fundingFee > 0');
      } else {
        entity.andWhere('w.funding_fee < 0');
      }
    }

    const data = await entity.getRawOne();

    return ResultData.ok({
      data,
    });
  }

  async findActionAll(query: ListWhaleDto) {
    const entity = this.actionEntityRep.createQueryBuilder('w').select(['w.id', 'w.coin', 'w.createTimestamp', 'w.entryPrice', 'w.liquidationPrice', 'w.positionUsd', 'w.size', 'w.state', 'w.userId']);
    entity.where('w.delFlag = 0');

    if (query.coin) {
      entity.andWhere('w.coin = :coin', { coin: query.coin });
    }

    entity.orderBy('w.createTimestamp', 'DESC');

    if (query.pageSize && query.pageNum) {
      entity.skip(query.pageSize * (query.pageNum - 1)).take(query.pageSize);
    }

    const [list, total] = await entity.getManyAndCount();

    return ResultData.ok({
      list,
      total,
    });
  }

  async findUserFillsAll(query: ListUserFillsDto) {
    const entity = this.userFillsEntityRep
      .createQueryBuilder('f')
      .select(['f.id', 'f.coin', 'f.px', 'f.sz', 'f.side', 'f.time', 'f.startPosition', 'f.dir', 'f.closePnl', 'f.hash', 'f.crossed', 'f.fee', 'f.feeToken', 'f.userId']);
    entity.where('f.delFlag = 0');

    if (query.userId) {
      entity.andWhere('f.userId = :userId', { userId: query.userId });
    }

    entity.orderBy('f.time', 'DESC');

    if (query.pageSize && query.pageNum) {
      entity.skip(query.pageSize * (query.pageNum - 1)).take(query.pageSize);
    }

    const [list, total] = await entity.getManyAndCount();

    return ResultData.ok({
      list,
      total,
    });
  }

  async getFearGreedIndex() {
    const data = await this.fearGreedEntityRep.findOne({
      where: {},
      order: { createTimestamp: 'DESC' },
    });

    return ResultData.ok(data);
  }

  // 多空比
  async longshortRatio(query: CrawlQueryDto) {
    const entity = this.crawlDataEntityRep.createQueryBuilder('c').select(['c.id', 'c.name', 'c.data']);
    entity.where('c.delFlag = 0');

    const name = `coinrank_longshort_Binance_BTC_${query.interval}`;
    entity.andWhere('c.name = :name', { name: name });

    const data = await entity.getOne();
    data.data = JSON.parse(data.data);

    return ResultData.ok(data);
  }
  // 山寨指数
  async altcoinSeason() {
    const entity = this.crawlDataEntityRep.createQueryBuilder('c').select(['c.id', 'c.name', 'c.data']);
    entity.where('c.delFlag = 0');

    const name = 'coinrank_altcoin_season';
    entity.andWhere('c.name = :name', { name: name });

    const data = await entity.getOne();
    data.data = JSON.parse(data.data);

    return ResultData.ok(data);
  }
  // coinankStatistic
  async coinankStatistic() {
    const entity = this.crawlDataEntityRep.createQueryBuilder('c').select(['c.id', 'c.name', 'c.data']);
    entity.where('c.delFlag = 0');

    const name = 'coinrank_statistic_all';
    entity.andWhere('c.name = :name', { name: name });

    const data = await entity.getOne();
    data.data = JSON.parse(data.data);

    return ResultData.ok(data);
  }
  // 爆仓数据
  async turnoverData(query: CrawlQueryDto) {
    const entity = this.crawlDataEntityRep.createQueryBuilder('c').select(['c.id', 'c.name', 'c.data']);
    entity.where('c.delFlag = 0');

    const name = `coinrank_turnover_${query.interval}`;
    entity.andWhere('c.name = :name', { name: name });

    const data = await entity.getOne();
    data.data = JSON.parse(data.data);

    return ResultData.ok(data);
  }
  // fundingRate
  async fundingRate() {
    const entity = this.crawlDataEntityRep.createQueryBuilder('c').select(['c.id', 'c.name', 'c.data']);
    entity.where('c.delFlag = 0');

    const name = 'funding_rate_data';
    entity.andWhere('c.name = :name', { name: name });

    const data = await entity.getOne();
    data.data = JSON.parse(data.data);

    return ResultData.ok(data);
  }
}
