import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Point } from './entities/point.entity';
import { PointDay } from './entities/point-day.entity';
import { Collect } from './entities/collect.entity';
import { PositionService } from '../position/position.service';

@Injectable()
export class PointService {
  private readonly logger = new Logger(PointService.name);
  // 从环境变量中读取配置，如果不存在则使用默认值
  private readonly MAX_POINTS_PER_POOL = parseInt(process.env.MAX_POINTS_PER_POOL || '1000');
  private readonly MAX_POINTS_PER_POOL_SWAP = parseInt(process.env.MAX_POINTS_PER_POOL_SWAP || '1000');
  private readonly MAX_POINTS_PER_POOL_USER = parseInt(process.env.MAX_POINTS_PER_POOL_USER || '100');
  private readonly MAX_POINTS_PER_POOL_SWAP_USER = parseInt(process.env.MAX_POINTS_PER_POOL_SWAP_USER || '100');

  constructor(
    @InjectRepository(Point)
    private readonly pointRepository: Repository<Point>,
    @InjectRepository(PointDay)
    private readonly pointDayRepository: Repository<PointDay>,
    @InjectRepository(Collect)
    private readonly collectRepository: Repository<Collect>,
    private readonly positionService: PositionService,
  ) {}

  /**
   * 计算指定日期的用户流动性的积分
   * @param targetDate 目标日期
   */
  async calculateUserLiquidityPoints(targetDate: Date): Promise<void> {
    try {
      const dateStr = targetDate.toISOString().split('T')[0];
      this.logger.log(`开始计算 ${dateStr} 的用户流动性的积分`);
      
      // 获取指定日期的所有用户流动性的数据
      const userLiquidityData = await this.positionService.getUserLiquidityByDate(targetDate);
      // 按池子分组处理流动性的数据，并在每个池子内按用户地址聚合liquidityUSD
      const poolDataMap = new Map<string, Map<string, number>>();
      
      for (const userData of userLiquidityData) {
        const { userAddress, pool, liquidityUSD } = userData;
        if (!poolDataMap.has(pool)) {
          poolDataMap.set(pool, new Map<string, number>());
        }
        const userMap = poolDataMap.get(pool)!;
        const currentLiquidity = parseFloat(liquidityUSD || '0');
        
        // 如果用户已存在于该池子中，累加liquidityUSD；否则设置初始值
        if (userMap.has(userAddress)) {
          userMap.set(userAddress, userMap.get(userAddress)! + currentLiquidity);
        } else {
          userMap.set(userAddress, currentLiquidity);
        }
      }
      
      // 创建一个Map来存储每个用户的总积分
      const userTotalPointsMap = new Map<string, number>();
      
      // 遍历每个池子计算每个用户的积分，并累加到用户总积分中
      for (const [poolAddress, userMap] of poolDataMap.entries()) {
        // 计算该池子的总流动性的积分
        const totalLiquidityUSD = Array.from(userMap.values()).reduce((sum, liquidity) => sum + liquidity, 0);
        // 判断是否需要按比例分配积分
        const shouldAllocateByRatio = totalLiquidityUSD > this.MAX_POINTS_PER_POOL * 100;
        
        // 修改 calculateUserLiquidityPoints 方法中的积分计算逻辑
        // 遍历池子里的每个用户计算积分
        for (const [userAddress, liquidityUSD] of userMap.entries()) {
          let poolPoints = 0;
          if (liquidityUSD > 0) {
            if (shouldAllocateByRatio && totalLiquidityUSD > 0) {
              // 按比例分配积分基数
              const ratio = liquidityUSD / totalLiquidityUSD;
              poolPoints = ratio * this.MAX_POINTS_PER_POOL;
            } else {
              // 使用指数方式计算积分
              poolPoints = this.calculateExponentialPoints(liquidityUSD);
            }
            poolPoints = Math.min(poolPoints, this.MAX_POINTS_PER_POOL);
          }
          // 将该池子的积分累加到用户总积分中
          if (userTotalPointsMap.has(userAddress)) {
            userTotalPointsMap.set(userAddress, userTotalPointsMap.get(userAddress)! + poolPoints);
          } else {
            userTotalPointsMap.set(userAddress, poolPoints);
          }
        }
      }
      
      // 现在遍历用户总积分Map，一次性更新数据库
      for (const [userAddress, totalPoints] of userTotalPointsMap.entries()) {
        // 应用单个用户每天流动性的最大积分限制
        const limitedPoints = Math.min(totalPoints, this.MAX_POINTS_PER_POOL_USER);
        const pointsUser = parseFloat(limitedPoints.toFixed(6));
        
        // 记录用户当日的积分
        await this.recordUserDailyPoints(userAddress, targetDate, pointsUser);
        // 更新用户的总积分
        await this.updateUserTotalPoints(userAddress);
      }
      
      this.logger.log(`成功计算 ${dateStr} 的流动性的积分，覆盖 ${userLiquidityData.length} 条流动性的数据，聚合后得到 ${userTotalPointsMap.size} 个用户的总积分`);
    } catch (error) {
      this.logger.error('计算用户流动性的积分详情失败', error.stack);
      throw error;
    }
  }

  /**
   * 记录用户当日的积分
   * @param userAddress 用户地址
   * @param date 日期
   * @param liquidityPoints 流动性的积分
   */
  async recordUserDailyPoints(userAddress: string, date: Date, liquidityPoints: number): Promise<void> {
    try {
      // 查找用户的当日积分记录
      let pointDayRecord = await this.pointDayRepository.findOne({
        where: {
          userAddress,
          date
        }
      });
      
      // 如果记录不存在，创建新记录
      if (!pointDayRecord) {
        pointDayRecord = new PointDay();
        pointDayRecord.userAddress = userAddress;
        pointDayRecord.date = date;
        pointDayRecord.poolPoints = liquidityPoints; // 流动性的积分作为池子积分
        pointDayRecord.tradingPoints = 0;
      } else {
        // 如果记录存在，更新池子积分
        pointDayRecord.poolPoints = liquidityPoints;
      }
      await this.pointDayRepository.save(pointDayRecord);
    } catch (error) {
      this.logger.error(`记录用户 ${userAddress} 的当日积分失败`, error.stack);
    }
  }

  /**
   * 更新用户的总积分（按钱包地址计算所有时间的积分总和）
   * @param userAddress 用户地址
   */
  async updateUserTotalPoints(userAddress: string): Promise<void> {
    try {
      // 从PointDay表查询该用户的所有池子积分记录（不按日期过滤）
      const pointDayRecords = await this.pointDayRepository.find({
        where: {
          userAddress
        }
      });

      // 计算池子积分总和
      const totalPoolPoints = pointDayRecords.reduce((sum, record) => {
        const points = parseFloat(record.poolPoints.toString() || '0');
        return sum + points;
      }, 0);

      // 查找或创建用户的总积分记录
      let pointRecord = await this.pointRepository.findOne({
        where: {
          userAddress
        }
      });

      if (!pointRecord) {
        pointRecord = new Point();
        pointRecord.userAddress = userAddress;
        pointRecord.liquidityPoints = totalPoolPoints;
        pointRecord.tradingPoints = 0;
      } else {
        // 直接设置为查询到的总和，而不是累加
        pointRecord.liquidityPoints = totalPoolPoints;
      }
      await this.pointRepository.save(pointRecord);
      this.logger.log(`更新用户 ${userAddress} 的总积分成功，累计积分值: ${totalPoolPoints}`);
    } catch (error) {
      this.logger.error(`更新用户 ${userAddress} 的总积分失败`, error.stack);
    }
  }

  /**
   * 计算指定日期的用户交易积分
   * @param targetDate 目标日期
   */
  async calculateUserTradingPoints(targetDate: Date): Promise<void> {
    try {
      const dateStr = targetDate.toISOString().split('T')[0];
      this.logger.log(`开始计算 ${dateStr} 的用户交易积分`);
      
      // 获取指定日期的所有collect数据
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      // 转换为时间戳（秒）
      const startTimestamp = Math.floor(startOfDay.getTime() / 1000);
      const endTimestamp = Math.floor(endOfDay.getTime() / 1000);
      
      // 查询指定日期范围内的所有collect数据
      const collects = await this.collectRepository.find({
        where: {
          timestamp: Between(startTimestamp, endTimestamp)
        }
      });
      
      // 按池子分组处理collect数据
      const poolDataMap = new Map<string, Map<string, number>>();
      for (const collect of collects) {
        const { pool, origin, amountUSD } = collect;
        if (!origin) continue; // 确保有收取者地址
        
        // 计算手续费的美元价值
        const feeUSD = parseFloat(amountUSD || '0');
        if (feeUSD <= 0) continue; // 跳过无效的手续费
        
        if (!poolDataMap.has(pool)) {
          poolDataMap.set(pool, new Map<string, number>());
        }
        const userMap = poolDataMap.get(pool)!;
        
        // 如果用户已存在于该池子中，累加手续费；否则设置初始值
        if (userMap.has(origin)) {
          userMap.set(origin, userMap.get(origin)! + feeUSD);
        } else {
          userMap.set(origin, feeUSD);
        }
      }
      
      // 创建一个Map来存储每个用户的总交易积分
      const userTotalPointsMap = new Map<string, number>();
      
      // 遍历每个池子计算每个用户的积分，并累加到用户总积分中
      for (const [poolAddress, userMap] of poolDataMap.entries()) {
        // 计算该池子的总手续费
        const totalFeeUSD = Array.from(userMap.values()).reduce((sum, fee) => sum + fee, 0);
        // 判断是否需要按比例分配积分（总积分超过1000）
        const shouldAllocateByRatio = totalFeeUSD > this.MAX_POINTS_PER_POOL_SWAP * 100;
        
        // 修改 calculateUserTradingPoints 方法中的积分计算逻辑
        // 遍历池子里的每个用户计算积分
        for (const [userAddress, feeUSD] of userMap.entries()) {
          let poolTradingPoints = 0;
          if (feeUSD > 0) {
            if (shouldAllocateByRatio && totalFeeUSD > 0) {
              // 按比例分配积分基数
              const ratio = feeUSD / totalFeeUSD;
              poolTradingPoints = ratio * this.MAX_POINTS_PER_POOL_SWAP;
            } else {
              // 使用指数方式计算积分
              poolTradingPoints = this.calculateExponentialPoints(feeUSD);
            }
          }
          // 将该池子的积分累加到用户总积分中
          if (userTotalPointsMap.has(userAddress)) {
            userTotalPointsMap.set(userAddress, userTotalPointsMap.get(userAddress)! + poolTradingPoints);
          } else {
            userTotalPointsMap.set(userAddress, poolTradingPoints);
          }
        }
      }
      
      // 现在遍历用户总积分Map，一次性更新数据库
      for (const [userAddress, totalPoints] of userTotalPointsMap.entries()) {
      // 应用单个用户每天交易最大积分限制
      const limitedPoints = Math.min(totalPoints, this.MAX_POINTS_PER_POOL_SWAP_USER);
      const tradingPoints = parseFloat(limitedPoints.toFixed(6));
      // 记录用户当日的交易积分
      await this.recordUserDailyTradingPoints(userAddress, targetDate, tradingPoints);
      // 更新用户的总交易积分
      await this.updateUserTotalTradingPoints(userAddress);
      }
      
      this.logger.log(`成功计算 ${dateStr} 的用户交易积分，覆盖 ${collects.length} 条collect数据，聚合后得到 ${userTotalPointsMap.size} 个用户的总积分`);
    } catch (error) {
      this.logger.error('计算用户交易积分失败', error.stack);
      throw error;
    }
  }

  /**
   * 记录用户当日的交易积分
   * @param userAddress 用户地址
   * @param date 日期
   * @param tradingPoints 交易积分
   */
  async recordUserDailyTradingPoints(userAddress: string, date: Date, tradingPoints: number): Promise<void> {
    try {
      // 查找用户的当日积分记录
      let pointDayRecord = await this.pointDayRepository.findOne({
        where: {
          userAddress,
          date
        }
      });
      // 如果记录不存在，创建新记录
      if (!pointDayRecord) {
        pointDayRecord = new PointDay();
        pointDayRecord.userAddress = userAddress;
        pointDayRecord.date = date;
        pointDayRecord.poolPoints = 0;
        pointDayRecord.tradingPoints = tradingPoints;
      } else {
        // 如果记录存在，更新交易积分
        pointDayRecord.tradingPoints = tradingPoints;
      }
      await this.pointDayRepository.save(pointDayRecord);
    } catch (error) {
      this.logger.error(`记录用户 ${userAddress} 的当日交易积分失败`, error.stack);
    }
  }

  /**
   * 更新用户的总交易积分
   * @param userAddress 用户地址
   */
  async updateUserTotalTradingPoints(userAddress: string): Promise<void> {
    try {
      // 从PointDay表查询该用户的所有交易积分记录
      const pointDayRecords = await this.pointDayRepository.find({
        where: {
          userAddress
        }
      });

      // 计算交易积分总和
      const totalTradingPoints = pointDayRecords.reduce((sum, record) => {
        const points = parseFloat(record.tradingPoints.toString() || '0');
        return sum + points;
      }, 0);

      // 查找或创建用户的总积分记录
      let pointRecord = await this.pointRepository.findOne({
        where: {
          userAddress
        }
      });

      if (!pointRecord) {
        pointRecord = new Point();
        pointRecord.userAddress = userAddress;
        pointRecord.liquidityPoints = 0;
        pointRecord.tradingPoints = totalTradingPoints;
      } else {
        // 直接设置为查询到的总和
        pointRecord.tradingPoints = totalTradingPoints;
      }
      await this.pointRepository.save(pointRecord);
      this.logger.log(`更新用户 ${userAddress} 的总交易积分成功，累计积分值: ${totalTradingPoints}`);
    } catch (error) {
      this.logger.error(`更新用户 ${userAddress} 的总交易积分失败`, error.stack);
    }
  }

  /**
   * 保存Collect数据到数据库（批量存储实现）
   * @param collects collect数据列表
   * @returns 保存的记录数
   */
  async saveCollects(collects: any[]): Promise<number> {
    if (!collects || collects.length === 0) {
      return 0;
    }
    
    try {
      // 提取所有id用于批量查询
      const ids = collects
        .map(collectData => collectData.id)
        .filter(Boolean); // 过滤掉无效的id
      
      if (ids.length === 0) {
        this.logger.warn('没有有效的collect id可以处理');
        return 0;
      }
      
      // 通过id字段批量查询已存在的记录
      const existingCollects = await this.collectRepository.find({
        where: ids.map(id => ({ id })),
        select: ['id']
      });
      
      // 创建已存在ID的集合，用于快速查找
      const existingIds = new Set(
        existingCollects.map(collect => collect.id)
      );
      
      // 过滤掉已存在的数据，并批量创建Collect对象
      const newCollects: Collect[] = collects
        .filter(collectData => collectData.id && !existingIds.has(collectData.id))
        .map(collectData => {
          const collect = new Collect();
          collect.id = collectData.id; // 直接使用子图提供的id
          collect.transactionHash = collectData.transaction?.id || collectData.transactionHash;
          collect.timestamp = parseInt(collectData.timestamp);
          collect.pool = collectData.pool?.id || collectData.pool;
          collect.owner = collectData.owner;
          collect.origin = collectData.origin;
          collect.tickLower = parseInt(collectData.tickLower);
          collect.tickUpper = parseInt(collectData.tickUpper);
          collect.amount0 = collectData.amount0;
          collect.amount1 = collectData.amount1;
          collect.amountUSD = collectData.amountUSD;
          collect.logIndex = collectData.logIndex ? parseInt(collectData.logIndex) : undefined;
          
          return collect;
        });
      
      // 批量保存数据
      if (newCollects.length > 0) {
        await this.collectRepository.save(newCollects, {
          chunk: 1000, // 每批处理的记录数
          transaction: false // 禁用事务以提高性能
        });
        
        this.logger.log(`成功批量保存 ${newCollects.length} 条collect数据`);
      }
      
      return newCollects.length;
    } catch (error) {
      this.logger.error(`批量保存collect数据失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 获取数据库中最新的collect记录的时间戳
   * @returns 最新时间戳（秒）
   */
  async getLatestCollectTimestamp(): Promise<number> {
    try {
      const latestCollect = await this.collectRepository.findOne({
        where: {},
        order: {
          timestamp: 'DESC'
        },
        select: ['timestamp']
      });

      return latestCollect ? latestCollect.timestamp : 0;
    } catch (error) {
      this.logger.error('获取最新collect时间戳失败', error.stack);
      return 0;
    }
  }

  /**
   * 资金规模与得到的积分关系， 现象、指数、平方跟邓
   * @param amountUSD 交易额（美元）
   * @returns 计算后的积分
   */
  private calculateExponentialPoints(amountUSD: number): number {
    // 确保金额为正数
    if (amountUSD <= 0) {
      return 0;
    }

    // 线性关系
    const points = amountUSD;

    /*
    // 对数关系，计算log2(x)，x为交易额
    const points = Math.log2(amountUSD);
    **/
    
    // 确保积分不为负数，设置最低积分为0
    return Math.max(points, 0);
  }

  /**
   * 获取指定地址的当前积分记录
   * @param userAddress 用户钱包地址
   * @returns Point 积分记录对象，如果不存在则返回null
   */
  async getUserCurrentPoint(userAddress: string): Promise<Point | null> {
    try {
      const point = await this.pointRepository.findOne({
        where: {
          userAddress
        }
      });
      
      this.logger.log(`获取用户 ${userAddress} 的当前积分记录成功`);
      return point;
    } catch (error) {
      this.logger.error(`获取用户 ${userAddress} 的当前积分记录失败`, error.stack);
      throw error;
    }
  }

}