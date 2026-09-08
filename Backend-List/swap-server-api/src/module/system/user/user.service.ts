import { Repository, In, Not } from 'typeorm';
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { CacheService } from 'src/module/cache/cache.service';
import * as bcrypt from 'bcrypt';
import { Response } from 'express';
import { GetNowDate, GenerateUUID, Uniq } from 'src/common/utils/index';
import { ExportTable } from 'src/common/utils/export';

import { CacheEnum, DelFlagEnum, StatusEnum, DataScopeEnum } from 'src/common/enum/index';
import { WALLET_TOKEN_EXPIRESIN, SYS_USER_TYPE } from 'src/common/constant/index';
import { ResultData } from 'src/common/utils/result';
import { CreateUserDto, UpdateUserDto, ListUserDto, ChangeStatusDto, ResetPwdDto, AllocatedListDto, UpdateProfileDto, UpdatePwdDto } from './dto/index';
import { RegisterDto, LoginDto, ClientInfoDto } from '../../main/dto/index';

import { UserEntity } from './entities/sys-user.entity';
import { SysUserWithPostEntity } from './entities/user-width-post.entity';
import { SysUserWithRoleEntity } from './entities/user-width-role.entity';

import { SwapWalletEntity } from './entities/wallet-user.entity';
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(SysUserWithPostEntity)
    private readonly sysUserWithPostEntityRep: Repository<SysUserWithPostEntity>,
    @InjectRepository(SysUserWithRoleEntity)
    private readonly sysUserWithRoleEntityRep: Repository<SysUserWithRoleEntity>,
    @InjectRepository(SwapWalletEntity)
    private readonly walletEntityRep: Repository<SwapWalletEntity>,
    private readonly jwtService: JwtService,
    private readonly redisService: CacheService,
  ) {}
  /**
   * 后台创建用户
   * @param createUserDto
   * @returns
   */
  async create(createUserDto: CreateUserDto) {
    const salt = bcrypt.genSaltSync(10);
    if (createUserDto.password) {
      createUserDto.password = await bcrypt.hashSync(createUserDto.password, salt);
    }

    const res = await this.userRepo.save({ ...createUserDto, userType: SYS_USER_TYPE.CUSTOM });
    const postEntity = this.sysUserWithPostEntityRep.createQueryBuilder('postEntity');
    const postValues = createUserDto.postIds.map((id) => {
      return {
        userId: res.userId,
        postId: id,
      };
    });
    postEntity.insert().values(postValues).execute();

    const roleEntity = this.sysUserWithRoleEntityRep.createQueryBuilder('roleEntity');
    const roleValues = createUserDto.roleIds.map((id) => {
      return {
        userId: res.userId,
        roleId: id,
      };
    });
    roleEntity.insert().values(roleValues).execute();

    return ResultData.ok();
  }

  /**
   * 钱包登录
   */
  async loginWallet(address: string, clientInfo: ClientInfoDto) {
    const loginDate = new Date();
    const data = await this.walletEntityRep.findOne({
      where: {
        walletAddr: address,
      },
      select: ['id'],
    });

    if (!data) {
      await this.walletEntityRep.save({ walletAddr: address, loginDate, loginIp: clientInfo.ipaddr });
    } else {
      await this.walletEntityRep.update(
        {
          walletAddr: address,
        },
        {
          loginDate: loginDate,
          loginIp: clientInfo.ipaddr,
        },
      );
    }

    const uuid = GenerateUUID();
    const token = this.createToken({ uuid, userId: address });

    const metaData = {
      wallet: address,
      browser: clientInfo.browser,
      ipaddr: clientInfo.ipaddr,
      loginLocation: clientInfo.loginLocation,
      loginTime: loginDate,
      os: clientInfo.os,
      token: uuid,
    };
    await this.redisService.set(`${CacheEnum.WALLET_TOKEN_KEY}${uuid}`, metaData, WALLET_TOKEN_EXPIRESIN);
    return ResultData.ok(
      {
        token,
      },
      'Signature verification successful',
    );
  }

  /**
   * 从数据声明生成令牌
   *
   * @param payload 数据声明
   * @return 令牌
   */
  createToken(payload: any): string {
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: WALLET_TOKEN_EXPIRESIN,
    });
    return accessToken;
  }

  /**
   * 从令牌中获取数据声明
   *
   * @param token 令牌
   * @return 数据声明
   */
  parseToken(token: string) {
    try {
      if (!token) return null;
      const payload = this.jwtService.verify(token.replace('Bearer ', ''));
      //console.log('payload:', payload);
      return payload;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  /**
   * 个人中心-用户信息
   * @param user
   * @returns
   */
  async profile(user) {
    return ResultData.ok(user);
  }
}
