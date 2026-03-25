import { Controller, Get, Post, Body, Put, Param, Delete, Res, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiConsumes, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { NewsService } from './news.service';
import { CreatePostDto, UpdatePostDto, ListPostDto } from './dto/index';
import { RequirePermission } from 'src/common/decorators/require-premission.decorator';
import { Response } from 'express';

@ApiTags('快讯管理')
@Controller('media/news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @ApiOperation({
    summary: '快讯管理-创建',
  })
  @ApiBody({
    type: CreatePostDto,
    required: true,
  })
  @RequirePermission('system:post:add')
  @Post('/')
  create(@Body() createPostDto: CreatePostDto) {
    return this.newsService.create(createPostDto);
  }

  @ApiOperation({
    summary: '快讯展示-列表',
  })
  @ApiBody({
    type: ListPostDto,
    required: true,
  })
  @Get('/list')
  findAll(@Query() query: ListPostDto) {
    return this.newsService.findAll(query);
  }

  @ApiOperation({
    summary: '快讯展示-详情',
  })
  @Get('/:id')
  findOne(@Param('id') uniqueCode: string) {
    return this.newsService.findOne(uniqueCode);
  }

  @ApiOperation({
    summary: '快讯展示-分类统计',
  })
  @Get('/category/statistic')
  findCategoryCount() {
    return this.newsService.findCategoryCount();
  }

  @ApiOperation({
    summary: '快讯管理-更新',
  })
  @ApiBody({
    type: UpdatePostDto,
    required: true,
  })
  @RequirePermission('system:post:edit')
  @Put('/')
  update(@Body() updatePostDto: UpdatePostDto) {
    return this.newsService.update(updatePostDto);
  }

  @ApiOperation({
    summary: '快讯管理-删除',
  })
  @RequirePermission('system:post:remove')
  @Delete('/:ids')
  remove(@Param('ids') ids: string) {
    const menuIds = ids.split(',').map((id) => id);
    return this.newsService.remove(menuIds);
  }

  @ApiOperation({ summary: '导出快讯管理xlsx文件' })
  @RequirePermission('system:post:export')
  @Post('/export')
  async export(@Res() res: Response, @Body() body: ListPostDto): Promise<void> {
    return this.newsService.export(res, body);
  }
}
