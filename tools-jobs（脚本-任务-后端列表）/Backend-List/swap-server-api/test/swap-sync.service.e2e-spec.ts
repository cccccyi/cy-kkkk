import { Test, TestingModule } from '@nestjs/testing';
import { SwapSyncService } from '../src/module/swap/swap-sync.service';
import { SwapService } from '../src/module/swap/swap.service';
import { SubgraphService } from '../src/module/subgraph/subgraph.service';
import { TokenCandlestickEntity } from '../src/module/swap/entities/token-candlestick.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

describe('SwapSyncService', () => {
  let service: SwapSyncService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: '154.219.101.126',
          port: 4431,
          username: 'postgres',
          password: 'pg_cgy16ytyJ',
          database: 'dex_swap',
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