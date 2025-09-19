import { Injectable, Logger } from '@nestjs/common';
import { InjectRedis } from '@songkeys/nestjs-redis';
import Redis from 'ioredis';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(@InjectRedis() private readonly redis: Redis) {}

  /**
   * 设置缓存
   */
  async set<T>(key: string, value: T, ttl: number = 300): Promise<void> {
    try {
      // 将值序列化为JSON字符串
      const serializedValue = JSON.stringify(value);
      // 使用Redis的set命令，EX参数设置过期时间（秒）
      await this.redis.set(key, serializedValue, 'EX', ttl);
      this.logger.debug(`Cache set for key: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to set cache for key: ${key}`, error);
    }
  }

  /**
   * 获取缓存
   */
  async get<T>(key: string): Promise<T | undefined> {
    try {
      const value = await this.redis.get(key);
      if (value) {
        this.logger.debug(`Cache hit for key: ${key}`);
        // 将JSON字符串反序列化为对象
        return JSON.parse(value) as T;
      } else {
        this.logger.debug(`Cache miss for key: ${key}`);
        return undefined;
      }
    } catch (error) {
      this.logger.error(`Failed to get cache for key: ${key}`, error);
      return undefined;
    }
  }

  /**
   * 删除缓存
   */
  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
      this.logger.debug(`Cache deleted for key: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete cache for key: ${key}`, error);
    }
  }

  /**
   * 清空缓存
   */
  async reset(): Promise<void> {
    try {
      // 清空当前数据库
      await this.redis.flushdb();
      this.logger.debug('Cache reset');
    } catch (error) {
      this.logger.error('Failed to reset cache', error);
    }
  }

  /**
   * 批量获取缓存
   */
  async mget<T>(keys: string[]): Promise<(T | undefined)[]> {
    try {
      const results = await this.redis.mget(...keys);
      return results.map(value => {
        if (value) {
          return JSON.parse(value) as T;
        }
        return undefined;
      });
    } catch (error) {
      this.logger.error('Failed to get multiple caches', error);
      return keys.map(() => undefined);
    }
  }

  /**
   * 批量设置缓存
   */
  async mset<T>(keyValuePairs: [string, T][], ttl: number = 300): Promise<void> {
    try {
      // 为每个键值对创建一个数组，包含键和序列化后的值
      const args = keyValuePairs.flatMap(([key, value]) => [
        key,
        JSON.stringify(value),
      ]);

      // 执行批量设置
      await this.redis.mset(...args);

      // 如果指定了TTL，为每个键设置过期时间
      if (ttl > 0) {
        await Promise.all(
          keyValuePairs.map(([key]) => this.redis.expire(key, ttl)),
        );
      }

      this.logger.debug(`Bulk cache set for ${keyValuePairs.length} keys`);
    } catch (error) {
      this.logger.error('Failed to set multiple caches', error);
    }
  }
}
