import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Response } from 'express';
import { ExportTable } from '@app/common/utils/export';
import { firstValueFrom } from 'rxjs';
import * as exceljs from 'exceljs';

@Injectable()
export class ZoneService {
  constructor(@Inject('MICRO_WATER_BASIC') private readonly microWaterBasicClient: ClientProxy) {}

  create(dto: any, user: any) {
    return this.microWaterBasicClient.send('waterBasic.zone.create', { dto, user });
  }

  findTree(query: any, user: any) {
    return this.microWaterBasicClient.send('waterBasic.zone.findTree', { query, user });
  }

  findOne(id: number) {
    return this.microWaterBasicClient.send('waterBasic.zone.findOne', id);
  }

  update(dto: any, user: any) {
    return this.microWaterBasicClient.send('waterBasic.zone.update', { dto, user });
  }

  remove(id: number) {
    return this.microWaterBasicClient.send('waterBasic.zone.remove', id);
  }

  async export(res: Response, query: any, user: any) {
    const listRes: any = await firstValueFrom(
      this.microWaterBasicClient.send('waterBasic.zone.findList', { query, user })
    );
    const list = listRes?.data || [];
    
    const options = {
      sheetName: '分区数据',
      data: list,
      header: [
        { title: '分区名称', dataIndex: 'name' },
        { title: '分区编码', dataIndex: 'code' },
        { title: '分区维度', dataIndex: 'type' },
        { title: '分区级别', dataIndex: 'level' },
        { title: '覆盖面积(平方公里)', dataIndex: 'area' },
        { title: '服务人口', dataIndex: 'population' },
        { title: '负责人姓名', dataIndex: 'managerName' },
        { title: '负责人电话', dataIndex: 'managerPhone' },
        { title: '位置描述', dataIndex: 'address' },
      ],
    };
    ExportTable(options, res);
  }

  async importTemplate(res: Response) {
    const workbook = new exceljs.Workbook();
    const worksheet = workbook.addWorksheet('分区导入模板');
    
    // 设置列
    worksheet.columns = [
      { header: '分区名称(必填)', key: 'name', width: 20 },
      { header: '分区编码', key: 'code', width: 20 },
      { header: '分区维度(1:行政营业,2:DMA,3:控压,4:供水)', key: 'type', width: 30 },
      { header: '覆盖面积(平方公里)', key: 'area', width: 20 },
      { header: '服务人口', key: 'population', width: 15 },
      { header: '负责人姓名', key: 'managerName', width: 15 },
      { header: '负责人电话', key: 'managerPhone', width: 15 },
      { header: '位置描述', key: 'address', width: 30 },
    ];
    
    // 添加示例数据
    worksheet.addRow({
      name: '示例一区',
      code: 'Z-001',
      type: '1',
      area: 12.5,
      population: 50000,
      managerName: '张三',
      managerPhone: '13800138000',
      address: 'XX路1号',
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=ZoneImportTemplate.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  }

  async importData(file: Express.Multer.File, parentId: number, user: any) {
    if (!file) {
      return { code: 500, msg: '未上传文件' };
    }
    const workbook = new exceljs.Workbook();
    await workbook.xlsx.load(file.buffer as any);
    const worksheet = workbook.getWorksheet(1);
    
    const dataList = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) { // 跳过表头
        dataList.push({
          name: row.getCell(1).value?.toString() || '',
          code: row.getCell(2).value?.toString() || '',
          type: row.getCell(3).value?.toString() || '1',
          area: parseFloat(row.getCell(4).value?.toString() || '0'),
          population: parseInt(row.getCell(5).value?.toString() || '0', 10),
          managerName: row.getCell(6).value?.toString() || '',
          managerPhone: row.getCell(7).value?.toString() || '',
          address: row.getCell(8).value?.toString() || '',
        });
      }
    });
    
    const validData = dataList.filter(item => !!item.name);
    return this.microWaterBasicClient.send('waterBasic.zone.importData', { dataList: validData, parentId, user });
  }
}
