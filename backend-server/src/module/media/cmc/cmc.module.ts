import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CmcService } from './cmc.service';
import { CmcController } from './cmc.controller';
import { FutunnCoinEntity } from './entities/futunn.entity';
import { CoinEntity } from './entities/coin.entity';
import { ExchangeEntity } from './entities/exchange.entity';
import { PairEntity } from './entities/pair.entity';
import { DexSpotPairEntity } from './entities/dexSpotPair.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FutunnCoinEntity, CoinEntity, ExchangeEntity, PairEntity, DexSpotPairEntity])],
  controllers: [CmcController],
  providers: [CmcService],
  exports: [CmcService],
})
export class CmcModule {}
