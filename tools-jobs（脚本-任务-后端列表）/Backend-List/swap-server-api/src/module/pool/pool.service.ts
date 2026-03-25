import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Pool } from './entities/pool.entity';
import { PoolDayData } from './entities/pool-day-data.entity';
import { TokenService } from '../token/token.service';
import { CacheService } from '../cache/cache.service';
import { TimeRange } from '../token/token.service';

@Injectable()
export class PoolService {
  private readonly logger = new Logger(PoolService.name);

  constructor(
    @InjectRepository(Pool) 
    private poolRepository: Repository<Pool>,
    @InjectRepository(PoolDayData) 
    private poolDayDataRepository: Repository<PoolDayData>,
    private tokenService: TokenService,
    private cacheService: CacheService,
  ) {}

  /**
   * 通过地址获取池信息
   * 并根据 timeRange 参数统计指定时间范围内的交易量与价格
   */
  async getPool(address: string, timeRange: TimeRange = TimeRange.NO_DATA): Promise<Pool | null> {
    const cacheKey = `pool:${address.toLowerCase()}`;
    const cacheKeyWithTimeRange = timeRange !== TimeRange.NO_DATA ? `${cacheKey}:${timeRange}` : cacheKey;
    
    const cachedPool = await this.cacheService.get<Pool>(cacheKeyWithTimeRange);

    if (cachedPool) {
      this.logger.debug(`Pool ${address} with timeRange ${timeRange} found in cache`);
      return cachedPool;
    }

    const pool = await this.poolRepository.findOne({
      where: { id: address.toLowerCase() },
      relations: ['token0', 'token1'],
    });

    if (pool && timeRange !== TimeRange.NO_DATA) {
      const stats = await this.getPoolCandlestickData(pool.id, timeRange);
      pool.volumeStats = stats.data;
      await this.cacheService.set(cacheKeyWithTimeRange, pool, 300);
    } else if (pool) {
      await this.cacheService.set(cacheKey, pool, 300);
    }

    return pool;
  }

    /**
   * 获取池列表
   * 支持分页和排序
   */
  async getPools(limit: number = 100, offset: number = 0): Promise<Pool[]> {
    const pools = await this.poolRepository.find({
      relations: ['token0', 'token1'],
      order: { volumeUSD: 'DESC' }, // 按TVL排序
      take: limit,
      skip: offset,
    });

    return pools;
  }

  /**
   * 获取池子的K线数据（仿照token.service.ts中的getTokenCandlestickData函数实现）
   * @param poolAddress 池子地址
   * @param timeRange 时间范围
   */
  async getPoolCandlestickData(
    poolAddress: string, 
    timeRange: TimeRange = TimeRange.ONE_DAY
  ): Promise<any> {
    const now = Math.floor(Date.now() / 3600000) * 3600;
    let startTime = 0;
    let interval = 3600; // 默认1小时间隔

    // 根据时间范围计算开始时间和间隔
    switch (timeRange) {
      case TimeRange.ONE_DAY:
        startTime = now - 24 * 60 * 60; // 1天前
        interval = 3600; // 1小时
        break;
      case TimeRange.ONE_WEEK:
        startTime = now - 7 * 24 * 60 * 60; // 1周前
        interval = 6 * 3600; // 6小时
        break;
      case TimeRange.ONE_MONTH:
        startTime = now - 30 * 24 * 60 * 60; // 1月前
        interval = 24 * 60 * 60; // 1天
        break;
      case TimeRange.ONE_YEAR:
        startTime = now - 365 * 24 * 60 * 60; // 1年前
        interval = 7 * 24 * 60 * 60; // 7天
        break;
      default:
        startTime = now - 24 * 60 * 60; // 默认1天前
        interval = 3600; // 默认1小时
    }

    // 获取指定时间范围内的数据
    const existingData = await this.poolDayDataRepository.find({
      where: {
        pool: { id: poolAddress.toLowerCase() },
        date: Between(startTime, now),
      },
      order: { date: 'ASC' },
    });

    if (existingData.length === 0) {
      return {
        timeRange,
        startTime,
        endTime: now,
        interval,
        data: [],
        totalVolumeUSD: 0,
        totalTxCount: 0
      };
    }

    // 按时间戳排序现有数据
    existingData.sort((a, b) => a.date - b.date);

    // 生成完整的时间戳列表
    const allTimestamps: number[] = [];
    for (let ts = startTime; ts <= now; ts += interval) {
      allTimestamps.push(ts);
    }

    // 填充缺失的数据
    const filledData: Array<{
      timestamp: number;
      volumeUSD: number;
      avgPrice: number | null;
      highPrice: number | null;
      lowPrice: number | null;
      openPrice: number | null;
      closePrice: number | null;
      txCount: number;
      tvlUSD: number | null;
    }> = [];

    for (const ts of allTimestamps) {
      const intervalEndTime = ts + interval;
      // 找出当前时间间隔内的所有数据点
      const dataPointsInInterval = existingData.filter(item => 
        item.date >= ts && item.date < intervalEndTime
      );

      if (dataPointsInInterval.length > 0) {
        // 按时间戳排序该时间间隔内的数据点
        dataPointsInInterval.sort((a, b) => a.date - b.date);
        
        // 计算该时间间隔内的统计数据
        const volumeUSD = dataPointsInInterval.reduce((sum, data) => sum + (data.volumeUSD || 0), 0);
        const validClosePrices = dataPointsInInterval.filter(d => d.close !== null && d.close !== undefined).map(d => d.close);
        const avgPrice = validClosePrices.length > 0 ? 
          validClosePrices.reduce((sum, price) => sum + price, 0) / validClosePrices.length : null;
        const highPrice = Math.max(...dataPointsInInterval.map(d => d.high || 0));
        const lowPrice = Math.min(...dataPointsInInterval.map(d => d.low || 0));
        const openPrice = dataPointsInInterval[0].open;
        const closePrice = dataPointsInInterval[dataPointsInInterval.length - 1].close;
        const txCount = dataPointsInInterval.reduce((sum, data) => sum + (data.txCount || 0), 0);
        
        // 计算平均TVL
        const validTvlValues = dataPointsInInterval.filter(d => d.tvlUSD !== null && d.tvlUSD !== undefined).map(d => d.tvlUSD);
        const tvlUSD = validTvlValues.length > 0 ? 
          validTvlValues.reduce((sum, tvl) => sum + tvl, 0) / validTvlValues.length : null;
        
        const intervalData = {
          timestamp: ts,
          volumeUSD,
          avgPrice,
          highPrice,
          lowPrice,
          openPrice,
          closePrice,
          txCount,
          tvlUSD
        };
        
        filledData.push(intervalData);
      }
    }

    // 计算总交易量和总交易次数
    const totalVolumeUSD = filledData.reduce((sum, data) => sum + data.volumeUSD, 0);
    const totalTxCount = filledData.reduce((sum, data) => sum + data.txCount, 0);

    return {
      timeRange,
      startTime,
      endTime: now,
      interval,
      data: filledData,
      totalVolumeUSD,
      totalTxCount
    };
  }

  /**
   * 保存或更新池信息
   */
  async savePool(pool: Partial<Pool>): Promise<Pool> {
    const address = pool.id.toLowerCase();
    let existingPool = await this.poolRepository.findOne({
      where: { id: address },
      relations: ['token0', 'token1'],
    });

    // 确保token0和token1存在
    if (pool.token0 && typeof pool.token0 === 'object') {
      await this.tokenService.saveToken(pool.token0);
    }
    if (pool.token1 && typeof pool.token1 === 'object') {
      await this.tokenService.saveToken(pool.token1);
    }

    if (existingPool) {
      // 更新现有池
      existingPool = { ...existingPool, ...pool, id: address };
      const updatedPool = await this.poolRepository.save(existingPool);
      // 更新缓存
      await this.cacheService.set(`pool:${address}`, updatedPool, 300);
      return updatedPool;
    } else {
      // 创建新池
      const newPool = this.poolRepository.create({ ...pool, id: address });
      const savedPool = await this.poolRepository.save(newPool);
      // 设置缓存
      await this.cacheService.set(`pool:${address}`, savedPool, 300);
      return savedPool;
    }
  }

  /**
   * 保存池每日数据
   */
  async savePoolDayData(data: Partial<PoolDayData>): Promise<PoolDayData> {
    const existingData = await this.poolDayDataRepository.findOneBy({
      pool: { id: data.pool.id },
      date: data.date,
    });

    if (existingData) {
      // 更新现有数据
      return this.poolDayDataRepository.save({ ...existingData, ...data });
    } else {
      // 创建新数据
      return this.poolDayDataRepository.save(data);
    }
  }

  /**
   * 获取池历史数据
   */
  async getPoolHistory(poolAddress: string, startDate: number, endDate: number): Promise<PoolDayData[]> {
    return this.poolDayDataRepository.find({
      where: {
        pool: { id: poolAddress.toLowerCase() },
        date: Between(startDate, endDate),
      },
      order: { date: 'ASC' },
    });
  }

  /**
   * 获取特定代币的池
   */
  async getPoolsByToken(tokenAddress: string, limit: number = 100): Promise<Pool[]> {
    return this.poolRepository.find({
      where: [
        { token0: { id: tokenAddress.toLowerCase() } },
        { token1: { id: tokenAddress.toLowerCase() } },
      ],
      relations: ['token0', 'token1'],
      order: { volumeUSD: 'DESC' },
      take: limit,
    });
  }

  /**
   * 批量更新所有池子的1天和30天交易量统计
   */
  async updatePoolsVolumeStats() {
    try {
      this.logger.log('[updatePoolsVolumeStats] Starting batch update of pool volume stats');
      // 获取所有池子
      const allPools = await this.getPools(100, 0); // 设置较大的limit以获取所有池子
      this.logger.log(`[updatePoolsVolumeStats] Found ${allPools.length} pools to update`);

      // 逐个更新每个池子的统计数据
      for (const pool of allPools) {
        await this.updatePoolVolumeStats(pool.id);
      }

      this.logger.log('[updatePoolsVolumeStats] Successfully updated all pool volume stats');
    } catch (error) {
      this.logger.error('[updatePoolsVolumeStats] Failed to update pool volume stats:', error);
    }
  }

  /**
   * 统计并更新特定池子的1天和30天交易量
   * @param poolAddress 池子地址
   */
  async updatePoolVolumeStats(poolAddress: string) {
    const pool = await this.getPool(poolAddress);
    if (!pool) {
      this.logger.error(`Pool ${poolAddress} not found`);
      return;
    }

    // 获取当前时间戳
    const now = Math.floor(Date.now() / 1000);
    // 计算1天前的时间戳
    const oneDayAgo = now - 86400;
    // 计算30天前的时间戳
    const thirtyDaysAgo = now - 30 * 86400;

    try {
      // 统计1天交易量
      const oneDayData = await this.getPoolHistory(pool.id, oneDayAgo, now);
      const volumeUSD1D = oneDayData.reduce((sum, dayData) => sum + dayData.volumeUSD, 0);
      // 统计30天交易量
      const thirtyDaysData = await this.getPoolHistory(pool.id, thirtyDaysAgo, now);
      const volumeUSD30D = thirtyDaysData.reduce((sum, dayData) => sum + dayData.volumeUSD, 0);
      // 更新池子信息
      await this.savePool({
        ...pool,
        volumeUSD1D,
        volumeUSD30D,
      });

      this.logger.debug(`Updated pool ${pool.id}: 1D volume=$${volumeUSD1D}, 30D volume=$${volumeUSD30D}`);
    } catch (error) {
      this.logger.error(`Failed to update pool ${pool.id}: ${error.message}`, error.stack);
    }
  }

}