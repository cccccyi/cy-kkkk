import { Controller, Get, Post, Body, Put, Param, Delete, Res, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiConsumes, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { TweetService } from './tweet.service';
import { CreatePostDto, UpdatePostDto, ListTweetDto } from './dto/index';
import { RequirePermission } from 'src/common/decorators/require-premission.decorator';

@ApiTags('推文管理')
@Controller('media/tweet')
export class TweetController {
  constructor(private readonly tweetService: TweetService) {}

  @ApiOperation({
    summary: '推文展示 - 列表',
  })
  @ApiBody({
    type: ListTweetDto,
    required: true,
  })
  @Get('/list')
  findAll(@Query() query: ListTweetDto) {
    return this.tweetService.findAll(query);
  }

  @ApiOperation({
    summary: '推文展示-详情',
  })
  @Get('/:id')
  findOne(@Param('id') tweetId: string) {
    return this.tweetService.findOne(tweetId);
  }
}
