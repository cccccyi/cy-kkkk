import { Controller, Get, Post, Body, Put, Param, Query, Res, Delete, Request, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiConsumes, ApiQuery, ApiBearerAuth, ApiExcludeEndpoint } from '@nestjs/swagger';
import { UserService } from './user.service';
import { Response } from 'express';
import { RequirePermission } from 'src/common/decorators/require-premission.decorator';
import { RequireRole } from 'src/common/decorators/require-role.decorator';
import { CreateUserDto, UpdateUserDto, ListUserDto, ChangeStatusDto, ResetPwdDto, UpdateProfileDto, UpdatePwdDto } from './dto/index';
import { FileInterceptor } from '@nestjs/platform-express';
import { ResultData } from 'src/common/utils/result';
import { GetNowDate } from 'src/common/utils/index';

@ApiTags('钱包用户管理')
@ApiBearerAuth()
@Controller('system/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiExcludeEndpoint()
  @ApiOperation({
    summary: '个人中心-用户信息',
  })
  @RequirePermission('system:user:query')
  @Get('/profile')
  profile(@Request() req) {
    const user = req.user.user;
    return this.userService.profile(user);
  }
}
