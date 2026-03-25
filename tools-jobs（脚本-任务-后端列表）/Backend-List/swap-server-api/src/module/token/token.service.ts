import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository, LessThanOrEqual } from 'typeorm';
import { Token } from './entities/token.entity';
import { TokenDayData } from './entities/token-day-data.entity';
import { TokenHourData } from './entities/token-hour-data.entity';
import { CacheService } from '../cache/cache.service';
import { SwapService } from '../swap/swap.service';
import { TokenCandlestickEntity } from '../swap/entities/token-candlestick.entity';
import { TokenCandlestick } from './dto/token-candlestick.dto';

// 时间范围枚举
export enum TimeRange {
  NO_DATA = 'NO',
  ONE_HOUR = '1H',
  ONE_DAY = '1D',
  ONE_WEEK = '1W',
  ONE_MONTH = '1M',
  ONE_YEAR = '1Y',
}

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(
    @InjectRepository(Token) 
    private tokenRepository: Repository<Token>,
    @InjectRepository(TokenDayData) 
    private tokenDayDataRepository: Repository<TokenDayData>,
    @InjectRepository(TokenHourData) 
    private tokenHourDataRepository: Repository<TokenHourData>,
    private cacheService: CacheService,
    private swapService: SwapService, // 添加注入
  ) {}

  /**
   * 通过地址获取代币信息
   * 优先从缓存中获取，缓存未命中则从数据库查询
   */
  async getTokenByAddress(address: string, timeRange: TimeRange): Promise<Token | null> {
    const cacheKey = `token:${address.toLowerCase()}`;
    const cachedToken = await this.cacheService.get<Token>(cacheKey);

    if (cachedToken) {
      this.logger.debug(`Token ${address} found in cache`);
      //return cachedToken;
    }

    this.logger.debug(`Token ${address} not found in cache, querying database`);
    const token = await this.tokenRepository.findOneBy({
      id: address.toLowerCase(),
    });
    if(timeRange != TimeRange.NO_DATA){
      token.candlestickData24h = await this.getTokenCandlestickData(address, timeRange);
    }

    if (token) {
      // 缓存有效期设置为5分钟
      await this.cacheService.set(cacheKey, token, 300);
    }

    return token;
  }

  /**
   * 获取代币列表
   * 支持分页和排序
   */
  async getTokens(first: number = 100, skip: number = 0): Promise<Token[]> {
    const tokens = await this.tokenRepository.find({
      order: { volumeUSD: 'DESC' }, // 按交易量排序
      take: first,
      skip: skip,
    });
  
    // 为每个代币添加 24小时 K线数据
    for (const token of tokens) {
      token.candlestickData24h = await this.getTokenCandlestickData(token.id, TimeRange.ONE_DAY);
      //this.logger.debug(JSON.stringify(token));
    }
  
    return tokens;
  }

  /**
   * 保存或更新代币信息
   */
  async saveToken(token: Partial<Token>): Promise<Token> {
    const address = token.id.toLowerCase();
    let existingToken = await this.tokenRepository.findOneBy({ id: address });

    if (existingToken) {
      // 更新现有代币
      existingToken = { ...existingToken, ...token, id: address };
      const updatedToken = await this.tokenRepository.save(existingToken);
      // 更新缓存
      await this.cacheService.set(`token:${address}`, updatedToken, 300);
      return updatedToken;
    } else {
      // 创建新代币
      const newToken = this.tokenRepository.create({ ...token, id: address });
      const savedToken = await this.tokenRepository.save(newToken);
      // 设置缓存
      await this.cacheService.set(`token:${address}`, savedToken, 300);
      return savedToken;
    }
  }

  /**
   * 保存代币每日数据
   */
  async saveTokenDayData(data: Partial<TokenDayData>): Promise<TokenDayData> {
    const existingData = await this.tokenDayDataRepository.findOneBy({
      token: { id: data.token.id },
      date: data.date,
    });

    if (existingData) {
      // 更新现有数据
      return this.tokenDayDataRepository.save({ ...existingData, ...data });
    } else {
      // 创建新数据
      return this.tokenDayDataRepository.save(data);
    }
  }

  /**
   * 保存代币小时数据
   */
  async saveTokenHourData(data: Partial<TokenHourData>): Promise<TokenHourData> {
    const id = `${data.token.id}-${data.periodStartUnix}`;
    const existingData = await this.tokenHourDataRepository.findOneBy({ id });

    if (existingData) {
      // 更新现有数据
      return this.tokenHourDataRepository.save({ ...existingData, ...data });
    } else {
      // 创建新数据
      return this.tokenHourDataRepository.save({ ...data, id });
    }
  }

  /**
   * 计算并更新代币交易量
   */
  async calculateAndUpdateTokenVolumes(tokenId: string): Promise<void> {
    const token = await this.getTokenByAddress(tokenId, TimeRange.NO_DATA);
    if (!token) {
      this.logger.warn(`Token ${tokenId} not found, skipping volume calculation`);
      return;
    }

    const now = Math.floor(Date.now() / 1000);
    // 1小时交易量 (当前小时)
    const currentHour = Math.floor(now / 3600) * 3600;
    const hourData = await this.tokenHourDataRepository.findOneBy({
      token: { id: tokenId },
      periodStartUnix: currentHour
    });
    token.volumeUSD1h = hourData?.volumeUSD || '0';

    // 1天交易量 (过去24小时)
    const oneDayAgo = now - 86400;
    const dayHoursData = await this.tokenHourDataRepository.find({
      where: {
        token: { id: tokenId },
        periodStartUnix: Between(oneDayAgo, now)
      }
    });
    token.volumeUSD1d = dayHoursData.reduce((sum, data) => 
      (parseFloat(sum) + parseFloat(data.volumeUSD || '0')).toString(), '0');

    // 1周交易量 (过去7天)
    const oneWeekAgo = now - 7 * 86400;
    const weekDaysData = await this.tokenDayDataRepository.find({
      where: {
        token: { id: tokenId },
        date: Between(oneWeekAgo, now)
      }
    });
    token.volumeUSD1w = weekDaysData.reduce((sum, data) => 
      (parseFloat(sum) + parseFloat(data.volumeUSD || '0')).toString(), '0');

    // 1月交易量 (过去30天)
    const oneMonthAgo = now - 30 * 86400;
    const monthDaysData = await this.tokenDayDataRepository.find({
      where: {
        token: { id: tokenId },
        date: Between(oneMonthAgo, now)
      }
    });
    token.volumeUSD1m = monthDaysData.reduce((sum, data) => 
      (parseFloat(sum) + parseFloat(data.volumeUSD || '0')).toString(), '0');

    // 1年交易量 (过去365天)
    const oneYearAgo = now - 365 * 86400;
    const yearDaysData = await this.tokenDayDataRepository.find({
      where: {
        token: { id: tokenId },
        date: Between(oneYearAgo, now)
      }
    });
    token.volumeUSD1y = yearDaysData.reduce((sum, data) => 
      (parseFloat(sum) + parseFloat(data.volumeUSD || '0')).toString(), '0');

    // 查询52周(1年)内的最高价和最低价
    const yearHourData = await this.tokenHourDataRepository.find({
      where: {
        token: { id: tokenId },
        periodStartUnix: Between(oneYearAgo, now)
      }
    });
    
    if (yearHourData.length > 0) {
      // 找到最高价
      token.highPrice52w = yearHourData.reduce((max, data) => {
        const currentHigh = parseFloat(data.high || '0');
        return currentHigh > parseFloat(max || '0') ? data.high : max;
      }, yearHourData[0].high);
      
      // 找到最低价
      token.lowPrice52w = yearHourData.reduce((min, data) => {
        const currentLow = parseFloat(data.low || '0');
        return currentLow < parseFloat(min || 'Infinity') ? data.low : min;
      }, yearHourData[0].low);
    } else {
      // 如果没有数据，保持原值或设为0
      token.highPrice52w = token.highPrice52w || '0';
      token.lowPrice52w = token.lowPrice52w || '0';
    }

    await this.tokenRepository.save(token);
    this.logger.debug(`Updated volumes for token ${tokenId}`);
  }

  /**
   * 计算并更新所有代币的交易量
   */
  async calculateAndUpdateAllTokensVolumes(): Promise<void> {
    const tokens = await this.tokenRepository.find();
    for (const token of tokens) {
      await this.calculateAndUpdateTokenVolumes(token.id);
    }
    this.logger.debug('Updated volumes for all tokens');
  }

  /**
   * 获取代币K线数据
   * @param tokenAddress 代币地址
   * @param timeRange 时间范围（1H, 1D, 1W, 1M, 1Y）
   */
  async getTokenCandlestickData(
    tokenAddress: string, 
    timeRange: TimeRange = TimeRange.ONE_DAY
  ): Promise<TokenCandlestick[]> {
    const now = Math.floor(Date.now() / 60000) * 60;  // 取分钟开始时间
    let startTime = 0;
    let interval = 60; // 默认1分钟间隔

    // 根据时间范围计算开始时间和间隔
    switch (timeRange) {
      case TimeRange.ONE_HOUR:
        startTime = now - 1 * 60 * 60; // 1小时前
        interval = 60; // 1分钟
        break;
      case TimeRange.ONE_DAY:
        startTime = now - 24 * 60 * 60; // 24小时前
        interval = 10 * 60; // 10分钟
        break;
      case TimeRange.ONE_WEEK:
        startTime = now - 7 * 24 * 60 * 60; // 7天前
        interval = 60 * 60; // 1小时
        break;
      case TimeRange.ONE_MONTH:
        startTime = now - 30 * 24 * 60 * 60; // 30天前
        interval = 4 * 60 * 60; // 4小时
        break;
      case TimeRange.ONE_YEAR:
        startTime = now - 365 * 24 * 60 * 60; // 365天前
        interval = 24 * 60 * 60; // 1天
        break;
      default:
        startTime = now - 24 * 60 * 60; // 默认24小时前
        interval = 60; // 默认1分钟
    }

    // 获取指定时间范围内已有的K线数据
    const existingData = await this.swapService.getCandlestickDataInRange(tokenAddress, startTime, now);

    // 获取开始时间之前的最近数据（如果指定时间范围内没有数据）
    let initialData: TokenCandlestickEntity | null = null;
    if (existingData.length === 0 || existingData[0].timestamp > startTime) {
      const beforeData = await this.swapService.getCandlestickData(tokenAddress, startTime - 1);
      if (beforeData.length > 0) {
        existingData.unshift(beforeData[0]);
      }
    }
    if (existingData.length === 0){
      return []
    }
    
    // 按时间戳排序现有数据
    existingData.sort((a, b) => a.timestamp - b.timestamp);
    initialData = existingData[0];

    // 生成完整的时间戳列表
    const allTimestamps: number[] = [];
    for (let ts = startTime; ts <= now; ts += interval) {
      allTimestamps.push(ts);
    }

    // 填充缺失的数据
    const filledData: TokenCandlestick[] = [];
    let lastAvailableData = initialData;

    for (const ts of allTimestamps) {
      // 找出当前时间间隔内的所有数据点
      const intervalEndTime = ts + interval;
      const dataPointsInInterval = existingData.filter(item => 
        item.timestamp >= ts && item.timestamp < intervalEndTime
      );

      if (dataPointsInInterval.length > 0) {
        // 按时间戳排序该时间间隔内的数据点
        dataPointsInInterval.sort((a, b) => a.timestamp - b.timestamp);
        
        // 创建一个新的K线数据点，聚合该时间间隔内的数据
        const aggregatedItem = new TokenCandlestick();
        aggregatedItem.tokenAddress = tokenAddress;
        aggregatedItem.timestamp = ts;
        aggregatedItem.open = dataPointsInInterval[0].open; // 第一个数据点的开盘价
        aggregatedItem.close = dataPointsInInterval[dataPointsInInterval.length - 1].close; // 最后一个数据点的收盘价
        
        // 计算最高价和最低价
        aggregatedItem.high = dataPointsInInterval.reduce((max, item) => 
          parseFloat(item.high) > parseFloat(max) ? item.high : max, 
          dataPointsInInterval[0].high
        );
        aggregatedItem.low = dataPointsInInterval.reduce((min, item) => 
          parseFloat(item.low) < parseFloat(min) ? item.low : min, 
          dataPointsInInterval[0].low
        );
        
        // 计算交易量和交易次数的总和
        aggregatedItem.volumeUSD = dataPointsInInterval.reduce((sum, item) => 
          (parseFloat(sum) + parseFloat(item.volumeUSD)).toString(), '0'
        );
        aggregatedItem.tradeCount = dataPointsInInterval.reduce((sum, item) => 
          sum + item.tradeCount, 0
        );
        
        aggregatedItem.createdAt = new Date();
        aggregatedItem.updatedAt = new Date();
        
        filledData.push(aggregatedItem);
        lastAvailableData = dataPointsInInterval[dataPointsInInterval.length - 1];
      } else {
        // 使用上一个可用数据的收盘价填充
        const filledItem = new TokenCandlestick();
        filledItem.tokenAddress = tokenAddress;
        filledItem.timestamp = ts;
        filledItem.open = lastAvailableData!.close;
        filledItem.high = lastAvailableData!.close;
        filledItem.low = lastAvailableData!.close;
        filledItem.close = lastAvailableData!.close;
        filledItem.volumeUSD = '0';
        filledItem.tradeCount = 0;
        filledItem.createdAt = new Date();
        filledItem.updatedAt = new Date();
        filledData.push(filledItem);
      }
    }

    return filledData;
  }

}