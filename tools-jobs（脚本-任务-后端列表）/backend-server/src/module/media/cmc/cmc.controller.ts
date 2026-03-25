import { Controller, Get, Post, Body, Put, Param, Delete, Res, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiConsumes, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { CmcService } from './cmc.service';
import { CreateDeviceInfoDto, ListCmcCoinDto, ListCoinDto, ListDexSpotPairDto, ListExchangeDto, ListPairDto } from './dto/index';
import { RequirePermission } from 'src/common/decorators/require-premission.decorator';
import { Response } from 'express';

@ApiTags('CMC数据接口 - coinmarketcap')
@Controller('cmc')
export class CmcController {
  constructor(private readonly cmcService: CmcService) {}

  @ApiOperation({
    summary: '券商列表',
  })
  @Get('/broker')
  getVersion() {
    return this.cmcService.broker();
  }

  @ApiOperation({
    summary: '券商代币 - 列表',
  })
  @ApiBody({
    type: ListCoinDto,
    required: true,
  })
  @Get('/futunn_coins')
  findUserFillsAll(@Query() query: ListCoinDto) {
    return this.cmcService.findFutunnCoinList(query);
  }

  @ApiOperation({
    summary: 'CMC加密货币 - 代币列表',
  })
  @ApiBody({
    type: ListCmcCoinDto,
    required: true,
  })
  @Get('/coin_list')
  findCmcCoinsAll(@Query() query: ListCmcCoinDto) {
    return this.cmcService.findCmcCoinsAll(query);
  }

  @ApiOperation({
    summary: '交易所-列表',
  })
  @ApiBody({
    type: ListExchangeDto,
    required: true,
  })
  @Get('/exchange_list')
  findExchangesAll(@Query() query: ListExchangeDto) {
    return this.cmcService.findExchangesAll(query);
  }

  @ApiOperation({
    summary: '交易对-列表',
  })
  @ApiBody({
    type: ListPairDto,
    required: true,
  })
  @Get('/pair_list')
  findPairAll(@Query() query: ListPairDto) {
    return this.cmcService.findPairAll(query);
  }

  @ApiOperation({
    summary: 'DEX-SPOT 交易对-列表',
  })
  @ApiBody({
    type: ListDexSpotPairDto,
    required: true,
  })
  @Get('/dex_spot_pair_list')
  findDexSpotPairAll(@Query() query: ListDexSpotPairDto) {
    return this.cmcService.findDexSpotPairAll(query);
  }
}
