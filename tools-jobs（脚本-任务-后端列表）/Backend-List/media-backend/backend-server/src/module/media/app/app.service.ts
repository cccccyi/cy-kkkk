import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ResultData } from 'src/common/utils/result';
import { ExportTable } from 'src/common/utils/export';
import { DeviceEntity } from './entities/device.entity';
import { DataSource } from 'typeorm';
import { Response } from 'express';
import { CreateDeviceInfoDto } from './dto/index';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(DeviceEntity)
    private readonly deviceEntityRep: Repository<DeviceEntity>,
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  async getVersion() {
    const result = await this.dataSource.query(`SELECT value FROM dt_basic_config WHERE name = 'media_app_version'`);
    return result.length > 0 ? result[0].value : null;
  }

  async create(createDto: CreateDeviceInfoDto) {
    const { oldId, newId } = createDto;

    try {
      if (!oldId && newId) {
        // 场景 1: 只有 newId，没有 oldId
        // 检查 newId 是否存在
        const exists = await this.dataSource.query(`SELECT id FROM tb_app_device_list WHERE registration_id = ?`, [newId]);

        if (exists.length > 0) {
          // 如果 newId 存在，更新
          await this.dataSource.query(`UPDATE tb_app_device_list SET registration_id = ?, update_time = NOW() WHERE registration_id = ?`, [newId, newId]);
          return ResultData.ok({ message: 'Updated successfully' });
        } else {
          // 如果 newId 不存在，插入
          await this.dataSource.query(`INSERT INTO tb_app_device_list (registration_id, create_time, update_time) VALUES (?, NOW(), NOW())`, [newId]);
          return ResultData.ok({ message: 'Inserted successfully' });
        }
      } else if (oldId && newId) {
        // 场景 2: 有 oldId 和 newId
        // 检查 oldId 是否存在
        const exists = await this.dataSource.query(`SELECT id FROM tb_app_device_list WHERE registration_id = ?`, [oldId]);

        if (exists.length > 0) {
          // 如果 oldId 存在，更新为 newId
          await this.dataSource.query(`UPDATE tb_app_device_list SET registration_id = ?, update_time = NOW() WHERE registration_id = ?`, [newId, oldId]);
          return ResultData.ok({ message: 'Updated successfully' });
        } else {
          // 如果 oldId 不存在，插入 newId
          await this.dataSource.query(`INSERT INTO tb_app_device_list (registration_id, create_time, update_time) VALUES (?, NOW(), NOW())`, [newId]);
          return ResultData.ok({ message: 'Inserted successfully' });
        }
      } else {
        // 参数不合法
        return ResultData.fail(500);
      }
    } catch (error) {
      return ResultData.fail(500);
    }
  }
}
