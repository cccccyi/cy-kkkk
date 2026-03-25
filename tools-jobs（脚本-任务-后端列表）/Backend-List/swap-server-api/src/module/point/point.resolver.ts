import { Resolver, Query, Args } from '@nestjs/graphql';
import { PointService } from './point.service';
import { Point } from './entities/point.entity';

@Resolver(() => Point)
export class PointResolver {
  constructor(private readonly pointService: PointService) {}

  /**
   * 查询指定地址的当前积分记录
   * @param userAddress 用户钱包地址
   * @returns Point 积分记录对象，如果不存在则返回null
   */
  @Query(() => Point, { name: 'point', nullable: true })
  async getUserPoint(
    @Args('userAddress') userAddress: string
  ): Promise<Point | null> {
    return this.pointService.getUserCurrentPoint(userAddress);
  }
}