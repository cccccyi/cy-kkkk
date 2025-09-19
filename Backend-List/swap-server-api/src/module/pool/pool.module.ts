import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PoolController } from './pool.controller';
import { PoolService } from './pool.service';
import { Pool } from './entities/pool.entity';
import { PoolDayData } from './entities/pool-day-data.entity';
import { CacheModule } from '@nestjs/cache-manager';
import { CacheService } from '../cache/cache.service';
import { PoolSyncService } from './pool-sync.service';
import { PoolResolver } from './pool.resolver';
import { SubgraphModule } from '../subgraph/subgraph.module';
import { TokenModule } from '../token/token.module';

@Module({
  imports: [TypeOrmModule.forFeature([Pool, PoolDayData]), SubgraphModule, TokenModule, CacheModule.register()],
  controllers: [PoolController],
  providers: [PoolService, PoolSyncService, PoolResolver, CacheService],
  exports: [PoolService],
})
export class PoolModule {}
