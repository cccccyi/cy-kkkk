import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from 'src/common/entities/base';

@Entity('tb_app_device_list', {
  comment: 'APP安装的设备列表',
})
export class DeviceEntity extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id', comment: 'ID' })
  public id: number;

  @Column({ type: 'varchar', name: 'registration_id', length: 64, comment: '推送ID' })
  public registrationId: string;
}
