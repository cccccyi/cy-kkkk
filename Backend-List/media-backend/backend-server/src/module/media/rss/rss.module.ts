import { Module } from '@nestjs/common';
import { NewsModule } from '../news/news.module';
import { ArticleModule } from '../article/article.module';
import { TweetModule } from '../tweet/tweet.module';
import { RssController } from './rss.controller';

@Module({
  imports: [NewsModule, ArticleModule, TweetModule],
  controllers: [RssController],
})
export class RssModule {}
