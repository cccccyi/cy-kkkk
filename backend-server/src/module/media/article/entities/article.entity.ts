import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base';

@Entity('dt_hash_article_list', {
  comment: 'HashNews 文章',
})
export class HashArticleEntity extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id', comment: 'ID' })
  public id: number;

  @Column({ type: 'varchar', name: 'unique_code', length: 64, comment: '编码' })
  public uniqueCode: string;

  @Column({ type: 'varchar', name: 'title', comment: '新闻标题' })
  public title: string;

  @Column({ type: 'varchar', name: 'description', comment: '描述信息' })
  public description: string;

  @Column({ type: 'int', name: 'publish_time', default: 0, comment: '发布时间时间戳' })
  public publishTime: number;

  @Column({ type: 'varchar', name: 'primary_category', length: 50, comment: '主分类' })
  public primaryCategory: string;

  @Column({ type: 'varchar', name: 'categories', length: 50, comment: '分类' })
  public categories: string;

  @Column({ type: 'varchar', name: 'tags', comment: '标签' })
  public tags: string;

  @Column({ type: 'varchar', name: 'content', comment: '内容' })
  public content: string;

  @Column({ type: 'varchar', name: 'img', comment: '新闻相关图片/单张/列表配图' })
  public img: string;

  @Column({ type: 'int', name: 'source_id', comment: '来源数据id，关联表dt_news_list' })
  public source_id: number;
}
