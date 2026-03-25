import { Module, Global } from '@nestjs/common';
import { NewsModule } from './news/news.module';
import { ArticleModule } from './article/article.module';
import { TweetModule } from './tweet/tweet.module';
import { CoinglassModule } from './coinglass/coinglass.module';
import { RssModule } from './rss/rss.module';
import { AppModule } from './app/app.module';

@Global()
@Module({
  imports: [NewsModule, ArticleModule, TweetModule, CoinglassModule, RssModule, AppModule],
})
export class MediaModule {}
