import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PointService } from './point.service';
import { SubgraphService } from '../subgraph/subgraph.service';

@Injectable()
export class PointSyncService implements OnModuleInit {
  private readonly logger = new Logger(PointSyncService.name);
  private readonly BATCH_SIZE = 1000;

  constructor(
    private readonly pointService: PointService,
    private readonly subgraphService: SubgraphService,
  ) {}

  async onModuleInit() {
    // 模块初始化时立即执行一次同步
    this.logger.log('PointSyncService 模块初始化 ....');
    //await this.syncUserPoints();
    //await this.syncPointsInDateRange();
    //await this.syncUserCollectPoints();
  }

  /**
   * 定时任务：每天UTC 0点 10分 计算前一天的用户积分
   */
  @Cron('10 0 * * *', {
    name: 'syncUserPoints',
    timeZone: 'UTC' // 设置为UTC 0时区
  })
  async syncUserPoints() {
    try {
      this.logger.log('开始计算用户积分');
      const now = new Date();
      const utcDate = new Date(now.toISOString().split('T')[0]); // 将当前时间转换为UTC日期
      utcDate.setDate(utcDate.getDate() - 1); // 获取前一天
      
      await this.pointService.calculateUserLiquidityPoints(utcDate);
      await this.pointService.calculateUserTradingPoints(utcDate);
      
      this.logger.log(`成功计算 ${utcDate.toISOString().split('T')[0]} (UTC) 的用户积分`);
    } catch (error) {
      this.logger.error('计算用户积分失败', error.stack);
    }
  }

  /**
   * 手动触发同步指定日期范围内的流动性积分
   * 用于补算历史数据
   */
  async syncPointsInDateRange(): Promise<void> {
    try {
      this.logger.log('开始从2025年8月1日计算池子每日流动性构成数据');
      // 设置开始日期为2023年8月1日
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
      
      let currentDate = new Date(utcStartDate);
      while (currentDate <= utcEndDate) {
        const targetDate = new Date(currentDate);
        //await this.pointService.calculateUserLiquidityPoints(targetDate);
        await this.pointService.calculateUserTradingPoints(targetDate);
        // 移动到下一天
        currentDate.setDate(currentDate.getDate() + 1);
      }
      this.logger.log(`成功同步从 ${utcStartDate.toISOString().split('T')[0]} 到 ${utcEndDate.toISOString().split('T')[0]} 的流动性的积分`);
    } catch (error) {
      this.logger.error('同步日期范围内的流动性积分失败', error.stack);
      throw error;
    }
  }

  /**
   * 定时同步collect数据
   * 每天UTC 0点执行
   */
  @Cron('0 0 * * *', {
    name: 'syncUserLiquidityPoints',
    timeZone: 'UTC' // 设置为UTC 0时区
  })
  async syncUserCollectPoints() {
    try {
      this.logger.log('开始同步用户 collects 交易流动性费用');
      
      // 1. 从数据库中查询最近的 collect 记录的时间戳
      const latestTimestamp = await this.pointService.getLatestCollectTimestamp();
      // 2. 计算时间范围：从最新时间戳的下一秒开始，到当天结束
      const now = new Date();
      const endOfDay = new Date(now);
      endOfDay.setUTCHours(23, 59, 59, 999);
      const startTimestamp = Math.floor(latestTimestamp);
      const endTimestamp = Math.floor(endOfDay.getTime() / 1000);
      if (startTimestamp >= endTimestamp) {
        this.logger.log('没有新的collect数据需要同步');
        return;
      }
      // 3. 同步指定时间范围内的collect数据
      await this.syncCollectPointsInDateRange(startTimestamp, endTimestamp);
      
      this.logger.log('用户collect积分同步完成');
    } catch (error) {
      this.logger.error('同步用户collect积分失败', error.stack);
    }
  }

  /**
   * 同步指定日期范围内的collect数据
   * @param startTimestamp 开始时间戳（秒）
   * @param endTimestamp 结束时间戳（秒）
   */
  async syncCollectPointsInDateRange(startTimestamp: number, endTimestamp: number) {
    try {
      this.logger.log(`开始同步时间范围 [${new Date(startTimestamp * 1000).toISOString()} - ${new Date(endTimestamp * 1000).toISOString()}] 内的collect数据`);
      
      let skip = 0;
      let hasMoreData = true;
      // 分页查询并处理数据，防止单次查询过多导致性能问题
      while (hasMoreData) {
        // 从subgraph获取collect数据
        const collects = await this.subgraphService.fetchCollects(this.BATCH_SIZE, skip, {
          timestamp_gte: startTimestamp,
          timestamp_lt: endTimestamp
        });
        if (collects.length === 0) {
          hasMoreData = false;
          break;
        }
        await this.pointService.saveCollects(collects);
        skip += this.BATCH_SIZE;
        
        this.logger.log(`批次同步完成：当前批次：${collects.length} 条`);
        if (collects.length < this.BATCH_SIZE) {
          hasMoreData = false;
        }
      }
    } catch (error) {
      this.logger.error(`同步指定日期范围内的collect数据失败: ${error.message}`, error.stack);
      throw error;
    }
  }
}