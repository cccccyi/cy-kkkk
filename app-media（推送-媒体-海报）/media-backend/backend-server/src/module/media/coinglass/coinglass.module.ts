import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoinglassService } from './coinglass.service';
import { CoinglassController } from './coinglass.controller';
import { WhaleEntity } from './entities/whale.entity';
import { WhaleActionEntity } from './entities/whaleaction.entity';
import { UserFillsEntity } from './entities/userfills.entity';
import { FearGreedEntity } from './entities/fearGreed.entity';
import { CrawlDataEntity } from './entities/crawlData.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WhaleEntity, WhaleActionEntity, UserFillsEntity, FearGreedEntity, CrawlDataEntity])],
  controllers: [CoinglassController],
  providers: [CoinglassService],
})
export class CoinglassModule {}
