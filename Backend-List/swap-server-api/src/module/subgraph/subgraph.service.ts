import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';
import { join } from 'path';
import { readFileSync } from 'fs';

@Injectable()
export class SubgraphService {
  private readonly logger = new Logger(SubgraphService.name);
  private readonly queryCache = new Map<string, string>();
  private readonly apiUrl: string;
  private readonly retryAttempts: number;
  private readonly retryDelay: number;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiUrl = this.configService.get('SUBGRAPH_API_URL', 'https://api.studio.thegraph.com/query/118008/uniswap-v-3-hashkey-testnet/version/latest');
    this.retryAttempts = this.configService.get('SUBGRAPH_RETRY_ATTEMPTS', 3);
    this.retryDelay = this.configService.get('SUBGRAPH_RETRY_DELAY', 1000);
  }

  /**
   * 获取Subgraph API URL
   */
  getApiUrl(): string {
    return this.apiUrl;
  }

  /**
   * 检查Subgraph API状态
   */
  async checkApiStatus(): Promise<boolean> {
    try {
      const response = await lastValueFrom(this.httpService.get(this.apiUrl, { timeout: 5000 }));
      return response.status === 200;
    } catch (error) {
      this.logger.error('Subgraph API is unavailable:', error);
      return false;
    }
  }

  /**
   * 加载GraphQL查询文件
   */
  private loadQuery(queryName: string): string {
    if (this.queryCache.has(queryName)) {
      return this.queryCache.get(queryName);
    }

    try {
      // const queryPath = join(__dirname, 'queries', `${queryName}.graphql`);
      const queryPath = join(process.cwd(), 'src/module/subgraph/queries', `${queryName}.graphql`);
      const query = readFileSync(queryPath, 'utf8');
      this.queryCache.set(queryName, query);
      return query;
    } catch (error) {
      this.logger.error(`Failed to load query ${queryName}:`, error);
      throw new Error(`Query ${queryName} not found or could not be loaded`);
    }
  }

  /**
   * 执行GraphQL查询
   */
  private async executeQuery(queryName: string, variables: Record<string, any> = {}): Promise<any> {
    try {
      const query = this.loadQuery(queryName);
      const response = await lastValueFrom(
        this.httpService.post(this.apiUrl, {
          query,
          variables,
        }),
      );

      if (response.data.errors) {
        this.logger.error(`GraphQL query ${queryName} returned errors:`, response.data.errors);
        throw new Error(`GraphQL query ${queryName} failed: ${response.data.errors[0].message}`);
      }

      return response.data.data;
    } catch (error) {
      this.logger.error(`Failed to execute query ${queryName}:`, error);
      throw error;
    }
  }

  /**
   * 获取代币列表
   */
  async fetchTokens(first: number = 1000, skip: number = 0): Promise<any[]> {
    try {
      const data = await this.executeQuery('tokens', { first, skip });
      return data.tokens || [];
    } catch (error) {
      this.logger.error('Failed to fetch tokens:', error);
      return [];
    }
  }

  /**
   * 获取池列表
   */
  async fetchPools(first: number = 1000, skip: number = 0, where: Record<string, any> = {}): Promise<any[]> {
    try {
      this.logger.log(`[fetchPools] Executing with first: ${first}, skip: ${skip}, where: ${JSON.stringify(where)}`);
      const data = await this.executeQuery('pools', { first, skip, where });

      // 确保data和data.pools存在，且data.pools是数组
      if (!data) {
        this.logger.error('[fetchPools] ERROR: Received null/undefined data from executeQuery');
        return [];
      }
      if (!('pools' in data)) {
        this.logger.error(`[fetchPools] ERROR: data object has no 'pools' property. Available properties: ${Object.keys(data).join(', ')}`);
        return [];
      }
      if (!Array.isArray(data.pools)) {
        this.logger.error(`[fetchPools] ERROR: Expected pools to be an array but got: ${typeof data.pools}, value: ${JSON.stringify(data.pools)}`);
        return [];
      }

      this.logger.log(`[fetchPools] Successfully returning ${data.pools.length} pools`);
      return data.pools;
    } catch (error) {
      this.logger.error(`[fetchPools] Exception caught: ${error.message}`, error);
      return [];
    }
  }

  /**
   * 获取代币小时数据
   */
  async fetchTokenHourData(startTime: number, endTime: number, first: number = 1000): Promise<any[]> {
    try {
      const data = await this.executeQuery('tokenHourData', { hour: startTime, nextHour: endTime, first });
      return data.tokenHourDatas || [];
    } catch (error) {
      this.logger.error('Failed to fetch token hour data:', error);
      return [];
    }
  }

  /**
   * 获取代币日数据
   */
  async fetchTokenDayData(startTime: number, endTime: number, first: number = 1000): Promise<any[]> {
    try {
      const data = await this.executeQuery('tokenDayData', { date: startTime, nextDay: endTime, first });
      return data.tokenDayDatas || [];
    } catch (error) {
      this.logger.error('Failed to fetch token day data:', error);
      return [];
    }
  }

  /**
   * 获取池日数据
   */
  async fetchPoolDayData(date: number, first: number = 1000): Promise<any[]> {
    try {
      // 日期参数是当天的开始时间戳（UTC）
      const nextDay = date + 86400; // 24小时后
      const data = await this.executeQuery('poolDayData', { date, nextDay, first });
      return data.poolDayDatas || [];
    } catch (error) {
      this.logger.error('Failed to fetch pool day data:', error);
      return [];
    }
  }

  /**
   * 获取单个代币信息
   */
  async fetchToken(address: string): Promise<any | null> {
    try {
      const data = await this.executeQuery('token', { id: address.toLowerCase() });
      return data.token || null;
    } catch (error) {
      this.logger.error(`Failed to fetch token ${address}:`, error);
      return null;
    }
  }

  /**
   * 获取单个池信息
   */
  async fetchPool(address: string): Promise<any | null> {
    try {
      const data = await this.executeQuery('pool', { id: address.toLowerCase() });
      return data.pool || null;
    } catch (error) {
      this.logger.error(`Failed to fetch pool ${address}:`, error);
      return null;
    }
  }

  /**
   * 获取Swap交易数据
   */
  async fetchSwaps(first: number = 1000, skip: number = 0, where: Record<string, any> = {}): Promise<any[]> {
    try {
      //this.logger.log(`[fetchSwaps] Executing with first: ${first}, skip: ${skip}, where: ${JSON.stringify(where)}`);
      const data = await this.executeQuery('swaps', { first, skip, where });
      
      if (!data || !('swaps' in data) || !Array.isArray(data.swaps)) {
        this.logger.error('[fetchSwaps] Invalid response data format');
        return [];
      }
      
      //this.logger.log(`[fetchSwaps] Successfully returning ${data.swaps.length} swaps`);
      return data.swaps;
    } catch (error) {
      this.logger.error(`[fetchSwaps] Exception caught: ${error.message}`, error);
      return [];
    }
  }

  /**
   * 获取Mint数据
   */
  async fetchMints(first: number = 1000, skip: number = 0, where: Record<string, any> = {}): Promise<any[]> {
    try {
      const data = await this.executeQuery('mints', { first, skip, where });
      
      if (!data || !('mints' in data) || !Array.isArray(data.mints)) {
        this.logger.error('[fetchMints] Invalid response data format');
        return [];
      }
      
      return data.mints;
    } catch (error) {
      this.logger.error(`[fetchMints] Exception caught: ${error.message}`, error);
      return [];
    }
  }

  /**
   * 获取Burn数据
   */
  async fetchBurns(first: number = 1000, skip: number = 0, where: Record<string, any> = {}): Promise<any[]> {
    try {
      const data = await this.executeQuery('burns', { first, skip, where });
      
      if (!data || !('burns' in data) || !Array.isArray(data.burns)) {
        this.logger.error('[fetchBurns] Invalid response data format');
        return [];
      }
      
      return data.burns;
    } catch (error) {
      this.logger.error(`[fetchBurns] Exception caught: ${error.message}`, error);
      return [];
    }
  }

  /**
   * 获取Collect数据
   */
  async fetchCollects(first: number = 1000, skip: number = 0, where: Record<string, any> = {}): Promise<any[]> {
    try {
      const data = await this.executeQuery('collects', { first, skip, where });
      
      if (!data || !('collects' in data) || !Array.isArray(data.collects)) {
        this.logger.error('[fetchCollects] Invalid response data format');
        return [];
      }
      
      return data.collects;
    } catch (error) {
      this.logger.error(`[fetchCollects] Exception caught: ${error.message}`, error);
      return [];
    }
  }

  /**
   * 获取 Bundle 数据（包含 ETH 价格）
   */
  async fetchBundle(): Promise<any | null> {
    try {
      const data = await this.executeQuery('bundle');
      return data.bundle || null;
    } catch (error) {
      this.logger.error('Failed to fetch bundle data:', error);
      return null;
    }
  }
}
