import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Point } from './entities/point.entity';
import { PointDay } from './entities/point-day.entity';
import { Collect } from './entities/collect.entity';
import { PointService } from './point.service';
import { PointSyncService } from './point-sync.service';
import { PointResolver } from './point.resolver';
import { PositionModule } from '../position/position.module';
import { SubgraphModule } from '../subgraph/subgraph.module';

@Module({
  imports: [TypeOrmModule.forFeature([Point, PointDay, Collect]), SubgraphModule, PositionModule],
  providers: [PointService, PointSyncService, PointResolver],
  exports: [PointService],
})
export class PointModule {}