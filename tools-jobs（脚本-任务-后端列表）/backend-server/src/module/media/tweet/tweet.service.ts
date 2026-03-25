import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ResultData } from 'src/common/utils/result';
import { TweetEntity } from './entities/tweet.entity';
import { CreatePostDto, UpdatePostDto, ListTweetDto } from './dto/index';

@Injectable()
export class TweetService {
  constructor(
    @InjectRepository(TweetEntity)
    private readonly tweetEntityRep: Repository<TweetEntity>,
  ) {}

  async findAll(query: ListTweetDto) {
    const entity = this.tweetEntityRep
      .createQueryBuilder('t')
      .select([
        't.tweetId',
        't.userId',
        't.screenName',
        't.name',
        't.profilePicture',
        't.isBlueVerified',
        't.profileImageShape',
        't.fullText',
        't.mediaUrlHttps',
        't.mediaUrlHttpsJson',
        't.createdAt',
        't.retweetCount',
        't.favoriteCount',
        't.replyCount',
        't.views',
        't.tag',
      ]);
    entity.andWhere('t.delFlag = :delFlag and t.hotFlag = :hotFlag', { delFlag: 0, hotFlag: 'y' });
    entity.andWhere('t.inReplyToStatusId IS NULL');

    if (query.keyword) {
      entity.andWhere('t.fullText LIKE :keyword', { keyword: `%${query.keyword}%` });
    }

    if (query.screenName) {
      entity.andWhere('t.screenName = :screenName', { screenName: query.screenName });
    }

    if (query.tag) {
      entity.andWhere('t.createdAt > :createdAt', { createdAt: '2025-01-01' });
      entity.andWhere('t.tag = :tag', { tag: query.tag });
    }

    entity.orderBy('t.createdAt', 'DESC');

    if (query.pageSize && query.pageNum) {
      entity.skip(query.pageSize * (query.pageNum - 1)).take(query.pageSize);
    }

    const [list, total] = await entity.getManyAndCount();

    return ResultData.ok({
      list,
      total,
    });
  }

  async findOne(tweetId: string) {
    const res = await this.tweetEntityRep.findOne({
      select: [
        'tweetId',
        'userId',
        'screenName',
        'name',
        'profilePicture',
        'isBlueVerified',
        'profileImageShape',
        'fullText',
        'mediaUrlHttps',
        'mediaUrlHttpsJson',
        'createdAt',
        'retweetCount',
        'favoriteCount',
        'replyCount',
        'views',
        'tag',
      ],
      where: {
        tweetId: tweetId,
      },
    });
    return ResultData.ok(res);
  }
}
