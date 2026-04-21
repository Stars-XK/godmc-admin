import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WaterRevenueUserEntity } from '@app/common/entities/water-basic/water-revenue-user.entity';
import { RevenueUserController } from './revenue-user.controller';
import { RevenueUserService } from './revenue-user.service';

@Module({
  imports: [TypeOrmModule.forFeature([WaterRevenueUserEntity])],
  controllers: [RevenueUserController],
  providers: [RevenueUserService],
})
export class RevenueUserModule {}