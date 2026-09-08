import { Test, TestingModule } from '@nestjs/testing';
import { TokenSyncService } from '../src/module/token/token-sync.service';
import { TokenService } from '../src/module/token/token.service';
import { SubgraphService } from '../src/module/subgraph/subgraph.service';
import { Token } from '../src/module/token/entities/token.entity';
import { TokenDayData } from '../src/module/token/entities/token-day-data.entity';
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

describe('TokenSyncService', () => {
  let service: TokenSyncService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          ...getTestDatabaseConfig(),
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
