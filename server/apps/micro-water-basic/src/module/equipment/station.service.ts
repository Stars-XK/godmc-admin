import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResultData } from '@app/common/utils/result';
import { WaterStationEntity, Paginate } from '@app/common';
import { Response } from 'express';
import { ExportTable } from '@app/common/utils/export';
import * as exceljs from 'exceljs';

@Injectable()
export class StationService {
  constructor(
    @InjectRepository(WaterStationEntity)
    private readonly rep: Repository<WaterStationEntity>,
  ) {}

  async create(createDto: any, user: any) {
    createDto.createBy = user.userName;
    createDto.deptId = user.deptId;
    await this.rep.save(createDto);
    return ResultData.ok();
  }

  async findList(query: any, user: any) {
    const entity = this.rep.createQueryBuilder('station');
    entity.where('station.delFlag = :delFlag', { delFlag: '0' });

    if (query.name) entity.andWhere(`station.name LIKE "%${query.name}%"`);
    if (query.code) entity.andWhere(`station.code LIKE "%${query.code}%"`);
    if (query.type) entity.andWhere('station.type = :type', { type: query.type });
    if (query.status) entity.andWhere('station.status = :status', { status: query.status });
    if (query.zoneCode) entity.andWhere('station.zoneCode = :zoneCode', { zoneCode: query.zoneCode });

    const isAdmin = user.roles?.includes('admin') || user.user?.roles?.some((r) => r.roleKey === 'admin' || r.roleId === 1);
    if (!isAdmin && user.deptId) {
      entity.andWhere('station.deptId = :deptId', { deptId: user.deptId });
    }

    entity.orderBy('station.sort', 'ASC').addOrderBy('station.createTime', 'DESC');
    
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
      sheetName: '站点数据',
      data: list,
      header: [
        { title: '所属分区编码', dataIndex: 'zoneCode' },
        { title: '站点名称', dataIndex: 'name' },
        { title: '站点编码', dataIndex: 'code' },
        { title: '站点类型(1/2/3/4/5)', dataIndex: 'type' },
        { title: '经度(X)', dataIndex: 'longitude' },
        { title: '纬度(Y)', dataIndex: 'latitude' },
        { title: '设计能力', dataIndex: 'designCapacity' },
        { title: '建设单位', dataIndex: 'constructionUnit' },
        { title: '投运日期', dataIndex: 'commissioningDate' },
        { title: '负责人', dataIndex: 'managerName' },
        { title: '联系电话', dataIndex: 'managerPhone' },
        { title: '详细地址', dataIndex: 'address' },
      ],
    };
    ExportTable(options, res);
  }

  async importTemplate(res: Response) {
    const workbook = new exceljs.Workbook();
    const worksheet = workbook.addWorksheet('站点导入模板');
    worksheet.columns = [
      { header: '所属分区编码', key: 'zoneCode', width: 15 },
      { header: '站点名称(必填)', key: 'name', width: 20 },
      { header: '站点编码(必填)', key: 'code', width: 20 },
      { header: '站点类型(1水厂/2泵站/3水库)', key: 'type', width: 25 },
      { header: '经度(X)', key: 'longitude', width: 15 },
      { header: '纬度(Y)', key: 'latitude', width: 15 },
      { header: '设计能力', key: 'designCapacity', width: 15 },
      { header: '建设单位', key: 'constructionUnit', width: 20 },
      { header: '投运日期(YYYY-MM-DD)', key: 'commissioningDate', width: 20 },
      { header: '负责人', key: 'managerName', width: 15 },
      { header: '联系电话', key: 'managerPhone', width: 15 },
      { header: '详细地址', key: 'address', width: 30 },
    ];
    worksheet.addRow({
      zoneCode: 'ZONE-01', name: '示例站点', code: 'ST-001', type: '1', longitude: '118.58', latitude: '24.93', designCapacity: 50000, constructionUnit: '市水务集团', commissioningDate: '2023-01-01', managerName: '张三', managerPhone: '13812345678', address: '某某路100号'
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=StationImportTemplate.xlsx');
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
        let commissioningDate = null;
        if (row.getCell(9).value) {
           const dateVal = new Date(row.getCell(9).value?.toString());
           if (!isNaN(dateVal.getTime())) {
             commissioningDate = dateVal;
           }
        }
        dataList.push({
          zoneCode: row.getCell(1).value?.toString() || '',
          name: row.getCell(2).value?.toString() || '',
          code: row.getCell(3).value?.toString() || '',
          type: row.getCell(4).value?.toString() || '1',
          longitude: row.getCell(5).value?.toString() || '',
          latitude: row.getCell(6).value?.toString() || '',
          designCapacity: parseFloat(row.getCell(7).value?.toString() || '0') || null,
          constructionUnit: row.getCell(8).value?.toString() || '',
          commissioningDate: commissioningDate,
          managerName: row.getCell(10).value?.toString() || '',
          managerPhone: row.getCell(11).value?.toString() || '',
          address: row.getCell(12).value?.toString() || '',
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
