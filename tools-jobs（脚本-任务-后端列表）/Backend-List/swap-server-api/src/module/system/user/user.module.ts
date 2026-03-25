import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UserEntity } from './entities/sys-user.entity';
import { SysUserWithPostEntity } from './entities/user-width-post.entity';
import { SysUserWithRoleEntity } from './entities/user-width-role.entity';
import { SwapWalletEntity } from './entities/wallet-user.entity';
import { CacheModule } from '@nestjs/cache-manager';
import { CacheService } from 'src/module/cache/cache.service';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, SysUserWithPostEntity, SysUserWithRoleEntity, SwapWalletEntity]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        secret: config.get('jwt.secretkey'),
      }),
      inject: [ConfigService],
    }),
    CacheModule.register(),
  ],
  controllers: [UserController],
  providers: [UserService, CacheService],
  exports: [UserService],
})
export class UserModule {}
