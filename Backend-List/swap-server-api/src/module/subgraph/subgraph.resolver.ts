import { Query, Resolver, Args, Int } from '@nestjs/graphql';
import { SubgraphService } from './subgraph.service';
import { PoolDayData } from '../pool/entities/pool-day-data.entity';
import { Token } from '../token/entities/token.entity';
import { TokenDayData } from '../token/entities/token-day-data.entity';
import { Logger } from '../../common/utils/log4js';
import { Swap } from './dto/swap.dto';
import { PoolV3 } from './dto/pool.dto'; // 添加Pool导入

@Resolver()
export class SubgraphResolver {
  constructor(private readonly subgraphService: SubgraphService) {}

  /**
   * 获取代币列表
   */
  // @Query(() => [Token], { name: 'subgraphTokens' }) 
  // async getTokens(
  //   @Args('first', { type: () => Int, defaultValue: 100 }) first: number,
  //   @Args('skip', { type: () => Int, defaultValue: 0 }) skip: number,
  // ) {
  //   Logger.log(`Fetching tokens with first: ${first}, skip: ${skip}`, 'SubgraphResolver');
  //   return this.subgraphService.fetchTokens(first, skip);
  // }

  /**
   * 获取池列表
   */
  // @Query(() => [Pool], { name: 'subgraphPools' }) 
  // async getPools(
  //   @Args('first', { type: () => Int, defaultValue: 100 }) first: number,
  //   @Args('skip', { type: () => Int, defaultValue: 0 }) skip: number,
  // ) {
  //   Logger.log(`Fetching pools with first: ${first}, skip: ${skip}`, 'SubgraphResolver');
  //   const pools = await this.subgraphService.fetchPools(first, skip);
  //   return Array.isArray(pools) ? pools : [];
  // }

  /**
   * 获取代币日数据
   */
  // @Query(() => [TokenDayData], { name: 'subgraphTokenDayData' })
  // async getTokenDayData(
  //   @Args('date', { type: () => Int }) date: number,
  //   @Args('first', { type: () => Int, defaultValue: 100 }) first: number,
  // ) {
  //   Logger.log(`Fetching token day data for date: ${date}, first: ${first}`, 'SubgraphResolver');
  //   return this.subgraphService.fetchTokenDayData(date, first);
  // }

  /**
   * 获取池日数据
   */
  // @Query(() => [PoolDayData], { name: 'subgraphPoolDayData' })
  // async getPoolDayData(
  //   @Args('date', { type: () => Int }) date: number,
  //   @Args('first', { type: () => Int, defaultValue: 100 }) first: number,
  // ) {
  //   Logger.log(`Fetching pool day data for date: ${date}, first: ${first}`, 'SubgraphResolver');
  //   return this.subgraphService.fetchPoolDayData(date, first);
  // }

  /**
   * 获取单个代币信息
   */
  // @Query(() => Token, { name: 'subgraphToken' }) 
  // async getToken(
  //   @Args('address', { type: () => String }) address: string,
  // ) {
  //   Logger.log(`Fetching token with address: ${address}`, 'SubgraphResolver');
  //   return this.subgraphService.fetchToken(address);
  // }

  /**
   * 获取单个池信息
   */
  // @Query(() => Pool, { name: 'subgraphPool' }) 
  // async getPool(
  //   @Args('address', { type: () => String }) address: string,
  // ) {
  //   Logger.log(`Fetching pool with address: ${address}`, 'SubgraphResolver');
  //   return this.subgraphService.fetchPool(address);
  // }

  /**
   * 查询指定代币的交易历史
   * @param tokenAddress 代币地址
   * @param first 返回的交易数量
   * @param skip 跳过的交易数量
   */
  @Query(() => [Swap], { name: 'subgraphTokenSwaps' })
  async getTokenSwaps(
    @Args('tokenAddress', { type: () => String }) tokenAddress: string,
    @Args('first', { type: () => Int, defaultValue: 100 }) first: number,
    @Args('skip', { type: () => Int, defaultValue: 0 }) skip: number,
  ) {
    const boundedFirst = Math.min(Math.max(first, 1), 100);
    const boundedSkip = Math.min(Math.max(skip, 0), 100000);
    Logger.log(`Fetching swaps for token: ${tokenAddress}, first: ${boundedFirst}, skip: ${boundedSkip}`, 'SubgraphResolver');
    
    // 构建查询条件，查找代币作为token0或token1的交易
    const where = {
      or: [
        { token0: tokenAddress.toLowerCase() },
        { token1: tokenAddress.toLowerCase() }
      ]
    };
    
    return this.subgraphService.fetchSwaps(boundedFirst, boundedSkip, where);
  }

  /**
   * 查询指定代币的池子列表
   * @param tokenAddress 代币地址
   * @param first 返回的池子数量
   * @param skip 跳过的池子数量
   */
  @Query(() => [PoolV3], { name: 'subgraphTokenPools' })
  async getTokenPools(
    @Args('tokenAddress', { type: () => String }) tokenAddress: string,
    @Args('first', { type: () => Int, defaultValue: 100 }) first: number,
    @Args('skip', { type: () => Int, defaultValue: 0 }) skip: number,
  ) {
    const boundedFirst = Math.min(Math.max(first, 1), 100);
    const boundedSkip = Math.min(Math.max(skip, 0), 100000);
    Logger.log(`Fetching pools for token: ${tokenAddress}, first: ${boundedFirst}, skip: ${boundedSkip}`, 'SubgraphResolver');

    // 构建查询条件，查找代币作为token0或token1的池子
    const where = {
      or: [
        { token0: tokenAddress.toLowerCase() },
        { token1: tokenAddress.toLowerCase() }
      ]
    };

    return this.subgraphService.fetchPools(boundedFirst, boundedSkip, where);
  }

  /**
   * 查询指定池子的交易历史
   * @param poolAddress 池子地址
   * @param first 返回的交易数量
   * @param skip 跳过的交易数量
   */
  @Query(() => [Swap], { name: 'subgraphPoolSwaps' })
  async getPoolSwaps(
    @Args('poolAddress', { type: () => String }) poolAddress: string,
    @Args('first', { type: () => Int, defaultValue: 100 }) first: number,
    @Args('skip', { type: () => Int, defaultValue: 0 }) skip: number,
  ) {
    const boundedFirst = Math.min(Math.max(first, 1), 100);
    const boundedSkip = Math.min(Math.max(skip, 0), 100000);
    Logger.log(`Fetching swaps for pool: ${poolAddress}, first: ${boundedFirst}, skip: ${boundedSkip}`, 'SubgraphResolver');
    
    // 构建查询条件，查找指定池子的交易
    const where = {
      pool: poolAddress.toLowerCase()
    };
    
    return this.subgraphService.fetchSwaps(boundedFirst, boundedSkip, where);
  }
}
