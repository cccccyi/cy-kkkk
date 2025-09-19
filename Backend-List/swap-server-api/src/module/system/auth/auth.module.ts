import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthStrategy } from './auth.strategy';
import { CacheModule } from '@nestjs/cache-manager';
import { CacheService } from 'src/module/cache/cache.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }), 
    CacheModule.register(),
  ],
  providers: [AuthStrategy, CacheService],
  exports: [PassportModule],
})
export class AuthModule {}
