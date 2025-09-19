import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Position } from './entities/position.entity';
import { Mint } from './entities/mint.entity';
import { Burn } from './entities/burn.entity';
import { PositionService } from './position.service';
import { PositionSyncService } from './position-sync.service';
import { PositionResolver } from './position.resolver';
import { CacheModule } from '@nestjs/cache-manager';
import { CacheService } from '../cache/cache.service';
import { SubgraphModule } from '../subgraph/subgraph.module';
import { SwapModule } from '../swap/swap.module';
import { PositionDayLiquidity } from './entities/position-day-liquidity.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Position, Mint, Burn, PositionDayLiquidity]),
    CacheModule.register(),
    SubgraphModule,
    SwapModule,
  ],
  providers: [PositionService, PositionSyncService, PositionResolver, CacheService],
  exports: [PositionService],
})
export class PositionModule {}