import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { ResultData } from '@app/common/utils/result';
import { WaterRevenueUserEntity } from '@app/common/entities/water-basic/water-revenue-user.entity';

@Injectable()
export class RevenueUserService {
  constructor(
    @InjectRepository(WaterRevenueUserEntity)
    private readonly rep: Repository<WaterRevenueUserEntity>,
  ) {}

  async findList(query: any) {
    const { pageNum = 1, pageSize = 10, userNo, userName, phone, status, cardCategory, userCategory } = query;
    const where: any = { delFlag: '0' };
    
    if (userNo) where.userNo = Like(`%${userNo}%`);
    if (userName) where.userName = Like(`%${userName}%`);
    if (phone) where.phone = Like(`%${phone}%`);
    if (status) where.status = status;
    if (cardCategory) where.cardCategory = cardCategory;
    if (userCategory) where.userCategory = userCategory;

    const [list, total] = await this.rep.findAndCount({
      where,
      order: { createTime: 'DESC' },
      skip: (pageNum - 1) * pageSize,
      take: pageSize,
    });
    return ResultData.ok({ list, total });
  }

  async findOne(id: string) {
    const data = await this.rep.findOne({ where: { id, delFlag: '0' } });
    return ResultData.ok(data);
  }

  async create(data: any, user: any) {
    const exists = await this.rep.findOne({ where: { userNo: data.userNo, delFlag: '0' } });
    if (exists) return ResultData.fail(500, `用户编号 ${data.userNo} 已存在`);
    
    data.createBy = user.userName;
    await this.rep.save(data);
    return ResultData.ok();
  }

  async update(data: any, user: any) {
    data.updateBy = user.userName;
    await this.rep.update(data.id, data);
    return ResultData.ok();
  }

  async remove(ids: string[]) {
    await this.rep.update(ids, { delFlag: '2' });
    return ResultData.ok();
  }

  async importBatch(dataList: any[], user: any) {
    const validData = dataList.filter(item => !!item.userNo && !!item.userName);
    if (!validData || validData.length === 0) return ResultData.ok();

    const insertData = validData.map((item) => ({
      ...item,
      createBy: user.userName,
    }));

    const batchSize = 500;
    for (let i = 0; i < insertData.length; i += batchSize) {
      const chunk = insertData.slice(i, i + batchSize);
      await this.rep.save(chunk);
    }

    return ResultData.ok({ msg: `成功导入 ${insertData.length} 条记录` });
  }
}