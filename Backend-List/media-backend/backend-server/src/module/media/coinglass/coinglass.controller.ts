import { Controller, Get, Post, Body, Put, Param, Delete, Res, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiConsumes, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { CoinglassService } from './coinglass.service';
import { CreatePostDto, UpdatePostDto, ListWhaleDto, ListUserFillsDto, CrawlQueryDto } from './dto/index';
import { RequirePermission } from 'src/common/decorators/require-premission.decorator';

@ApiTags('coinglass-hyperliquid')
@Controller('media/coinglass')
export class CoinglassController {
  constructor(private readonly coinglassService: CoinglassService) {}

  @ApiOperation({
    summary: 'hyperliquid - 列表',
  })
  @ApiBody({
    type: ListWhaleDto,
    required: true,
  })
  @Get('/hyperliquid')
  findAll(@Query() query: ListWhaleDto) {
    return this.coinglassService.findAll(query);
  }

  @ApiOperation({
    summary: 'hyperliquid - 统计',
  })
  @ApiBody({
    type: ListWhaleDto,
    required: true,
  })
  @Get('/statistic')
  statistic(@Query() query: ListWhaleDto) {
    return this.coinglassService.statistic(query);
  }

  @ApiOperation({
    summary: '最新鲸鱼动态 - 列表',
  })
  @ApiBody({
    type: ListWhaleDto,
    required: true,
  })
  @Get('/action')
  findActionAll(@Query() query: ListWhaleDto) {
    return this.coinglassService.findActionAll(query);
  }

  @ApiOperation({
    summary: '鲸鱼交易明细 - 列表',
  })
  @ApiBody({
    type: ListUserFillsDto,
    required: true,
  })
  @Get('/userfills')
  findUserFillsAll(@Query() query: ListUserFillsDto) {
    return this.coinglassService.findUserFillsAll(query);
  }

  @ApiOperation({
    summary: '恐惧贪婪指数',
  })
  @Get('/feargreedindex')
  getFearGreed() {
    return this.coinglassService.getFearGreedIndex();
  }

  @ApiOperation({
    summary: '多空比',
  })
  @ApiBody({
    type: CrawlQueryDto,
    required: true,
  })
  @Get('/longshortRatio')
  longshortRatio(@Query() query: CrawlQueryDto) {
    return this.coinglassService.longshortRatio(query);
  }

  @ApiOperation({
    summary: '爆仓数据',
  })
  @ApiBody({
    type: CrawlQueryDto,
    required: true,
  })
  @Get('/turnover')
  turnoverData(@Query() query: CrawlQueryDto) {
    return this.coinglassService.turnoverData(query);
  }

  @ApiOperation({
    summary: '山寨指数',
  })
  @Get('/altcoinSeason')
  altcoinSeason() {
    return this.coinglassService.altcoinSeason();
  }

  @ApiOperation({
    summary: 'coinankStatistic',
  })
  @Get('/coinankStatistic')
  coinankStatistic() {
    return this.coinglassService.coinankStatistic();
  }

  @ApiOperation({
    summary: 'fundingRate',
  })
  @Get('/fundingRate')
  fundingRate() {
    return this.coinglassService.fundingRate();
  }
}
