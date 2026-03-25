import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base';

@Entity('dt_crawl_data', {
  comment: '采集数据',
})
export class CrawlDataEntity extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id', comment: 'ID' })
  public id: number;

  @Column({ type: 'varchar', name: 'name', length: 64, comment: '键值' })
  public name: string;

  @Column({ type: 'varchar', name: 'data', comment: '数据' })
  public data: string;
}
