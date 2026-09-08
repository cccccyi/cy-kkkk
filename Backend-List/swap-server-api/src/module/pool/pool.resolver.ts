import { BadRequestException } from '@nestjs/common';
import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { PoolService } from './pool.service';
import { Pool } from './entities/pool.entity';
import { PoolDayData } from './entities/pool-day-data.entity';
import { TimeRange } from '../token/token.service';

@Resolver(() => Pool)
export class PoolResolver {
  constructor(private readonly poolService: PoolService) {}

  /**
   * 通过地址查询池信息
   */
  @Query(() => Pool, { name: 'pool', nullable: true })
  async getPool(
    @Args('id') address: string,
    @Args('timeRange', { type: () => String, defaultValue: '1D' }) timeRange: TimeRange // 添加时间范围参数
  ): Promise<Pool | null> {
    return this.poolService.getPool(address, timeRange);
  }

  /**
   * 查询池列表
   */
  @Query(() => [Pool], { name: 'pools' })
  async getPools(
    @Args('first', { type: () => Int, defaultValue: 100 }) first: number, 
    @Args('skip', { type: () => Int, defaultValue: 0 }) skip: number): Promise<Pool[]> {
    const boundedFirst = Math.min(Math.max(first, 1), 100);
    const boundedSkip = Math.min(Math.max(skip, 0), 100000);
    return this.poolService.getPools(boundedFirst, boundedSkip);
  }

  /**
   * 查询池历史数据
   */
  @Query(() => [PoolDayData], { name: 'poolHistory' })
  async getPoolHistory(@Args('address') address: string, @Args('startDate', { type: () => Int }) startDate: number, @Args('endDate', { type: () => Int }) endDate: number): Promise<PoolDayData[]> {
    const maxRangeSeconds = 366 * 24 * 60 * 60;
    if (startDate < 0 || endDate < startDate || endDate - startDate > maxRangeSeconds) {
      throw new BadRequestException('Invalid or excessive history range');
    }
    return this.poolService.getPoolHistory(address, startDate, endDate);
  }

  /**
   * 查询特定代币的池
   */
  @Query(() => [Pool], { name: 'poolsByToken' })
  async getPoolsByToken(
    @Args('tokenAddress') tokenAddress: string,
    @Args('limit', { type: () => Int, defaultValue: 100 }) limit: number,
  ): Promise<Pool[]> {
    const boundedLimit = Math.min(Math.max(limit, 1), 100);
    return this.poolService.getPoolsByToken(tokenAddress, boundedLimit);
  }
}
