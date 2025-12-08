import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, LessThanOrEqual, Repository } from 'typeorm';
import { SubgraphService } from '../subgraph/subgraph.service';
import { TokenCandlestickEntity } from './entities/token-candlestick.entity';
import { SwapEntity } from './entities/swap.entity';

@Injectable()
export class SwapService {
  private readonly logger = new Logger(SwapService.name);

  constructor(
    @InjectRepository(TokenCandlestickEntity)
    private readonly candlestickRepo: Repository<TokenCandlestickEntity>,
    @InjectRepository(SwapEntity)
    private readonly swapRepo: Repository<SwapEntity>,
    private readonly subgraphService: SubgraphService,
  ) {}

  /**
   * 处理swap数据并更新K线
   * @param tokenAddress 代币地址
   * @param startTime 开始时间戳
   * @param endTime 结束时间戳
   */
  async processSwapData(tokenAddress: string, startTime: number, endTime: number): Promise<void> {
    this.logger.log(`[processSwapData] Processing token: ${tokenAddress}, from ${startTime} to ${endTime}`);

    try {
      // 从数据库中获取swap数据，而不是从子图获取
      const swaps = await this.fetchSwapsFromDatabase(tokenAddress, startTime, endTime);

      // 按时间戳排序
      swaps.sort((a, b) => a.timestamp - b.timestamp);

      // 创建一个Map来存储每个分钟窗口的数据
      const minuteWindowMap = new Map<number, typeof swaps>();

      // 将swaps分配到对应的分钟窗口
      for (const swap of swaps) {
        // 计算swap所属的分钟窗口起始时间
        const windowStartTime = Math.floor(swap.timestamp / 60) * 60;
        
        if (!minuteWindowMap.has(windowStartTime)) {
          minuteWindowMap.set(windowStartTime, []);
        }
        minuteWindowMap.get(windowStartTime)?.push(swap);
      }

      // 处理每个有数据的分钟窗口
      for (const [windowStartTime, windowSwaps] of minuteWindowMap.entries()) {
        const windowEndTime = windowStartTime + 60;

        // 计算窗口内的价格数据
        const prices = windowSwaps.map(swap => {
          if (swap.token0.toLowerCase() === tokenAddress.toLowerCase()) {
            return parseFloat(swap.amountUSD) / Math.abs(parseFloat(swap.amount0));
          } else {
            return parseFloat(swap.amountUSD) / Math.abs(parseFloat(swap.amount1));
          }
        });

        const open = prices[0].toString();
        const high = Math.max(...prices).toString();
        const low = Math.min(...prices).toString();
        const close = prices[prices.length - 1].toString();
        const volumeUSD = windowSwaps.reduce((sum, swap) => sum + parseFloat(swap.amountUSD), 0).toString();
        const tradeCount = windowSwaps.length;

        // 保存或更新K线数据
        const existingCandlestick = await this.candlestickRepo.findOneBy({
          tokenAddress,
          timestamp: windowStartTime
        });

        if (existingCandlestick) {
          // 更新现有数据
          existingCandlestick.open = open;
          existingCandlestick.high = high;
          existingCandlestick.low = low;
          existingCandlestick.close = close;
          existingCandlestick.volumeUSD = volumeUSD;
          existingCandlestick.tradeCount = tradeCount;
          await this.candlestickRepo.save(existingCandlestick);
        } else {
          // 创建新数据
          const newCandlestick = this.candlestickRepo.create({
            tokenAddress,
            timestamp: windowStartTime,
            open,
            high,
            low,
            close,
            volumeUSD,
            tradeCount
          });
          await this.candlestickRepo.save(newCandlestick);
        }
      }

      this.logger.log(`[processSwapData] Completed processing for ${tokenAddress}`);
    } catch (error) {
      this.logger.error(`[processSwapData] Failed to process data for ${tokenAddress}:`, error);
      throw error;
    }
  }

  /**
   * 从数据库中获取代币的swap数据
   * @param tokenAddress 代币地址
   * @param startTime 开始时间戳
   * @param endTime 结束时间戳
   */
  private async fetchSwapsFromDatabase(tokenAddress: string, startTime: number, endTime: number): Promise<SwapEntity[]> {
    this.logger.log(`[fetchSwapsFromDatabase] Fetching swaps for token ${tokenAddress} from ${startTime} to ${endTime}`);
    
    try {
      // 从数据库中查询指定时间范围内的swap数据
      return await this.swapRepo.find({
        where: [
          {
            timestamp: Between(startTime, endTime),
            token0: tokenAddress.toLowerCase() 
          },
          {
            timestamp: Between(startTime, endTime),
            token1: tokenAddress.toLowerCase() 
          }
        ],
        order: {
          timestamp: 'ASC'
        }
      });
    } catch (error) {
      this.logger.error(`[fetchSwapsFromDatabase] Failed to fetch swaps from database:`, error);
      // 如果数据库查询失败，可以回退到从子图获取数据作为备用方案
      return this.subgraphService.fetchSwaps(1000, 0, {
        or: [
          {
            timestamp_gte: startTime,
            timestamp_lt: endTime,
            token0: tokenAddress.toLowerCase()
          },
          {
            timestamp_gte: startTime,
            timestamp_lt: endTime,
            token1: tokenAddress.toLowerCase()
          }
        ]
      });
    }
  }

  /**
   * 获取代币的K线数据
   * @param tokenAddress 代币地址
   * @param endTime 结束时间戳（查询timestamp小于等于此值的数据）
   */
  async getCandlestickData(
    tokenAddress: string,
    endTime: number
  ): Promise<TokenCandlestickEntity[]> {
    return this.candlestickRepo.find({
      where: {
        tokenAddress,
        timestamp: LessThanOrEqual(endTime),
      },
      order: {
        timestamp: 'DESC'  // 按时间倒序排列
      },
      take: 1  // 只查询1条结果
    });
  }

  /**
   * 获取代币指定时间范围内的K线数据
   * @param tokenAddress 代币地址
   * @param startTime 开始时间戳
   * @param endTime 结束时间戳
   */
  async getCandlestickDataInRange(
    tokenAddress: string,
    startTime: number,
    endTime: number
  ): Promise<TokenCandlestickEntity[]> {
    return this.candlestickRepo.find({
      where: {
        tokenAddress,
        timestamp: Between(startTime, endTime),
      },
      order: {
        timestamp: 'ASC'  // 按时间正序排列
      }
    });
  }

  /**
   * 保存批量swap数据
   * @param swaps swap数据数组
   */
  async saveSwaps(swaps: any[]): Promise<void> {
    this.logger.log(`[saveSwaps] Saving ${swaps.length} swap records`);

    try {
      const swapEntities = swaps.map(swap => {
        const entity = new SwapEntity();
        entity.id = swap.id;
        entity.transactionHash = swap.transaction.id;
        entity.timestamp = swap.timestamp;
        entity.pool = swap.pool.id;
        entity.token0 = swap.token0.id.toLowerCase();
        entity.token1 = swap.token1.id.toLowerCase();
        entity.sender = swap.sender;
        entity.recipient = swap.recipient;
        entity.origin = swap.origin || swap.sender;
        entity.amount0 = swap.amount0;
        entity.amount1 = swap.amount1;
        entity.amountUSD = swap.amountUSD;
        entity.sqrtPriceX96 = swap.sqrtPriceX96.toString();
        entity.tick = swap.tick;
        entity.logIndex = swap.logIndex;
        entity.createdAt = new Date();
        entity.updatedAt = new Date();
        return entity;
      });

      // 批量插入或更新
      // 先检查哪些ID已存在
      const existingIds = (await this.swapRepo.find({
        where: { id: In(swapEntities.map(s => s.id)) },
        select: ['id']
      })).map(s => s.id);

      // 分离需要插入和更新的实体
      const entitiesToInsert = swapEntities.filter(s => !existingIds.includes(s.id));
      const entitiesToUpdate = swapEntities.filter(s => existingIds.includes(s.id));

      // 批量插入
      if (entitiesToInsert.length > 0) {
        await this.swapRepo.save(entitiesToInsert);
        this.logger.log(`[saveSwaps] Inserted ${entitiesToInsert.length} new swap records`);
      }

      // 批量更新
      if (entitiesToUpdate.length > 0) {
        for (const entity of entitiesToUpdate) {
          await this.swapRepo.update(entity.id, entity);
        }
        this.logger.log(`[saveSwaps] Updated ${entitiesToUpdate.length} existing swap records`);
      }

    } catch (error) {
      this.logger.error(`[saveSwaps] Failed to save swap data:`, error);
      throw error;
    }
  }

  /**
   * 获取最近的swap记录的时间戳
   */
  async getLatestSwapTimestamp(): Promise<number> {
    try {
      const latestSwap = await this.swapRepo.findOne({
        where: {},
        order: { timestamp: 'DESC' },
        select: ['timestamp']
      });
      return latestSwap ? latestSwap.timestamp : 0;
    } catch (error) {
      this.logger.error(`[getLatestSwapTimestamp] Failed to get latest swap timestamp:`, error);
      return 0;
    }
  }
}