import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisClientOptions } from '@songkeys/nestjs-redis';
import { ScheduleModule } from '@nestjs/schedule';
import configuration from './config/index';
// import { mysqlOrmConfig } from './config/db.mysql.config';
import { pgOrmConfig } from './config/db.pg.config';

import { HttpModule } from '@nestjs/axios';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from 'src/common/guards/auth.guard';
import { PermissionGuard } from 'src/common/guards/permission.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';

import { AuthModule } from './module/system/auth/auth.module';
import { UserModule } from './module/system/user/user.module';
import { MainModule } from './module/main/main.module';
import { AxiosModule } from './module/axios/axios.module';
import { CacheModule } from './module/cache/cache.module';
import { TokenModule } from './module/token/token.module';
import { PoolModule } from './module/pool/pool.module';
import { SubgraphModule } from './module/subgraph/subgraph.module';
import { SwapModule } from './module/swap/swap.module';
import { PositionModule } from './module/position/position.module';
import { PointModule } from './module/point/point.module';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      load: [configuration],
      isGlobal: true,
    }),
    CacheModule,
    TypeOrmModule.forRoot({
      name: 'default',
      ...pgOrmConfig,
      entities: [`${__dirname}/**/*.entity{.ts,.js}`],
      synchronize: true,
    }),

    // GraphQL模块
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      playground: process.env.NODE_ENV !== 'production',
      introspection: process.env.NODE_ENV !== 'production',
      autoSchemaFile: 'schema.gql', // 自动生成 Schema 文件
      sortSchema: true, // 可选：按字母顺序排序 Schema
    }),

    ScheduleModule.forRoot(), // 初始化 Schedule 模块
    HttpModule,
    AuthModule,
    MainModule,
    UserModule,
    AxiosModule,
    CacheModule,
    TokenModule,
    PoolModule,
    PositionModule,
    PointModule,
    SubgraphModule,
    SwapModule,
  ],
  providers: [
    // {
    //   provide: APP_GUARD,
    //   useClass: JwtAuthGuard,
    // },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionGuard,
    },
  ],
})
export class AppModule {}
