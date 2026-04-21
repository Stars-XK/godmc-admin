import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResultData } from '@app/common/utils/result';
import { WaterDeviceEntity, Paginate } from '@app/common';
import { Response } from 'express';
import { ExportTable } from '@app/common/utils/export';
import * as exceljs from 'exceljs';

@Injectable()
export class DeviceService {
  constructor(
    @InjectRepository(WaterDeviceEntity)
    private readonly rep: Repository<WaterDeviceEntity>,
  ) {}

  async create(createDto: any, user: any) {
    createDto.createBy = user.userName;
    createDto.deptId = user.deptId;
    await this.rep.save(createDto);
    return ResultData.ok();
  }

  async findList(query: any, user: any) {
    const entity = this.rep.createQueryBuilder('device');
    entity.where('device.delFlag = :delFlag', { delFlag: '0' });

    if (query.name) entity.andWhere(`device.name LIKE "%${query.name}%"`);
    if (query.code) entity.andWhere(`device.code LIKE "%${query.code}%"`);
    if (query.type) entity.andWhere('device.type = :type', { type: query.type });
    if (query.status) entity.andWhere('device.status = :status', { status: query.status });
    if (query.stationCode) entity.andWhere('device.stationCode = :stationCode', { stationCode: query.stationCode });

    const isAdmin = user.roles?.includes('admin') || user.user?.roles?.some((r) => r.roleKey === 'admin' || r.roleId === 1);
    if (!isAdmin && user.deptId) {
      entity.andWhere('device.deptId = :deptId', { deptId: user.deptId });
    }

    entity.orderBy('device.sort', 'ASC').addOrderBy('device.createTime', 'DESC');
    
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
      sheetName: '设备数据',
      data: list,
      header: [
        { title: '设备名称', dataIndex: 'name' },
        { title: '设备编码', dataIndex: 'code' },
        { title: '设备类型', dataIndex: 'type' },
        { title: '负责人', dataIndex: 'managerName' },
        { title: '电话', dataIndex: 'managerPhone' },
        { title: '型号', dataIndex: 'model' }, { title: '厂家', dataIndex: 'manufacturer' },
      ],
    };
    ExportTable(options, res);
  }

  async importTemplate(res: Response) {
    const workbook = new exceljs.Workbook();
    const worksheet = workbook.addWorksheet('设备导入模板');
    worksheet.columns = [
      { header: '设备名称(必填)', key: 'name', width: 20 },
      { header: '设备编码(必填)', key: 'code', width: 20 },
      { header: '设备类型(1/2/3/4/5)', key: 'type', width: 15 },
      { header: '负责人', key: 'managerName', width: 15 },
      { header: '电话', key: 'managerPhone', width: 15 },
      { header: '地址', key: 'address', width: 30 },
    ];
    worksheet.addRow({
      name: '示例设备', code: 'ST-001', type: '1', managerName: '李四', managerPhone: '13812345678', address: '某某路100号'
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=DeviceImportTemplate.xlsx');
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
          managerName: row.getCell(4).value?.toString() || '',
          managerPhone: row.getCell(5).value?.toString() || '',
          model: row.getCell(6).value?.toString() || '', manufacturer: row.getCell(7).value?.toString() || '',
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
