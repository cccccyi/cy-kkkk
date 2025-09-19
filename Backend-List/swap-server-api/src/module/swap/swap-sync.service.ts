import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SubgraphService } from '../subgraph/subgraph.service';
import { SwapService } from './swap.service';
import { TokenService } from '../token/token.service';

@Injectable()
export class SwapSyncService {
  private readonly logger = new Logger(SwapSyncService.name);
  private readonly BATCH_SIZE = 1000;

  constructor(
    private readonly swapService: SwapService,
    private readonly subgraphService: SubgraphService,
    private readonly tokenService: TokenService,
  ) {}

  async onModuleInit() {
    // 模块初始化时立即执行一次同步
    this.logger.log('SwapSyncService 模块初始化 ....');
    //await this.syncUserSwapData();
    //await this.syncRecentSwapData();
  }

  // @Cron('19 15 * * *') 
  async manualSyncTest(){
    // 设置测试时间范围（过去1小时）
    const endTime = Math.floor(Date.now() / 1000);
    const startTime = endTime - 30*24*(60 * 60); // 1小时前
    // 调用manualSync方法
    const result = await this.manualSync(startTime, endTime);
  }

  /**
   * 手动触发同步前100个代币的特定时间范围数据
   * @param startTime 开始时间戳
   * @param endTime 结束时间戳
   */
  async manualSync(startTime: number, endTime: number) {
    this.logger.log(`[manualSync] Manually syncing top 100 tokens from ${startTime} to ${endTime}`);

    try {
      // 获取前100个代币列表
      const tokens = await this.subgraphService.fetchTokens(100, 0);
      this.logger.log(`[manualSync] Fetched ${tokens.length} tokens`);

      // 为每个代币执行数据处理
      for (const token of tokens) {
        try {
          await this.swapService.processSwapData(token.id, startTime, endTime);
          this.logger.debug(`[manualSync] Successfully processed token ${token.id}`);
        } catch (error) {
          this.logger.error(`[manualSync] Failed to process token ${token.id}:`, error);
          // 继续处理下一个代币
          continue;
        }
      }

      this.logger.log(`[manualSync] Successfully synced ${tokens.length} tokens`);
      return { success: true, count: tokens.length };
    } catch (error) {
      this.logger.error('[manualSync] Sync job failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 每 10分钟 定时同步swap数据
   * 每天UTC 0点执行
   */
 @Cron(CronExpression.EVERY_10_MINUTES)
  async syncUserSwapData() {
    try {
      this.logger.log('开始同步用户swap交易数据');
      
      // 1. 从数据库中查询最近的swap记录的时间戳
      const latestTimestamp = await this.swapService.getLatestSwapTimestamp();
      // 2. 计算时间范围：从最新时间戳的下一秒开始，到当天结束
      const now = new Date();
      const endOfDay = new Date(now);
      endOfDay.setUTCHours(23, 59, 59, 999);
      const startTimestamp = Math.floor(latestTimestamp);
      const endTimestamp = Math.floor(endOfDay.getTime() / 1000);
      // 3. 同步指定时间范围内的swap数据
      await this.syncSwapDataInDateRange(startTimestamp, endTimestamp);
      
      this.logger.log('用户swap数据同步完成');
    } catch (error) {
      this.logger.error('同步用户swap数据失败', error.stack);
    }
  }

  /**
   * 同步指定日期范围内的swap数据
   * @param startTimestamp 开始时间戳（秒）
   * @param endTimestamp 结束时间戳（秒）
   */
  async syncSwapDataInDateRange(startTimestamp: number, endTimestamp: number) {
    try {
      this.logger.log(`开始同步时间范围 [${new Date(startTimestamp * 1000).toISOString()} - ${new Date(endTimestamp * 1000).toISOString()}] 内的swap数据`);
      
      let skip = 0;
      let hasMoreData = true;
      // 分页查询并处理数据，防止单次查询过多导致性能问题
      while (hasMoreData) {
        // 从subgraph获取swap数据
        const swaps = await this.subgraphService.fetchSwaps(this.BATCH_SIZE, skip, {
          timestamp_gte: startTimestamp,
          timestamp_lt: endTimestamp
        });
        if (swaps.length === 0) {
          hasMoreData = false;
          break;
        }
        await this.swapService.saveSwaps(swaps);
        skip += this.BATCH_SIZE;
        
        this.logger.log(`批次同步完成：当前批次：${swaps.length} 条`);
        if (swaps.length < this.BATCH_SIZE) {
          hasMoreData = false;
        }
      }
    } catch (error) {
      this.logger.error(`同步指定日期范围内的swap数据失败: ${error.message}`, error.stack);
      throw error;
    }
  }
  /**
   * 定时统计 swap 数据得到 K线 数据
   */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async syncRecentSwapData() {
    this.logger.log('[syncRecentSwapData] Starting sync job');
    try {
      const endTime = Math.floor(Date.now() / 1000);
      const startTime = endTime - 4*3600;   // 4小时前

      // 从数据库中获取所有代币列表（限制为前100个以避免性能问题）
      const tokens = await this.tokenService.getTokens(100, 0);
      this.logger.log(`[syncRecentSwapData] Fetched ${tokens.length} tokens from database`);

      // 为每个代币执行数据处理
      for (const token of tokens) {
        try {
          await this.swapService.processSwapData(token.id, startTime, endTime);
        } catch (error) {
          this.logger.error(`[syncRecentSwapData] Failed to process token ${token.id}:`, error);
          // 继续处理下一个代币
          continue;
        }
      }
      this.logger.log('[syncRecentSwapData] Sync job completed successfully');
    } catch (error) {
      this.logger.error('[syncRecentSwapData] Sync job failed:', error);
    }
  }

}