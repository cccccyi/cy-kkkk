import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, Request, Query, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiConsumes, ApiQuery, ApiBearerAuth, ApiExcludeController, ApiExcludeEndpoint, ApiParam } from '@nestjs/swagger';
import * as Useragent from 'useragent';
import { MainService } from './main.service';
import { RegisterDto, LoginDto } from './dto/index';
import { ResultData } from 'src/common/utils/result';
import { GenerateUUID } from 'src/common/utils/index';
import { CacheEnum } from 'src/common/enum/index';

@ApiTags('签名验证')
@Controller('/')
export class MainController {
  constructor(private readonly mainService: MainService) {}

  @ApiOperation({
    summary: '钱包签名 - 生成随机nonce',
  })
  @ApiParam({
    name: 'address',
    description: '钱包地址',
    type: String,
  })
  @Get('nonce/:address')
  async getNonce(@Param('address') address: string): Promise<{ nonce: string }> {
    const normalizedAddress = this.requireWalletAddress(address);
    return this.mainService.generateNonce(normalizedAddress);
  }

  @ApiOperation({
    summary: '验证签名获取授权token',
  })
  @ApiBody({
    description: '签名验证',
    schema: {
      type: 'object',
      properties: {
        address: { type: 'string', description: '钱包地址' },
        signature: { type: 'string', description: '签名数据' },
      },
      required: ['address', 'signature'],
    },
  })
  @Post('verify')
  async verifySignature(@Body() body: { address: string; signature: string }, @Request() req) {
    const { address, signature } = body;
    if (typeof signature !== 'string' || !signature.trim() || signature.length > 2048) {
      throw new BadRequestException('Address and signature are required');
    }
    const normalizedAddress = this.requireWalletAddress(address);
    const agent = Useragent.parse(req.headers['user-agent']);
    const os = agent.os.toJSON().family;
    const browser = agent.toAgent();
    const clientInfo = {
      userAgent: req.headers['user-agent'],
      ipaddr: req.ip,
      browser: browser,
      os: os,
      loginLocation: '',
    };
    return this.mainService.verifySignature(normalizedAddress, signature.trim(), clientInfo);
  }

  private requireWalletAddress(address: unknown): string {
    if (typeof address !== 'string') {
      throw new BadRequestException('A valid wallet address is required');
    }
    const normalizedAddress = address.trim();
    if (!/^[A-Za-z0-9]{14,90}$/.test(normalizedAddress)) {
      throw new BadRequestException('A valid wallet address is required');
    }
    return normalizedAddress;
  }
}
