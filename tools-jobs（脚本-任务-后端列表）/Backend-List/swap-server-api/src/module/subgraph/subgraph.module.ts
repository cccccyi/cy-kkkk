import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SubgraphService } from './subgraph.service';
import { SubgraphResolver } from './subgraph.resolver';

@Module({
  imports: [HttpModule],
  providers: [SubgraphService, SubgraphResolver],
  exports: [SubgraphService],
})
export class SubgraphModule {}
