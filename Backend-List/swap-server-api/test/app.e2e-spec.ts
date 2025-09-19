import { Test, TestingModule } from '@nestjs/testing';
import { TokenSyncService } from '../src/module/token/token-sync.service';
import { TokenService } from '../src/module/token/token.service';
import { SubgraphService } from '../src/module/subgraph/subgraph.service';
import { Token } from '../src/module/token/entities/token.entity';
import { TokenDayData } from '../src/module/token/entities/token-day-data.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

describe('TokenSyncService', () => {
  let service: TokenSyncService;

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
          entities: [Token, TokenDayData],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([Token, TokenDayData]),
        HttpModule,
        ConfigModule.forRoot({ isGlobal: true }), // ✅ 改成 Module
      ],
      providers: [TokenSyncService, TokenService, SubgraphService],
    }).compile();

    service = module.get<TokenSyncService>(TokenSyncService);
  });

  it('should sync tokens manually', async () => {
    const result = await service.manualSyncTokens();
    //expect(result).toBeDefined();
  });

  it('should sync token day data manually', async () => {
    const yesterday = Math.floor(Date.now() / 1000) - 86400; // 昨天
    const result = await service.manualSyncTokenDayData(yesterday);
    //expect(result.success).toBe(true);
  });
});
