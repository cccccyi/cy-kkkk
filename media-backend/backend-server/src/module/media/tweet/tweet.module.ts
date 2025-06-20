import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TweetService } from './tweet.service';
import { TweetController } from './tweet.controller';
import { TweetEntity } from './entities/tweet.entity';
@Module({
  imports: [TypeOrmModule.forFeature([TweetEntity])],
  controllers: [TweetController],
  providers: [TweetService],
  exports: [TweetService],
})
export class TweetModule {}
