import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { ResultData } from '@app/common/utils/result';
import { ExportTable } from '@app/common/utils/export';
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

  async export(res: any, query: any) {
    const { userNo, userName, phone, status, cardCategory, userCategory } = query;
    const where: any = { delFlag: '0' };
    
    if (userNo) where.userNo = Like(`%${userNo}%`);
    if (userName) where.userName = Like(`%${userName}%`);
    if (phone) where.phone = Like(`%${phone}%`);
    if (status) where.status = status;
    if (cardCategory) where.cardCategory = cardCategory;
    if (userCategory) where.userCategory = userCategory;

    // 查出符合条件的全部数据（无分页）
    const data = await this.rep.find({
      where,
      order: { createTime: 'DESC' },
    });

    const header = [
      { title: '用户编号', dataIndex: 'userNo', width: 20 },
      { title: '用户名称', dataIndex: 'userName', width: 20 },
      { title: '证件号码', dataIndex: 'idCard', width: 25 },
      { title: '合同编号', dataIndex: 'contractNo', width: 20 },
      { title: '水表编号', dataIndex: 'meterNo', width: 20 },
      { title: '表册编号', dataIndex: 'bookNo', width: 20 },
      { title: '手机号', dataIndex: 'phone', width: 15 },
      { title: '地址', dataIndex: 'address', width: 30 },
      { title: '收费类型', dataIndex: 'chargeType', width: 15 },
      { title: '口径', dataIndex: 'caliber', width: 10 },
      { title: '水卡分类', dataIndex: 'cardCategory', width: 15 },
      { title: '用户分类', dataIndex: 'userCategory', width: 25 },
      { title: '立户日期', dataIndex: 'installDate', width: 20 },
      { title: '账户余额', dataIndex: 'balance', width: 15 },
      { title: '欠费金额', dataIndex: 'arrearsAmount', width: 15 },
      { title: '状态', dataIndex: 'status', width: 10 },
    ];

    return ExportTable({
      data,
      header,
      sheetName: '营收基础用户信息',
      dictMap: {
        status: 'sys_normal_disable',
        cardCategory: 'water_card_category',
        userCategory: 'water_user_category'
      }
    }, res);
  }
}