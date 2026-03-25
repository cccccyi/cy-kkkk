import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Position } from './entities/position.entity';
import { Mint } from './entities/mint.entity';
import { Burn } from './entities/burn.entity';
import { PositionDayLiquidity } from './entities/position-day-liquidity.entity';

@Injectable()
export class PositionService {
  private readonly logger = new Logger(PositionService.name);

  constructor(
    @InjectRepository(Position)
    private readonly positionRepository: Repository<Position>,
    @InjectRepository(Mint)
    private readonly mintRepository: Repository<Mint>,
    @InjectRepository(Burn)
    private readonly burnRepository: Repository<Burn>,
    @InjectRepository(PositionDayLiquidity)
    private readonly positionDayLiquidityRepository: Repository<PositionDayLiquidity>,
  ) {}

  /**
   * 保存Mint数据到数据库
   * @param mintData 从子图获取的原始Mint数据
   * @returns 保存的数据数量
   */
  async saveMints(mintData: any[]): Promise<number> {
    try {
      if (!mintData || mintData.length === 0) {
        return 0;
      }

      // 处理 Mint 数据
      const mintEntities = mintData.map(item => {
        const mint = new Mint();
        mint.id = item.id;
        mint.txId = `${item.transaction.id}#${item.logIndex || 0}`;
        mint.transactionHash = item.transaction.id;
        mint.timestamp = parseInt(item.timestamp.toString(), 10);
        mint.pool = item.pool.id;
        mint.token0 = item.pool.token0.id;
        mint.token1 = item.pool.token1.id;
        mint.owner = item.owner;
        mint.origin = item.origin;
        mint.amount = item.amount.toString();
        mint.amount0 = item.amount0.toString();
        mint.amount1 = item.amount1.toString();
        mint.amountUSD = item.amountUSD?.toString();
        mint.tickLower = parseInt(item.tickLower.toString(), 10);
        mint.tickUpper = parseInt(item.tickUpper.toString(), 10);
        mint.logIndex = parseInt((item.logIndex || 0).toString(), 10);
        return mint;
      });

      // 批量插入数据库
      await this.mintRepository.save(mintEntities);
      this.logger.log(`成功保存 ${mintEntities.length} 条 Mint 数据`);
      return mintEntities.length;
    } catch (error) {
      this.logger.error('保存 Mint 数据失败', error.stack);
      throw error;
    }
  }

  /**
   * 保存Burn数据到数据库
   * @param burnData 从子图获取的原始Burn数据
   * @returns 保存的数据数量
   */
  async saveBurns(burnData: any[]): Promise<number> {
    try {
      if (!burnData || burnData.length === 0) {
        return 0;
      }

      // 处理 Burn 数据
      const burnEntities = burnData.map(item => {
        const burn = new Burn();
        burn.id = item.id;
        burn.txId = `${item.transaction.id}#${item.logIndex || 0}`;
        burn.transactionHash = item.transaction.id;
        burn.timestamp = parseInt(item.timestamp.toString(), 10);
        burn.pool = item.pool.id;
        burn.token0 = item.pool.token0.id;
        burn.token1 = item.pool.token1.id;
        burn.owner = item.owner;
        burn.origin = item.origin;
        burn.amount = item.amount.toString();
        burn.amount0 = item.amount0.toString();
        burn.amount1 = item.amount1.toString();
        burn.amountUSD = item.amountUSD?.toString();
        burn.tickLower = parseInt(item.tickLower.toString(), 10);
        burn.tickUpper = parseInt(item.tickUpper.toString(), 10);
        burn.logIndex = parseInt((item.logIndex || 0).toString(), 10);
        return burn;
      });

      // 批量插入数据库
      await this.burnRepository.save(burnEntities);
      this.logger.log(`成功保存 ${burnEntities.length} 条 Burn 数据`);
      return burnEntities.length;
    } catch (error) {
      this.logger.error('保存 Burn 数据失败', error.stack);
      throw error;
    }
  }

  /**
   * 计算指定日期每个池子每天每个地址在特定价格区间的流动性构成
   */
  async calculatePositionDayLiquidity(date?: Date): Promise<void> {
    try {
      // 设置要计算的日期，默认为前一天
      const targetDate = date || new Date();
      const utcDate = new Date(targetDate.toISOString().split('T')[0] + 'T00:00:00Z');
      if (!date) {
        utcDate.setDate(utcDate.getDate() - 1);
      }
      
      // 获取前一天的日期
      const previousDate = new Date(utcDate);
      previousDate.setDate(previousDate.getDate() - 1);
      
      const startTimestamp = utcDate.getTime() / 1000;
      const endTimestamp = startTimestamp + 86400; // 加一天（秒）
      
      // 格式化日期字符串，用于键值
      const dateKey = utcDate.toISOString().split('T')[0];
      const previousDateKey = previousDate.toISOString().split('T')[0];
      
      // 获取当天的所有Mint和Burn记录
      const [mints, burns] = await Promise.all([
        this.mintRepository.find({
          where: {
            timestamp: Between(startTimestamp, endTimestamp - 1),
          },
        }),
        this.burnRepository.find({
          where: {
            timestamp: Between(startTimestamp, endTimestamp - 1),
          },
        }),
      ]);
      
      // 获取前一天的所有流动性数据
      const previousDayLiquidityData = await this.positionDayLiquidityRepository.find({
        where: {
          date: previousDate,
        },
      });
      
      // 创建前一天数据的映射，用于快速查找
      const previousDayDataMap = new Map<string, PositionDayLiquidity>();
      previousDayLiquidityData.forEach(data => {
        const key = `${data.pool}_${data.userAddress}_${data.tickLower}_${data.tickUpper}`;
        previousDayDataMap.set(key, data);
      });
      
      // 聚合数据：按pool、user、tickLower、tickUpper和日期分组
      const aggregatedData = new Map<string, {
        poolAddress: string;
        userAddress: string;
        date: Date;
        tickLower: number;
        tickUpper: number;
        token0: string;
        token1: string;
        liquidity: Number;
        amount0: Number;
        amount1: Number;
        totalMintLiquidity: Number;
        totalBurnLiquidity: Number;
        liquidityUSD: Number; // 添加liquidityUSD字段
      }>();
      
      // 首先，处理当天有操作的记录
      
      // 处理Mint数据
      for (const mint of mints) {
        // 键值中添加日期信息
        const key = `${mint.pool}_${mint.origin}_${dateKey}_${mint.tickLower}_${mint.tickUpper}`;
        
        // 检查前一天是否有相同位置的数据
        const previousKey = `${mint.pool}_${mint.origin}_${mint.tickLower}_${mint.tickUpper}`;
        const previousData = previousDayDataMap.get(previousKey);
        
        if (!aggregatedData.has(key)) {
          // 如果前一天有数据，则使用前一天的数据作为初始值
          if (previousData) {
            aggregatedData.set(key, {
              poolAddress: mint.pool,
              userAddress: mint.origin,
              date: utcDate,
              tickLower: mint.tickLower,
              tickUpper: mint.tickUpper,
              token0: mint.token0,
              token1: mint.token1,
              liquidity: new Number(Number(previousData.liquidity)),
              amount0: new Number(Number(previousData.amount0)),
              amount1: new Number(Number(previousData.amount1)),
              totalMintLiquidity: new Number(Number(previousData.totalMintLiquidity)),
              totalBurnLiquidity: new Number(Number(previousData.totalBurnLiquidity)),
              liquidityUSD: new Number(Number(previousData.liquidityUSD || 0))
            });
          } else {
            // 如果前一天没有数据，则从0开始
            aggregatedData.set(key, {
              poolAddress: mint.pool,
              userAddress: mint.origin,
              date: utcDate,
              tickLower: mint.tickLower,
              tickUpper: mint.tickUpper,
              token0: mint.token0,
              token1: mint.token1,
              liquidity: new Number(0),
              amount0: new Number(0),
              amount1: new Number(0),
              totalMintLiquidity: new Number(0),
              totalBurnLiquidity: new Number(0),
              liquidityUSD: new Number(0)
            });
          }
        }
        
        const data = aggregatedData.get(key);
        data.liquidity = new Number(Number(data.liquidity) + Number(mint.amount));
        data.amount0 = new Number(Number(data.amount0) + Number(mint.amount0));
        data.amount1 = new Number(Number(data.amount1) + Number(mint.amount1));
        data.totalMintLiquidity = new Number(Number(data.totalMintLiquidity) + Number(mint.amount));
        // 使用amountUSD字段计算liquidityUSD
        data.liquidityUSD = new Number(Number(data.liquidityUSD) + (mint.amountUSD ? Number(mint.amountUSD) : 0));
      }
      
      // 处理Burn数据
      for (const burn of burns) {
        // 键值中添加日期信息
        const key = `${burn.pool}_${burn.origin}_${dateKey}_${burn.tickLower}_${burn.tickUpper}`;
        
        // 检查前一天是否有相同位置的数据
        const previousKey = `${burn.pool}_${burn.origin}_${burn.tickLower}_${burn.tickUpper}`;
        const previousData = previousDayDataMap.get(previousKey);
        
        if (!aggregatedData.has(key)) {
          // 如果前一天有数据，则使用前一天的数据作为初始值
          if (previousData) {
            aggregatedData.set(key, {
              poolAddress: burn.pool,
              userAddress: burn.origin,
              date: utcDate,
              tickLower: burn.tickLower,
              tickUpper: burn.tickUpper,
              token0: burn.token0,
              token1: burn.token1,
              liquidity: new Number(Number(previousData.liquidity)),
              amount0: new Number(Number(previousData.amount0)),
              amount1: new Number(Number(previousData.amount1)),
              totalMintLiquidity: new Number(Number(previousData.totalMintLiquidity)),
              totalBurnLiquidity: new Number(Number(previousData.totalBurnLiquidity)),
              liquidityUSD: new Number(Number(previousData.liquidityUSD || 0))
            });
          } else {
            // 如果前一天没有数据，则从0开始
            aggregatedData.set(key, {
              poolAddress: burn.pool,
              userAddress: burn.origin,
              date: utcDate,
              tickLower: burn.tickLower,
              tickUpper: burn.tickUpper,
              token0: burn.token0,
              token1: burn.token1,
              liquidity: new Number(0),
              amount0: new Number(0),
              amount1: new Number(0),
              totalMintLiquidity: new Number(0),
              totalBurnLiquidity: new Number(0),
              liquidityUSD: new Number(0)
            });
          }
        }
        
        const data = aggregatedData.get(key);
        data.liquidity = new Number(Number(data.liquidity) - Number(burn.amount));
        data.amount0 = new Number(Number(data.amount0) - Number(burn.amount0));
        data.amount1 = new Number(Number(data.amount1) - Number(burn.amount1));
        data.totalBurnLiquidity = new Number(Number(data.totalBurnLiquidity) + Number(burn.amount));
        // 使用amountUSD字段计算liquidityUSD，并确保不小于0
        data.liquidityUSD = new Number(Math.max(0, Number(data.liquidityUSD) - (burn.amountUSD ? Number(burn.amountUSD) : 0)));
      }
      
      // 然后，将前一天有数据但当天没有操作的记录也添加进来（数据与前一天保持一致）
      previousDayDataMap.forEach((previousData, previousKey) => {
        const [pool, userAddress, tickLower, tickUpper] = previousKey.split('_');
        const currentKey = `${pool}_${userAddress}_${dateKey}_${tickLower}_${tickUpper}`;
        
        // 如果当天该位置还没有数据，则从昨天复制过来
        if (!aggregatedData.has(currentKey)) {
          aggregatedData.set(currentKey, {
            poolAddress: pool,
            userAddress: userAddress,
            date: utcDate,
            tickLower: parseInt(tickLower),
            tickUpper: parseInt(tickUpper),
            token0: previousData.token0,
            token1: previousData.token1,
            liquidity: new Number(Number(previousData.liquidity)),
            amount0: new Number(Number(previousData.amount0)),
            amount1: new Number(Number(previousData.amount1)),
            totalMintLiquidity: new Number(Number(previousData.totalMintLiquidity)),
            totalBurnLiquidity: new Number(Number(previousData.totalBurnLiquidity)),
            liquidityUSD: new Number(Number(previousData.liquidityUSD || 0))
          });
        }
      });
      
      // 转换为实体
      const entities = Array.from(aggregatedData.values()).map(data => {
        const entity = new PositionDayLiquidity();
        entity.pool = data.poolAddress;
        entity.userAddress = data.userAddress;
        // 确保 date 是 Date 对象
        entity.date = data.date instanceof Date ? data.date : new Date(data.date);
        entity.tickLower = data.tickLower;
        entity.tickUpper = data.tickUpper;
        entity.token0 = data.token0;
        entity.token1 = data.token1;
        entity.liquidity = data.liquidity.toString();
        entity.amount0 = data.amount0.toString();
        entity.amount1 = data.amount1.toString();
        entity.totalMintLiquidity = data.totalMintLiquidity.toString();
        entity.totalBurnLiquidity = data.totalBurnLiquidity.toString();
        entity.liquidityUSD = data.liquidityUSD.toString();
        return entity;
      });
      
      // 批量保存 - 先查询判断是否存在，不存在插入，存在更新
      if (entities.length > 0) {
        console.log(entities);
        
        // 用于跟踪处理结果
        let insertCount = 0;
        let updateCount = 0;
        
        // 为了提高性能，我们先收集所有要查询的主键
        const entityMap = new Map<string, PositionDayLiquidity>();
        const primaryKeys = [];
        
        entities.forEach(entity => {
          // 确保 entity.date 是 Date 对象后再调用 toISOString
          const date = entity.date instanceof Date ? entity.date : new Date(entity.date);
          const key = `${entity.pool}_${entity.userAddress}_${date.toISOString().split('T')[0]}_${entity.tickLower}_${entity.tickUpper}`;
          entityMap.set(key, entity);
          primaryKeys.push({
            pool: entity.pool,
            userAddress: entity.userAddress,
            date: date, // 存储 Date 对象用于查询
            tickLower: entity.tickLower,
            tickUpper: entity.tickUpper
          });
        });
        
        // 批量查询已存在的记录
        const existingEntities = await this.positionDayLiquidityRepository.find({
          where: primaryKeys
        });
        
        // 分离需要插入和更新的实体
        const entitiesToInsert: PositionDayLiquidity[] = [];
        const entitiesToUpdate: PositionDayLiquidity[] = [];
        
        // 标记已存在的实体
        const existingKeys = new Set<string>();
        existingEntities.forEach(entity => {
          // 同样确保 date 是 Date 对象
          const date = entity.date instanceof Date ? entity.date : new Date(entity.date);
          const key = `${entity.pool}_${entity.userAddress}_${date.toISOString().split('T')[0]}_${entity.tickLower}_${entity.tickUpper}`;
          existingKeys.add(key);
        });
        
        // 根据查询结果分类
        entityMap.forEach((entity, key) => {
          if (existingKeys.has(key)) {
            // 存在则更新
            entitiesToUpdate.push(entity);
          } else {
            // 不存在则插入
            entitiesToInsert.push(entity);
          }
        });
        
        // 执行插入操作
        if (entitiesToInsert.length > 0) {
          await this.positionDayLiquidityRepository.save(entitiesToInsert);
          insertCount = entitiesToInsert.length;
        }
        
        // 执行更新操作
        if (entitiesToUpdate.length > 0) {
          // 使用 queryBuilder 执行批量更新
          const queryBuilder = this.positionDayLiquidityRepository.createQueryBuilder();
          
          for (const entity of entitiesToUpdate) {
            // 再次确保 date 是 Date 对象
            const date = entity.date instanceof Date ? entity.date : new Date(entity.date);
            
            await queryBuilder
              .update(PositionDayLiquidity)
              .set({
                liquidity: entity.liquidity,
                amount0: entity.amount0,
                amount1: entity.amount1,
                totalMintLiquidity: entity.totalMintLiquidity,
                totalBurnLiquidity: entity.totalBurnLiquidity,
                token0: entity.token0,
                token1: entity.token1,
                liquidityUSD: entity.liquidityUSD,
                updatedAt: new Date()
              })
              .where('pool = :pool', { pool: entity.pool })
              .andWhere('userAddress = :userAddress', { userAddress: entity.userAddress })
              .andWhere('date = :date', { date: date })
              .andWhere('tickLower = :tickLower', { tickLower: entity.tickLower })
              .andWhere('tickUpper = :tickUpper', { tickUpper: entity.tickUpper })
              .execute();
          }
          
          updateCount = entitiesToUpdate.length;
        }
        
        this.logger.log(`成功处理 ${entities.length} 条池子每日流动性构成数据：插入 ${insertCount} 条，更新 ${updateCount} 条`);
      }
    } catch (error) {
      this.logger.error('计算池子每日流动性构成失败', error.stack);
      throw error;
    }
  }

  /**
   * 获取指定池子和用户在特定日期的流动性数据
   */
  async getPositionLiquidityByDate(
    poolAddress: string,
    userAddress: string,
    date: Date,
    tickLower?: number,
    tickUpper?: number,
  ): Promise<PositionDayLiquidity[]> {
    const queryBuilder = this.positionDayLiquidityRepository.createQueryBuilder('pdl');
    queryBuilder.where('pdl.poolAddress = :poolAddress', { poolAddress });
    queryBuilder.andWhere('pdl.userAddress = :userAddress', { userAddress });
    queryBuilder.andWhere('pdl.date = :date', { date });
    
    if (tickLower !== undefined) {
      queryBuilder.andWhere('pdl.tickLower = :tickLower', { tickLower });
    }
    
    if (tickUpper !== undefined) {
      queryBuilder.andWhere('pdl.tickUpper = :tickUpper', { tickUpper });
    }
    
    return queryBuilder.getMany();
  }

  /**
   * 获取指定池子在日期范围内的流动性历史数据
   */
  async getPositionLiquidityHistory(
    poolAddress: string,
    startDate: Date,
    endDate: Date,
    userAddress?: string,
  ): Promise<PositionDayLiquidity[]> {
    const queryBuilder = this.positionDayLiquidityRepository.createQueryBuilder('pdl');
    queryBuilder.where('pdl.poolAddress = :poolAddress', { poolAddress });
    queryBuilder.andWhere('pdl.date BETWEEN :startDate AND :endDate', { startDate, endDate });
    
    if (userAddress) {
      queryBuilder.andWhere('pdl.userAddress = :userAddress', { userAddress });
    }
    
    queryBuilder.orderBy('pdl.date', 'ASC');
    return queryBuilder.getMany();
  }

  /**
   * 获取指定日期内所有用户的流动性数据
   */
  async getUserLiquidityByDate(date: Date): Promise<PositionDayLiquidity[]> {
    try {
      this.logger.log(`开始获取${date.toISOString().split('T')[0]}的用户流动性数据`);
      
      const queryBuilder = this.positionDayLiquidityRepository.createQueryBuilder('pdl');
      queryBuilder.where('pdl.date = :date', { date });
      
      const results = await queryBuilder.getMany();
      
      this.logger.log(`成功获取${date.toISOString().split('T')[0]}的${results.length}条用户流动性数据`);
      return results;
    } catch (error) {
      this.logger.error(`获取用户流动性数据失败: ${error.message}`, error.stack);
      throw error;
    }
  }
}