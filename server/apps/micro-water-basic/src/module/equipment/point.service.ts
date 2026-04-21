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
        { title: '所属设备编码', dataIndex: 'deviceCode' },
        { title: '测点名称', dataIndex: 'name' },
        { title: '测点编码', dataIndex: 'code' },
        { title: '测点类型', dataIndex: 'type' },
        { title: '量程上限', dataIndex: 'rangeMax' },
        { title: '量程下限', dataIndex: 'rangeMin' },
        { title: '报警上限', dataIndex: 'alarmMax' },
        { title: '报警下限', dataIndex: 'alarmMin' },
        { title: '单位', dataIndex: 'unit' },
        { title: '数据类型', dataIndex: 'dataType' },
        { title: '读写属性', dataIndex: 'rwAttr' },
      ],
    };
    ExportTable(options, res);
  }

  async importTemplate(res: Response) {
    const workbook = new exceljs.Workbook();
    const worksheet = workbook.addWorksheet('测点导入模板');
    worksheet.columns = [
      { header: '所属设备编码(必填)', key: 'deviceCode', width: 20 },
      { header: '测点名称(必填)', key: 'name', width: 20 },
      { header: '测点编码(必填)', key: 'code', width: 20 },
      { header: '测点类型(1/2/3/4/5)', key: 'type', width: 15 },
      { header: '量程上限', key: 'rangeMax', width: 15 },
      { header: '量程下限', key: 'rangeMin', width: 15 },
      { header: '报警上限', key: 'alarmMax', width: 15 },
      { header: '报警下限', key: 'alarmMin', width: 15 },
      { header: '单位(m³/h,MPa等)', key: 'unit', width: 15 },
      { header: '数据类型(float/int/bool)', key: 'dataType', width: 25 },
      { header: '读写属性(R/W)', key: 'rwAttr', width: 15 },
    ];
    worksheet.addRow({
      deviceCode: 'DEV-001', name: '出水压力', code: 'PT-001', type: '2', rangeMax: 1.0, rangeMin: 0, alarmMax: 0.8, alarmMin: 0.2, unit: 'MPa', dataType: 'float', rwAttr: 'R'
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
          deviceCode: row.getCell(1).value?.toString() || '',
          name: row.getCell(2).value?.toString() || '',
          code: row.getCell(3).value?.toString() || '',
          type: row.getCell(4).value?.toString() || '1',
          rangeMax: parseFloat(row.getCell(5).value?.toString()) || null,
          rangeMin: parseFloat(row.getCell(6).value?.toString()) || null,
          alarmMax: parseFloat(row.getCell(7).value?.toString()) || null,
          alarmMin: parseFloat(row.getCell(8).value?.toString()) || null,
          unit: row.getCell(9).value?.toString() || '',
          dataType: row.getCell(10).value?.toString() || 'float',
          rwAttr: row.getCell(11).value?.toString() || 'R',
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
