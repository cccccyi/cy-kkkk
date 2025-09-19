import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PoolService } from './pool.service';
import { SubgraphService } from '../subgraph/subgraph.service';

@Injectable()
export class PoolSyncService {
  private readonly logger = new Logger(PoolSyncService.name);

  constructor(
    private readonly poolService: PoolService,
    private readonly subgraphService: SubgraphService,
  ) {}

  async onModuleInit() {
    // 模块初始化时立即执行一次同步
    this.logger.log('PoolSyncService 模块初始化 ....');
    //await this.syncPools();
    //await this.syncPoolDayData();
    //await this.syncPoolDayDataInDateRange();
  }

  /**
   * 每30分钟同步一次池数据
   * 这个时间间隔可以根据实际需求调整
   */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async syncPools() {
    this.logger.debug('Starting pool sync job');
    try {
      // 从子图获取池数据
      const pools = await this.subgraphService.fetchPools();
      this.logger.debug(`Fetched ${pools.length} pools from subgraph`);

      // 保存或更新每个池
      for (const pool of pools) {
        // Logger.info(pool);
        await this.poolService.savePool(pool);
      }

      this.logger.debug('Pool sync job completed successfully');
    } catch (error) {
      this.logger.error('Pool sync job failed', error);
    }
  }

  /**
   * 每天 0点 分同步前一天的池快照数据
   */
 @Cron('0 0 * * *', {
    name: 'syncPoolDayData',
    timeZone: 'UTC' // 设置为UTC 0时区
  })
  async syncPoolDayData() {
    this.logger.debug('Starting pool day data sync job');

    try {
      // 计算昨天的日期（UTC时间）
      const yesterday = new Date();
      yesterday.setUTCDate(yesterday.getUTCDate() - 2);
      yesterday.setUTCHours(0, 0, 0, 0);
      const timestamp = Math.floor(yesterday.getTime() / 1000);

      // 从子图获取池日数据
      const poolDayDatas = await this.subgraphService.fetchPoolDayData(timestamp);
      this.logger.debug(`Fetched ${poolDayDatas.length} pool day data records from subgraph`);

      // 保存每个池的日数据
      for (const data of poolDayDatas) {
        // 确保pool存在
        const pool = await this.poolService.getPool(data.pool.id);
        if (pool) {
          await this.poolService.savePoolDayData({
            ...data,
            pool,
            date: timestamp,
          });
        } else {
          this.logger.warn(`Pool ${data.pool.id} not found, skipping day data`);
        }
      }

      this.logger.debug('Pool day data sync job completed successfully');
    } catch (error) {
      this.logger.error('Pool day data sync job failed', error);
    }
  }

  /**
   * 每天 0点30分 执行，更新所有池子的1天和30天交易量统计
   */
  @Cron('30 0 * * *', {
    name: 'scheduledUpdatePoolsVolumeStats',
    timeZone: 'UTC' // 设置为UTC 0时区
  })
  async scheduledUpdatePoolsVolumeStats() {
    this.logger.log('[scheduledUpdatePoolsVolumeStats] Starting scheduled update of pool volume stats');
    try {
      await this.poolService.updatePoolsVolumeStats();
      this.logger.log('[scheduledUpdatePoolsVolumeStats] Successfully updated pool volume stats');
    } catch (error) {
      this.logger.error('[scheduledUpdatePoolsVolumeStats] Failed to update pool volume stats:', error);
    }
  }

  /**
   * 手动触发日数据同步（用于测试）
   */
  async manualSyncPoolDayData(timestamp: number) {
    try {
      const poolDayDatas = await this.subgraphService.fetchPoolDayData(timestamp);
      this.logger.debug(`Fetched ${poolDayDatas.length} pool day data records from subgraph`);

      for (const data of poolDayDatas) {
        const pool = await this.poolService.getPool(data.pool.id);
        if (pool) {
          await this.poolService.savePoolDayData({
            ...data,
            pool,
            date: timestamp,
          });
        }
      }

      return { success: true, count: poolDayDatas.length };
    } catch (error) {
      this.logger.error('Manual pool day data sync failed', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 手动触发同步指定日期范围内的池子数据
   * 用于补算历史数据
   */
  async syncPoolDayDataInDateRange(): Promise<void> {
    try {
      this.logger.log('开始从2025年8月1日同步池子日数据');
      // 设置开始日期为2025年8月1日
      const startDate = new Date('2025-08-01');
      const endDate = null;
      const utcStartDate = new Date(startDate.toISOString().split('T')[0] + 'T00:00:00Z');
      const utcEndDate = endDate 
        ? new Date(endDate.toISOString().split('T')[0] + 'T00:00:00Z') 
        : new Date(new Date().toISOString().split('T')[0] + 'T00:00:00Z');
      // 验证开始日期是否早于结束日期
      if (utcStartDate > utcEndDate) {
        throw new Error('开始日期不能晚于结束日期');
      }
      
      this.logger.log(`开始同步从 ${utcStartDate.toISOString().split('T')[0]} 到 ${utcEndDate.toISOString().split('T')[0]} 的池子日数据`);
      
      let currentDate = new Date(utcStartDate);
      while (currentDate <= utcEndDate) {
        const targetDate = new Date(currentDate);
        const timestamp = Math.floor(targetDate.getTime() / 1000);
        
        this.logger.log(`正在同步 ${targetDate.toISOString().split('T')[0]} 的池子日数据`);
        // 从子图获取池日数据
        const poolDayDatas = await this.subgraphService.fetchPoolDayData(timestamp);
        this.logger.log(`获取到 ${poolDayDatas.length} 条池子日数据记录`);

        // 保存每个池的日数据
        for (const data of poolDayDatas) {
          // 确保pool存在
          const pool = await this.poolService.getPool(data.pool.id);
          if (pool) {
            await this.poolService.savePoolDayData({
              ...data,
              pool,
              date: timestamp,
            });
          } else {
            this.logger.warn(`Pool ${data.pool.id} not found, skipping day data`);
          }
        }
        
        // 移动到下一天
        currentDate.setDate(currentDate.getDate() + 1);
      }
      this.logger.log(`成功同步从 ${utcStartDate.toISOString().split('T')[0]} 到 ${utcEndDate.toISOString().split('T')[0]} 的池子日数据`);
    } catch (error) {
      this.logger.error('同步日期范围内的池子日数据失败', error.stack);
      throw error;
    }
  }

}
