import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TokenService } from './token.service';
import { SubgraphService } from '../subgraph/subgraph.service';
import { SwapService } from '../swap/swap.service';
import { TimeRange } from './token.service';

@Injectable()
export class TokenSyncService {
  private readonly logger = new Logger(TokenSyncService.name);

  constructor(
    private readonly tokenService: TokenService,
    private readonly subgraphService: SubgraphService,
    private readonly swapService: SwapService,
  ) {}

  async onModuleInit() {
    // 模块初始化时立即执行一次同步
    this.logger.log('TokenSyncService 模块初始化 ....');
    //await this.syncTokens();
    //await this.syncTokenDayData();
    //await this.syncTokenHourData();
    //await this.syncTokenDataInDateRange('day');
    //await this.syncTokenDataInDateRange('hour');
    await this.updateTokenVolumes();
  }

  /**
   * 每30分钟同步一次代币数据
   */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async syncTokens() {
    this.logger.debug('Starting token sync job');
    try {
      // 获取Bundle数据（包含ETH价格）
      const bundle = await this.subgraphService.fetchBundle();
      if (!bundle || !bundle.ethPriceUSD) {
        this.logger.error('Failed to fetch bundle data or ethPriceUSD is missing');
        return;
      }
      const ethPriceUSD = parseFloat(bundle.ethPriceUSD);

      // 从子图获取代币数据
      const tokens = await this.subgraphService.fetchTokens();
      this.logger.debug(`Fetched ${tokens.length} tokens from subgraph`);

      // 保存或更新每个代币
      for (const token of tokens) {
        // 计算当前价格: token.derivedETH * bundle.ethPriceUSD
        if (token.derivedETH) {
          const currentPrice = parseFloat(token.derivedETH) * ethPriceUSD;
          token.currentPrice = currentPrice.toString();
          this.logger.debug(`Token ${token.id} current price: ${currentPrice}`);
          // 获取1小时前的价格
          const oneHourAgo = Math.floor(Date.now() / 1000) - 3600;
          const hourlyCandlesticks = await this.swapService.getCandlestickData(
            token.id,
            oneHourAgo
          );
          let priceOneHourAgo = null;
          if (hourlyCandlesticks.length > 0) {
            // 由于我们已经在getCandlestickData中按时间倒序排列，直接取第一个
            priceOneHourAgo = parseFloat(hourlyCandlesticks[0].close);
            this.logger.debug(`Token ${token.id} 1 hour ago price (latest before ${new Date((oneHourAgo + 300) * 1000).toISOString()}): ${priceOneHourAgo}`);
          } else {
            this.logger.debug(`No candlestick data found for token ${token.id} before ${new Date((oneHourAgo + 300) * 1000).toISOString()}`);
          }
          // 获取1天前的价格
          const oneDayAgo = Math.floor(Math.floor(Date.now() / 1000)) - 86400;
          const tokenHistory = await this.swapService.getCandlestickData(
            token.id,
            oneDayAgo
          );
          let priceOneDayAgo = null;
          if (tokenHistory.length > 0) {
            priceOneDayAgo = parseFloat(tokenHistory[0].close);
          }
          // 计算变化率
          if (priceOneHourAgo) {
            const change1h = ((currentPrice - priceOneHourAgo) / priceOneHourAgo) * 100;
            token.priceChange1h = change1h.toString();
            this.logger.debug(`Token ${token.id} 1h price change: ${change1h}%`);
          }
          if (priceOneDayAgo) {
            const change24h = ((currentPrice - priceOneDayAgo) / priceOneDayAgo) * 100;
            token.priceChange24h = change24h.toString();
            this.logger.debug(`Token ${token.id} 24h price change: ${change24h}%`);
          }
        }

        await this.tokenService.saveToken(token);
      }

      this.logger.debug('Token sync job completed successfully');
    } catch (error) {
      this.logger.error('Token sync job failed', error);
    }
  }

  /**
   * 每天 0点 同步前一天的代币快照数据
   */
  @Cron('0 0 * * *', {
    name: 'syncTokenDayData',
    timeZone: 'UTC' // 设置为UTC 0时区
  })   
  async syncTokenDayData() {
    this.logger.log('Starting token day data sync job');
    try {
      // 计算昨天的日期（UTC时间）
      const yesterday = new Date();
      yesterday.setUTCDate(yesterday.getUTCDate() - 2);
      yesterday.setUTCHours(0, 0, 0, 0);
      const timestamp = Math.floor(yesterday.getTime() / 1000);

      // 从子图获取代币日数据
      const tokenDayDatas = await this.subgraphService.fetchTokenDayData(timestamp, timestamp + 86400);
      this.logger.log(`Fetched ${tokenDayDatas.length} token day data records from subgraph ${timestamp}`);

      // 保存每个代币的日数据
      for (const data of tokenDayDatas) {
        // 确保token存在
        //this.logger.debug(data);
        const token = await this.tokenService.getTokenByAddress(data.token.id, TimeRange.NO_DATA);
        if (token) {
          await this.tokenService.saveTokenDayData({
            ...data,
            token,
            date: timestamp,
          });
        } else {
          this.logger.warn(`Token ${data.token.id} not found, skipping day data`);
        }
      }

      this.logger.log('Token day data sync job completed successfully');
    } catch (error) {
      this.logger.error('Token day data sync job failed', error);
    }
  }

  /**
   * 每小时同步前一小时的代币小时 数据
   */
  @Cron(CronExpression.EVERY_HOUR)
  async syncTokenHourData() {
    this.logger.log('Starting token hour data sync job');

    try {
      // 计算上一小时的时间戳（UTC）
      const now = Math.floor(Date.now() / 1000);
      const lastHour = now - 3600;
      //const lastHour = now - 30*24*3600;

      // 从子图获取代币小时数据
      const tokenHourDatas = await this.subgraphService.fetchTokenHourData(lastHour, lastHour + 3600);
      this.logger.log(`Fetched ${tokenHourDatas.length} token hour data records from subgraph`);

      // 保存每个代币的小时数据
      for (const data of tokenHourDatas) {
        // 确保token存在
        const token = await this.tokenService.getTokenByAddress(data.token.id, TimeRange.NO_DATA);
        if (token) {
          await this.tokenService.saveTokenHourData({
            ...data,
            token,
            hour: lastHour,
          });
        } else {
          this.logger.warn(`Token ${data.token.id} not found, skipping hour data`);
        }
      }

      this.logger.log('Token hour data sync job completed successfully');
    } catch (error) {
      this.logger.error('Token hour data sync job failed', error);
    }
  }

  /**
   * 每 30分钟 更新所有代币的交易量
   */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async updateTokenVolumes() {
    this.logger.debug('Starting update token volumes job');
    try {
      await this.tokenService.calculateAndUpdateAllTokensVolumes();
      this.logger.debug('Update token volumes job completed successfully');
    } catch (error) {
      this.logger.error('Update token volumes job failed', error);
    }
  }

  /**
   * 手动触发小时数据同步（用于测试）
   */
  async manualSyncTokenHourData(hour: number) {
    try {
      const tokenHourDatas = await this.subgraphService.fetchTokenHourData(hour, hour + 3600);
      this.logger.debug(`Fetched ${tokenHourDatas.length} token hour data records from subgraph`);

      for (const data of tokenHourDatas) {
        const token = await this.tokenService.getTokenByAddress(data.token.id, TimeRange.NO_DATA);
        if (token) {
          await this.tokenService.saveTokenHourData({
            ...data,
            token,
            hour,
          });
        }
      }

      return { success: true, count: tokenHourDatas.length };
    } catch (error) {
      this.logger.error('Manual token hour data sync failed', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 手动触发小时数据同步（用于测试）
   */
  async manualSyncTokens() {
    return this.syncTokens();
  }

  /**
   * 手动触发日数据同步（用于测试）
   */
  async manualSyncTokenDayData(timestamp: number) {
    try {
      const tokenDayDatas = await this.subgraphService.fetchTokenDayData(timestamp, timestamp + 86400);
      this.logger.debug(`Fetched ${tokenDayDatas.length} token day data records from subgraph`);

      for (const data of tokenDayDatas) {
        const token = await this.tokenService.getTokenByAddress(data.token.id, TimeRange.NO_DATA);
        if (token) {
          await this.tokenService.saveTokenDayData({
            ...data,
            token,
            date: timestamp,
          });
        }
      }

      return { success: true, count: tokenDayDatas.length };
    } catch (error) {
      this.logger.error('Manual token day data sync failed', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 手动触发同步指定日期范围内的代币数据
   * 用于补算历史数据，可选择同步日数据或小时数据
   */
  async syncTokenDataInDateRange(dataType: 'day' | 'hour' = 'day'): Promise<void> {
    try {
      this.logger.log(`开始从2025年8月1日同步代币${dataType}数据`);
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
      
      this.logger.log(`开始同步从 ${utcStartDate.toISOString().split('T')[0]} 到 ${utcEndDate.toISOString().split('T')[0]} 的代币${dataType}数据`);
      
      if (dataType === 'day') {
        // 同步日数据 - 7天为一个批次
        const BATCH_SIZE_DAYS = 7;
        let currentBatchStart = new Date(utcStartDate);
        
        while (currentBatchStart <= utcEndDate) {
          // 计算当前批次的结束日期，不超过总结束日期
          const currentBatchEnd = new Date(currentBatchStart);
          currentBatchEnd.setDate(currentBatchStart.getDate() + BATCH_SIZE_DAYS - 1);
          if (currentBatchEnd > utcEndDate) {
            currentBatchEnd.setTime(utcEndDate.getTime());
          }
          
          const batchStartTimestamp = Math.floor(currentBatchStart.getTime() / 1000);
          const batchEndTimestamp = Math.floor(currentBatchEnd.getTime() / 1000) + 86400; // 包含当天结束
          
          this.logger.log(`正在同步 ${currentBatchStart.toISOString().split('T')[0]} 到 ${currentBatchEnd.toISOString().split('T')[0]} 的代币日数据批次`);
          
          // 一次性获取7天的数据
          const tokenDayDatas = await this.subgraphService.fetchTokenDayData(batchStartTimestamp, batchEndTimestamp);
          this.logger.log(`获取到 ${tokenDayDatas.length} 条代币日数据记录`);
      
          // 按日期分组处理数据
          const dayDataMap = new Map<number, any[]>();
          tokenDayDatas.forEach(data => {
            const dayTimestamp = Math.floor(new Date(data.date * 1000).setUTCHours(0, 0, 0, 0) / 1000);
            if (!dayDataMap.has(dayTimestamp)) {
              dayDataMap.set(dayTimestamp, []);
            }
            dayDataMap.get(dayTimestamp)?.push(data);
          });
      
          // 保存每个日期的代币日数据
          for (const [timestamp, datas] of dayDataMap.entries()) {
            for (const data of datas) {
              // 确保token存在
              const token = await this.tokenService.getTokenByAddress(data.token.id, TimeRange.NO_DATA);
              if (token) {
                await this.tokenService.saveTokenDayData({
                  ...data,
                  token,
                  date: timestamp,
                });
              } else {
                this.logger.warn(`Token ${data.token.id} not found, skipping day data`);
              }
            }
          }
          
          // 移动到下一个批次
          currentBatchStart.setDate(currentBatchStart.getDate() + BATCH_SIZE_DAYS);
        }
      } else if (dataType === 'hour') {
        // 同步小时数据 - 24小时为一个批次
        const BATCH_SIZE_HOURS = 24;
        const startHour = Math.floor(utcStartDate.getTime() / 1000);
        const endHour = Math.floor(utcEndDate.getTime() / 1000);
        
        // 循环处理每个批次
        for (let batchStartHour = startHour; batchStartHour <= endHour; batchStartHour += BATCH_SIZE_HOURS * 3600) {
          const batchEndHour = Math.min(batchStartHour + BATCH_SIZE_HOURS * 3600 - 3600, endHour);
          const batchStartDate = new Date(batchStartHour * 1000);
          const batchEndDate = new Date(batchEndHour * 1000);
          
          this.logger.log(`正在同步 ${batchStartDate.toISOString()} 到 ${batchEndDate.toISOString()} 的代币小时数据批次`);
          
          // 一次性获取24小时的数据
          const tokenHourDatas = await this.subgraphService.fetchTokenHourData(batchStartHour, batchEndHour + 3600);
          this.logger.log(`获取到 ${tokenHourDatas.length} 条代币小时数据记录`);
      
          // 按小时分组处理数据
          const hourDataMap = new Map<number, any[]>();
          tokenHourDatas.forEach(data => {
            const hourTimestamp = data.hour; // 使用数据中的hour字段作为时间戳
            if (!hourDataMap.has(hourTimestamp)) {
              hourDataMap.set(hourTimestamp, []);
            }
            hourDataMap.get(hourTimestamp)?.push(data);
          });
      
          // 保存每个小时的代币小时数据
          for (const [hour, datas] of hourDataMap.entries()) {
            for (const data of datas) {
              // 确保token存在
              const token = await this.tokenService.getTokenByAddress(data.token.id, TimeRange.NO_DATA);
              if (token) {
                await this.tokenService.saveTokenHourData({
                  ...data,
                  token,
                  hour: hour,
                });
              } else {
                this.logger.warn(`Token ${data.token.id} not found, skipping hour data`);
              }
            }
          }
        }
      }
      
      this.logger.log(`成功同步从 ${utcStartDate.toISOString().split('T')[0]} 到 ${utcEndDate.toISOString().split('T')[0]} 的代币${dataType}数据`);
    } catch (error) {
      this.logger.error(`同步日期范围内的代币${dataType}数据失败`, error.stack);
      throw error;
    }
  }

}