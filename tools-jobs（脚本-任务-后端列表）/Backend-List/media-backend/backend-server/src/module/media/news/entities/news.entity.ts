import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from 'src/common/entities/base';

@Entity('dt_hash_news_list', {
  comment: 'HashNews 快讯表',
})
export class HashNewsEntity extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id', comment: 'ID' })
  public id: number;

  @Column({ type: 'varchar', name: 'unique_code', length: 64, comment: '编码' })
  public uniqueCode: string;

  @Column({ type: 'int', name: 'publish_time', default: 0, comment: '发布时间时间戳' })
  public publishTime: number;

  @Column({ type: 'varchar', name: 'primary_category', length: 50, comment: '主分类' })
  public primaryCategory: string;

  @Column({ type: 'varchar', name: 'title', comment: '发布时间时间戳' })
  public title: string;

  @Column({ type: 'varchar', name: 'content', comment: '内容' })
  public content: string;

  @Column({ type: 'varchar', name: 'detail_content', comment: '详细内容' })
  public detailContent: string;

  @Column({ type: 'varchar', name: 'tags', comment: '标签' })
  public tags: string;

  @Column({ type: 'varchar', name: 'push_flag', comment: '推送' })
  public pushFlag: string;

  @Column({ type: 'varchar', name: 'sounds', comment: '音频' })
  public sounds: string;
}
