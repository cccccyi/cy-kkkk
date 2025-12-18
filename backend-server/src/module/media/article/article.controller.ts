import { Controller, Get, Post, Body, Put, Param, Delete, Res, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiConsumes, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { ArticleService } from './article.service';
import { CreatePostDto, UpdatePostDto, ListArticleDto } from './dto/index';
import { RequirePermission } from 'src/common/decorators/require-premission.decorator';

@ApiTags('文章管理')
@Controller('media/article')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @ApiOperation({
    summary: '文章管理-创建',
  })
  @ApiBody({
    type: CreatePostDto,
    required: true,
  })
  @RequirePermission('system:post:add')
  @Post('/')
  create(@Body() createPostDto: CreatePostDto) {
    return this.articleService.create(createPostDto);
  }

  @ApiOperation({
    summary: '文章展示-列表',
  })
  @ApiBody({
    type: ListArticleDto,
    required: true,
  })
  @Get('/list')
  findAll(@Query() query: ListArticleDto) {
    return this.articleService.findAll(query);
  }

  @ApiOperation({
    summary: '快讯展示-详情',
  })
  @Get('/:id')
  findOne(@Param('id') uniqueCode: string) {
    return this.articleService.findOne(uniqueCode);
  }

  @ApiOperation({
    summary: '快讯展示-分类统计',
  })
  @Get('/category/statistic')
  findCategoryCount() {
    return this.articleService.findCategoryCount();
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
    return this.articleService.update(updatePostDto);
  }

  @ApiOperation({
    summary: '快讯管理-删除',
  })
  @RequirePermission('system:post:remove')
  @Delete('/:ids')
  remove(@Param('ids') ids: string) {
    const menuIds = ids.split(',').map((id) => id);
    return this.articleService.remove(menuIds);
  }
}
