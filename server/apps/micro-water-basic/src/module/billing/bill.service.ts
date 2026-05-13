import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResultData } from '@app/common/utils/result';
import { SysDictDataEntity, WaterBillEntity } from '@app/common';
import { Response } from 'express';
import { ExportTable } from '@app/common/utils/export';

@Injectable()
export class BillService {
  constructor(
    @InjectRepository(WaterBillEntity)
    private readonly rep: Repository<WaterBillEntity>,
    @InjectRepository(SysDictDataEntity)
    private readonly dictRep: Repository<SysDictDataEntity>,
  ) {}

  async create(createDto: any, user: any) {
    createDto.createBy = user.userName;
    createDto.deptId = user.deptId;
    await this.rep.save(createDto);
    return ResultData.ok();
  }

  async findList(query: any, user: any) {
    const entity = this.rep.createQueryBuilder('bill');
    entity.where('bill.delFlag = :delFlag', { delFlag: '0' });

    if (query.userNo) entity.andWhere(`bill.userNo LIKE "%${query.userNo}%"`);
    if (query.billPeriod) entity.andWhere('bill.billPeriod = :billPeriod', { billPeriod: query.billPeriod });
    if (query.billStatus) entity.andWhere('bill.billStatus = :billStatus', { billStatus: query.billStatus });
    if (query.zoneCode) entity.andWhere('bill.zoneCode = :zoneCode', { zoneCode: query.zoneCode });

    const isAdmin = user.roles?.includes('admin') || user.user?.roles?.some((r: any) => r.roleKey === 'admin' || r.roleId === 1);
    if (!isAdmin && user.deptId) {
      entity.andWhere('bill.deptId = :deptId', { deptId: user.deptId });
    }

    entity.orderBy('bill.generateTime', 'DESC').addOrderBy('bill.billPeriod', 'DESC');

    const [list, total] = await entity.skip((query.pageNum - 1) * query.pageSize).take(query.pageSize).getManyAndCount();
    return ResultData.ok({ list, total });
  }

  async findOne(billId: number) {
    const data = await this.rep.findOne({ where: { billId, delFlag: '0' } });
    return ResultData.ok(data);
  }

  async update(updateDto: any, user: any) {
    updateDto.updateBy = user.userName;
    await this.rep.update({ billId: updateDto.billId }, updateDto);
    return ResultData.ok();
  }

  async remove(billId: number) {
    await this.rep.update({ billId }, { delFlag: '1' });
    return ResultData.ok();
  }

  async export(res: Response, query: any, user: any) {
    query.pageNum = 1;
    query.pageSize = 100000;
    const listRes: any = await this.findList(query, user);
    const list = listRes?.data?.list || [];

    const options = {
      sheetName: '水费账单数据',
      data: list,
      header: [
        { title: '用户编号', dataIndex: 'userNo' },
        { title: '账单周期', dataIndex: 'billPeriod' },
        { title: '用水量(m³)', dataIndex: 'waterUsage' },
        { title: '单价(元)', dataIndex: 'unitPrice' },
        { title: '总金额(元)', dataIndex: 'totalAmount' },
        { title: '已缴(元)', dataIndex: 'paidAmount' },
        { title: '未缴(元)', dataIndex: 'unpaidAmount' },
        { title: '账单状态', dataIndex: 'billStatus' },
        { title: '生成时间', dataIndex: 'generateTime' },
        { title: '缴费时间', dataIndex: 'payTime' },
      ],
    };
    ExportTable(options, res);
  }
}
