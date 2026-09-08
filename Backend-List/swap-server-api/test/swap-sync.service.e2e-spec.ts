import { Test, TestingModule } from '@nestjs/testing';
import { SwapSyncService } from '../src/module/swap/swap-sync.service';
import { SwapService } from '../src/module/swap/swap.service';
import { SubgraphService } from '../src/module/subgraph/subgraph.service';
import { TokenCandlestickEntity } from '../src/module/swap/entities/token-candlestick.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

function requireTestEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required test environment variable: ${name}`);
  return value;
}

function getTestDatabaseConfig() {
  const database = requireTestEnv('TEST_DB_NAME');
  if (!/test/i.test(database)) {
    throw new Error('TEST_DB_NAME must clearly identify a disposable test database');
  }
  const port = Number.parseInt(process.env.TEST_DB_PORT || '5432', 10);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('TEST_DB_PORT must be a valid TCP port');
  }
  return {
    type: 'postgres' as const,
    host: requireTestEnv('TEST_DB_HOST'),
    port,
    username: requireTestEnv('TEST_DB_USER'),
    password: requireTestEnv('TEST_DB_PASSWORD'),
    database,
  };
}

describe('SwapSyncService', () => {
  let service: SwapSyncService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          ...getTestDatabaseConfig(),
          entities: [TokenCandlestickEntity],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([TokenCandlestickEntity]),
        HttpModule,
        ConfigModule.forRoot({ isGlobal: true }),
      ],
      providers: [SwapSyncService, SwapService, SubgraphService],
    }).compile();

    service = module.get<SwapSyncService>(SwapSyncService);
  });

  it('should manually sync top 100 tokens for a specific time range', async () => {
    // 设置测试时间范围（过去1小时）
    const endTime = Math.floor(Date.now() / 1000);
    const startTime = endTime - (60 * 60); // 1小时前

    // 调用manualSync方法
    const result = await service.manualSync(startTime, endTime);

    // 验证结果
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.count).toBeGreaterThan(0);
    console.log(`Successfully synced ${result.count} tokens`);
  }, 30000); // 增加超时时间，因为同步可能需要较长时间

});
