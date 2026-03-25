import { Controller, Get, Post, Body, Put, Param, Delete, Res, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiConsumes, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { AppService } from './app.service';
import { CreateDeviceInfoDto } from './dto/index';
import { RequirePermission } from 'src/common/decorators/require-premission.decorator';
import { Response } from 'express';

@ApiTags('APP移动端管理')
@Controller('app')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @ApiOperation({
    summary: '应用版本-获取',
  })
  @Get('/version')
  getVersion() {
    return this.appService.getVersion();
  }

  @ApiOperation({
    summary: '快讯管理-创建',
  })
  @ApiBody({
    type: CreateDeviceInfoDto,
    required: true,
  })
  @Post('/deviceInfo')
  create(@Body() createDeviceDto: CreateDeviceInfoDto) {
    return this.appService.create(createDeviceDto);
  }
}
