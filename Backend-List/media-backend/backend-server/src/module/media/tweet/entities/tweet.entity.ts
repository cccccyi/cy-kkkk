import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base';

@Entity('dt_twitter_crawler_tweet', {
  comment: 'X（twitter） 推文',
})
export class TweetEntity extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id', comment: 'ID' })
  public id: number;

  @Column({ type: 'varchar', name: 'tweet_id', length: 64, comment: 'tweet_id' })
  public tweetId: string;

  @Column({ type: 'varchar', name: 'user_id', comment: 'user_id' })
  public userId: string;

  @Column({ type: 'varchar', name: 'screen_name', comment: 'screen_name' })
  public screenName: string;

  @Column({ type: 'varchar', name: 'name', comment: 'name' })
  public name: string;

  @Column({ type: 'varchar', name: 'profile_picture', comment: 'profile_picture' })
  public profilePicture: string;

  @Column({ type: 'varchar', name: 'is_blue_verified', comment: 'is_blue_verified' })
  public isBlueVerified: string;

  @Column({ type: 'varchar', name: 'profile_image_shape', comment: 'profile_image_shape' })
  public profileImageShape: string;

  @Column({ type: 'varchar', name: 'full_text', length: 50, comment: 'full_text' })
  public fullText: string;

  @Column({ type: 'int', name: 'created_at', default: 0, comment: '发布时间时间戳' })
  public createdAt: number;

  @Column({ type: 'varchar', name: 'in_reply_to_status_id', length: 50, comment: 'in_reply_to_status_id' })
  public inReplyToStatusId: string;

  @Column({ type: 'varchar', name: 'in_reply_to_user_id', comment: 'in_reply_to_user_id' })
  public inReplyToUserId: string;

  @Column({ type: 'varchar', name: 'media_url_https', comment: 'media_url_https' })
  public mediaUrlHttps: string;

  @Column({ type: 'varchar', name: 'media_url_https_json', comment: 'media_url_https_json' })
  public mediaUrlHttpsJson: string;

  @Column({ type: 'int', name: 'retweet_count', comment: 'retweet_count' })
  public retweetCount: number;

  @Column({ type: 'int', name: 'favorite_count', comment: 'favorite_count' })
  public favoriteCount: number;

  @Column({ type: 'int', name: 'reply_count', comment: 'reply_count' })
  public replyCount: number;

  @Column({ type: 'int', name: 'views', comment: 'views' })
  public views: number;

  @Column({ type: 'varchar', name: 'hot_flag', comment: '热推标记' })
  public hotFlag: string;

  @Column({ type: 'varchar', name: 'tag', comment: '标签' })
  public tag: string;
}
