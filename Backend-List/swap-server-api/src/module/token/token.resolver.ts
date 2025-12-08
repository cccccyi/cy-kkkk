import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { TokenService } from './token.service';
import { Token } from './entities/token.entity';
import { TimeRange } from './token.service';

@Resolver(() => Token)
export class TokenResolver {
  constructor(private readonly tokenService: TokenService) {}

  /**
   * 通过地址查询代币信息
   */
  @Query(() => Token, { name: 'token', nullable: true })
  async getToken(
    @Args('id') address: string,
    @Args('timeRange', { type: () => String, defaultValue: '1D' }) timeRange: TimeRange // 添加时间范围参数
  ): Promise<Token | null> {
    return this.tokenService.getTokenByAddress(address, timeRange);
  }

  /**
   * 查询代币列表
   */
  @Query(() => [Token], { name: 'tokens' })
  async getTokens(
    @Args('first', { type: () => Int, defaultValue: 100 }) first: number,
    @Args('skip', { type: () => Int, defaultValue: 0 }) skip: number,
  ): Promise<Token[]> {
    return this.tokenService.getTokens(first, skip);
  }

}