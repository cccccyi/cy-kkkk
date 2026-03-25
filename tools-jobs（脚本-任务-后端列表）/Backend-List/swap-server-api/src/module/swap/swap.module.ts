import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubgraphModule } from '../subgraph/subgraph.module';
import { TokenCandlestickEntity } from './entities/token-candlestick.entity';
import { SwapEntity } from './entities/swap.entity';
import { SwapService } from './swap.service';
import { SwapSyncService } from './swap-sync.service';
import { TokenModule } from '../token/token.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TokenCandlestickEntity, SwapEntity]),
    SubgraphModule,
    forwardRef(() => TokenModule)
  ],
  providers: [SwapService, SwapSyncService],
  exports: [SwapService],
})
export class SwapModule {}