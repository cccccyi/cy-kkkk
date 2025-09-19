import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Position } from './entities/position.entity';
import { Mint } from './entities/mint.entity';
import { Burn } from './entities/burn.entity';
import { Cron, CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import { SubgraphService } from '../subgraph/subgraph.service';
import { PositionService } from './position.service';

@Injectable()
export class PositionSyncService implements OnModuleInit {
  private readonly logger = new Logger(PositionSyncService.name);

  constructor(
    @InjectRepository(Mint)
    private readonly mintRepository: Repository<Mint>,
    @InjectRepository(Burn)
    private readonly burnRepository: Repository<Burn>,
    private readonly subgraphService: SubgraphService,
    private readonly positionService: PositionService,
  ) {}

  async onModuleInit() {
    // 模块初始化时立即执行一次同步
    //await this.syncMintAndBurnData();
    //await this.syncPositionDayLiquidityDateRange();
  }

  // 每小时同步一次数据
  @Cron(CronExpression.EVERY_HOUR)
  async syncMintAndBurnData() {
    try {
      this.logger.log('开始同步 Mint 和 Burn 数据');
      
      // 首先获取上次同步的最新时间戳
      const lastMint = await this.mintRepository.findOne({ where: {}, order: { timestamp: 'DESC' }});
      const lastBurn = await this.burnRepository.findOne({ where: {}, order: { timestamp: 'DESC' }});
      
      // 确定从哪个时间戳开始同步
      const lastTimestamp = Math.max(
        lastMint?.timestamp || 0,
        lastBurn?.timestamp || 0
      );
      
      await this.syncMintData(lastTimestamp);
      await this.syncBurnData(lastTimestamp);
      
      this.logger.log('Mint 和 Burn 数据同步完成');
    } catch (error) {
      this.logger.error('同步 Mint 和 Burn 数据失败', error.stack);
    }
  }

  private async syncMintData(lastTimestamp: number) {
    try {
      this.logger.log(`开始同步 Mint 数据，从时间戳 ${lastTimestamp} 开始`);
      
      // 调用子图服务获取 Mint 数据
      const mintData = await this.subgraphService.fetchMints(
        1000, // first参数
        0,    // skip参数
        { timestamp_gte: lastTimestamp + 1 } // where参数
      );
      
      // 调用PositionService保存数据
      const count = await this.positionService.saveMints(mintData);
      this.logger.log(`成功同步 ${count} 条 Mint 数据`);
    } catch (error) {
      this.logger.error('同步 Mint 数据失败', error.stack);
    }
  }

  private async syncBurnData(lastTimestamp: number) {
    try {
      this.logger.log(`开始同步 Burn 数据，从时间戳 ${lastTimestamp} 开始`);
      
      // 调用子图服务获取 Burn 数据
      const burnData = await this.subgraphService.fetchBurns(
        1000, // first参数
        0,    // skip参数
        { timestamp_gte: lastTimestamp + 1 } // where参数
      );
      
      // 调用PositionService保存数据
      const count = await this.positionService.saveBurns(burnData);
      this.logger.log(`成功同步 ${count} 条 Burn 数据`);
    } catch (error) {
      this.logger.error('同步 Burn 数据失败', error.stack);
    }
  }

  /**
   * 定时任务：每天UTC 0点计算前一天的池子流动性构成
   */
  @Cron('0 0 * * *', { 
    name: 'syncPositionDayLiquidity', 
    timeZone: 'UTC' // 设置为UTC 0时区
  })
  async syncPositionDayLiquidity() {
    try {
      this.logger.log('开始同步池子每日流动性构成数据');
      // 获取前一天的日期（使用UTC时区计算）
      const now = new Date();
      const utcDate = new Date(now.toISOString().split('T')[0]); // 将当前时间转换为UTC日期
      utcDate.setDate(utcDate.getDate() - 1); // 获取前一天
      
      await this.positionService.calculatePositionDayLiquidity(utcDate);
      
      this.logger.log(`成功同步 ${utcDate.toISOString().split('T')[0]} (UTC) 的池子每日流动性构成数据`);
    } catch (error) {
      this.logger.error('同步池子每日流动性构成数据失败', error.stack);
    }
  }

  //@Cron('39 16 * * *')
  async syncPositionDayLiquidityDateRange() {
    try {
      this.logger.log('开始从2025年8月1日计算池子每日流动性构成数据');
      // 设置开始日期为2023年8月1日
      const startDate = new Date('2025-08-01');
      const endDate = null;
      const utcStartDate = new Date(startDate.toISOString().split('T')[0] + 'T00:00:00Z');
      const utcEndDate = endDate? new Date(endDate.toISOString().split('T')[0] + 'T00:00:00Z') 
        : new Date(new Date().toISOString().split('T')[0] + 'T00:00:00Z');
      this.logger.log(`开始计算从 ${utcStartDate.toISOString().split('T')[0]} 到 ${utcEndDate.toISOString().split('T')[0]} 的池子每日流动性构成数据`);
      
      // 验证开始日期是否早于结束日期
      if (utcStartDate > utcEndDate) {
        throw new Error('开始日期不能晚于结束日期');
      }
      
      let currentDate = new Date(utcStartDate);
      while (currentDate <= utcEndDate) {
        const targetDate = new Date(currentDate);
        await this.positionService.calculatePositionDayLiquidity(targetDate);
        // 移动到下一天
        currentDate.setDate(currentDate.getDate() + 1);
      }
      this.logger.log(`成功计算从 ${utcStartDate.toISOString().split('T')[0]} 到 ${utcEndDate.toISOString().split('T')[0]} 的池子每日流动性构成数据`);
    } catch (error) {
      this.logger.error('从2025年8月1日开始计算池子每日流动性构成数据失败', error.stack);
    }
  }

}