import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppService } from './app.service';
import { AppController } from './app.controller';
import { DeviceEntity } from './entities/device.entity';
@Module({
  imports: [TypeOrmModule.forFeature([DeviceEntity])],
  controllers: [AppController],
  providers: [AppService],
  exports: [AppService],
})
export class AppModule {}
