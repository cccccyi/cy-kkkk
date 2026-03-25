import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ResultData } from 'src/common/utils/result';
import { HashArticleEntity } from './entities/article.entity';
import { CreatePostDto, UpdatePostDto, ListArticleDto } from './dto/index';

@Injectable()
export class ArticleService {
  constructor(
    @InjectRepository(HashArticleEntity)
    private readonly articleEntityRep: Repository<HashArticleEntity>,
  ) {}
  async create(createPostDto: CreatePostDto) {
    await this.articleEntityRep.save(createPostDto);
    return ResultData.ok();
  }

  async findAll(query: ListArticleDto) {
    const entity = this.articleEntityRep
      .createQueryBuilder('a')
      .select(['a.uniqueCode', 'a.publishTime', 'a.primaryCategory', 'a.title', 'a.description', 'a.content', 'a.img', 'a.tags', 'a.createTime']);
    entity.where('a.delFlag = :delFlag', { delFlag: '0' });

    if (query.keyword) {
      entity.andWhere('a.content LIKE :keyword', { keyword: `%${query.keyword}%` });
    }

    if (query.uniqueCode) {
      entity.andWhere('a.uniqueCode = :uniqueCode', { uniqueCode: query.uniqueCode });
    }

    if (query.primaryCategory) {
      entity.andWhere('a.primaryCategory = :primaryCategory', { primaryCategory: query.primaryCategory });
    }

    entity.orderBy('a.publishTime', 'DESC');

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
    const res = await this.articleEntityRep.findOne({
      select: ['uniqueCode', 'publishTime', 'primaryCategory', 'title', 'description', 'content', 'img', 'tags', 'createTime'],
      where: {
        uniqueCode: uniqueCode,
      },
    });
    return ResultData.ok(res);
  }

  async findCategoryCount() {
    const res = await this.articleEntityRep
      .createQueryBuilder('a')
      .select('a.primaryCategory', 'category')
      .addSelect('COUNT(*)', 'num')
      .groupBy('a.primaryCategory')
      .orderBy('num', 'DESC')
      .getRawMany();
    return ResultData.ok(res);
  }

  async update(updatePostDto: UpdatePostDto) {
    const res = await this.articleEntityRep.update({ uniqueCode: updatePostDto.postId }, updatePostDto);
    return ResultData.ok(res);
  }

  async remove(postIds: string[]) {
    const data = await this.articleEntityRep.update(
      { uniqueCode: In(postIds) },
      {
        delFlag: '1',
      },
    );
    return ResultData.ok(data);
  }
}
