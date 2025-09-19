import { Controller, Post, Body, Get, Param, Query, Request } from '@nestjs/common';
import { PoolService } from './pool.service';
import { ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ListPairsDto } from './dto';
import { AgentDeployPoolDto } from './dto/agent-deploy-pool.dto';

@ApiTags('资金池')
@Controller('pool')
export class PoolController {
  constructor(private readonly poolService: PoolService) {}

  @ApiOperation({
    summary: '资金池 - 列表',
  })
  @ApiBody({
    type: ListPairsDto,
    required: true,
  })
  @Get('/poolList')
  findPairsAll(@Query() dto: ListPairsDto) {
    return [];
  }
}
