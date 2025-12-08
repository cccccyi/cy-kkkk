import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Token } from './entities/token.entity';
import { TokenDayData } from './entities/token-day-data.entity';
import { TokenHourData } from './entities/token-hour-data.entity';
import { TokenService } from './token.service';
import { TokenSyncService } from './token-sync.service';
import { TokenResolver } from './token.resolver';
import { CacheModule } from '@nestjs/cache-manager';
import { CacheService } from '../cache/cache.service';
import { SubgraphModule } from '../subgraph/subgraph.module';
import { SwapModule } from '../swap/swap.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Token, TokenDayData, TokenHourData]),
    CacheModule.register(),
    SubgraphModule,
    forwardRef(() => SwapModule),
  ],
  providers: [TokenService, TokenSyncService, TokenResolver, CacheService],
  exports: [TokenService],
})
export class TokenModule {}
