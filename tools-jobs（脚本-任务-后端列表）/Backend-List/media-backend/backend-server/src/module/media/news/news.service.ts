import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ResultData } from 'src/common/utils/result';
import { ExportTable } from 'src/common/utils/export';
import { HashNewsEntity } from './entities/news.entity';
import { Response } from 'express';
import { CreatePostDto, UpdatePostDto, ListPostDto } from './dto/index';

@Injectable()
export class NewsService {
  constructor(
    @InjectRepository(HashNewsEntity)
    private readonly newsEntityRep: Repository<HashNewsEntity>,
  ) {}
  async create(createPostDto: CreatePostDto) {
    await this.newsEntityRep.save(createPostDto);
    return ResultData.ok();
  }

  async findAll(query: ListPostDto) {
    const entity = this.newsEntityRep
      .createQueryBuilder('entity')
      .select(['entity.uniqueCode', 'entity.publishTime', 'entity.primaryCategory', 'entity.title', 'entity.detailContent', 'entity.tags', 'entity.pushFlag', 'entity.createTime', 'entity.sounds']);
    entity.where('entity.delFlag = :delFlag', { delFlag: '0' });

    if (query.keyword) {
      entity.andWhere('entity.detailContent LIKE :keyword', { keyword: `%${query.keyword}%` });
    }

    if (query.uniqueCode) {
      entity.andWhere('entity.uniqueCode = :uniqueCode', { uniqueCode: query.uniqueCode });
    }

    if (query.primaryCategory) {
      entity.andWhere('entity.primaryCategory = :primaryCategory', { primaryCategory: query.primaryCategory });
    }

    if (query.pushFlag) {
      entity.andWhere('entity.pushFlag = :pushFlag', { pushFlag: query.pushFlag });
    }

    entity.orderBy('entity.publishTime', 'DESC');

    if (query.pageSize && query.pageNum) {
      entity.skip(query.pageSize * (query.pageNum - 1)).take(query.pageSize);
    }

    const [list, total] = await entity.getManyAndCount();

    return ResultData.ok({
      list,
      total,
    });
  }

  async findOne(uniqueCode: string) {
    const res = await this.newsEntityRep.findOne({
      select: ['uniqueCode', 'publishTime', 'primaryCategory', 'title', 'detailContent', 'tags', 'pushFlag', 'createTime', 'sounds'],
      where: {
        uniqueCode: uniqueCode,
      },
    });
    return ResultData.ok(res);
  }

  async findCategoryCount() {
    const res = await this.newsEntityRep
      .createQueryBuilder('news')
      .select('news.primaryCategory', 'category')
      .addSelect('COUNT(*)', 'num')
      .groupBy('news.primaryCategory')
      .orderBy('num', 'DESC')
      .getRawMany();
    return ResultData.ok(res);
  }

  async update(updatePostDto: UpdatePostDto) {
    const res = await this.newsEntityRep.update({ uniqueCode: updatePostDto.postId }, updatePostDto);
    return ResultData.ok(res);
  }

  async remove(postIds: string[]) {
    const data = await this.newsEntityRep.update(
      { uniqueCode: In(postIds) },
      {
        delFlag: '1',
      },
    );
    return ResultData.ok(data);
  }

  /**
   * 导出岗位管理数据为xlsx文件
   * @param res
   */
  async export(res: Response, body: ListPostDto) {
    delete body.pageNum;
    delete body.pageSize;
    const list = await this.findAll(body);
    const options = {
      sheetName: '岗位数据',
      data: list.data.list,
      header: [
        { title: '岗位序号', dataIndex: 'postId' },
        { title: '岗位编码', dataIndex: 'postCode' },
        { title: '岗位名称', dataIndex: 'postName' },
        { title: '岗位排序', dataIndex: 'postSort' },
        { title: '状态', dataIndex: 'status' },
      ],
    };
    ExportTable(options, res);
  }
}
