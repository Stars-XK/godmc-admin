import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResultData } from '@app/common/utils/result';
import { WaterPointEntity, Paginate } from '@app/common';
import { Response } from 'express';
import { ExportTable } from '@app/common/utils/export';
import * as exceljs from 'exceljs';

@Injectable()
export class PointService {
  constructor(
    @InjectRepository(WaterPointEntity)
    private readonly rep: Repository<WaterPointEntity>,
  ) {}

  async create(createDto: any, user: any) {
    createDto.createBy = user.userName;
    createDto.deptId = user.deptId;
    await this.rep.save(createDto);
    return ResultData.ok();
  }

  async findList(query: any, user: any) {
    const entity = this.rep.createQueryBuilder('point');
    entity.where('point.delFlag = :delFlag', { delFlag: '0' });

    if (query.name) entity.andWhere(`point.name LIKE "%${query.name}%"`);
    if (query.code) entity.andWhere(`point.code LIKE "%${query.code}%"`);
    if (query.type) entity.andWhere('point.type = :type', { type: query.type });
    if (query.status) entity.andWhere('point.status = :status', { status: query.status });
    if (query.deviceCode) entity.andWhere('point.deviceCode = :deviceCode', { deviceCode: query.deviceCode });

    const isAdmin = user.roles?.includes('admin') || user.user?.roles?.some((r) => r.roleKey === 'admin' || r.roleId === 1);
    if (!isAdmin && user.deptId) {
      entity.andWhere('point.deptId = :deptId', { deptId: user.deptId });
    }

    entity.orderBy('point.sort', 'ASC').addOrderBy('point.createTime', 'DESC');
    
    const [list, total] = await entity.skip((query.pageNum - 1) * query.pageSize).take(query.pageSize).getManyAndCount();
    return ResultData.ok({ list, total });
  }

  async findOne(id: number) {
    const data = await this.rep.findOne({ where: { id: id, delFlag: '0' } });
    return ResultData.ok(data);
  }

  async update(updateDto: any, user: any) {
    updateDto.updateBy = user.userName;
    await this.rep.update({ id: updateDto.id }, updateDto);
    return ResultData.ok();
  }

  async remove(id: number) {
    const data = await this.rep.update({ id: id }, { delFlag: '1' });
    return ResultData.ok(data);
  }

  async export(res: Response, query: any, user: any) {
    query.pageNum = 1;
    query.pageSize = 100000;
    const listRes: any = await this.findList(query, user);
    const list = listRes?.data?.list || [];
    
    const options = {
      sheetName: '测点数据',
      data: list,
      header: [
        { title: '测点名称', dataIndex: 'name' },
        { title: '测点编码', dataIndex: 'code' },
        { title: '测点类型', dataIndex: 'type' },
        { title: '量程上限', dataIndex: 'rangeMax' }, { title: '量程下限', dataIndex: 'rangeMin' }, { title: '单位', dataIndex: 'unit' },
      ],
    };
    ExportTable(options, res);
  }

  async importTemplate(res: Response) {
    const workbook = new exceljs.Workbook();
    const worksheet = workbook.addWorksheet('测点导入模板');
    worksheet.columns = [
      { header: '测点名称(必填)', key: 'name', width: 20 },
      { header: '测点编码(必填)', key: 'code', width: 20 },
      { header: '测点类型(1/2/3/4/5)', key: 'type', width: 15 },
      { header: '负责人', key: 'managerName', width: 15 },
      { header: '电话', key: 'managerPhone', width: 15 },
      { header: '地址', key: 'address', width: 30 },
    ];
    worksheet.addRow({
      name: '示例测点', code: 'ST-001', type: '1', managerName: '李四', managerPhone: '13812345678', address: '某某路100号'
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=PointImportTemplate.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  }

  async importData(file: Express.Multer.File, user: any) {
    if (!file) return { code: 500, msg: '未上传文件' };
    const workbook = new exceljs.Workbook();
    await workbook.xlsx.load(file.buffer as any);
    const worksheet = workbook.getWorksheet(1);
    
    const dataList = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        dataList.push({
          name: row.getCell(1).value?.toString() || '',
          code: row.getCell(2).value?.toString() || '',
          type: row.getCell(3).value?.toString() || '1',
          rangeMax: parseFloat(row.getCell(4).value?.toString() || '0'), rangeMin: parseFloat(row.getCell(5).value?.toString() || '0'), unit: row.getCell(6).value?.toString() || '',
        });
      }
    });
    
    const validData = dataList.filter(item => !!item.name && !!item.code);
    if (!validData || validData.length === 0) return ResultData.ok();

    const insertData = validData.map((item, index) => ({
      ...item,
      createBy: user.userName,
      deptId: user.deptId,
      sort: index,
    }));

    await this.rep.save(insertData);
    return ResultData.ok();
  }
}
