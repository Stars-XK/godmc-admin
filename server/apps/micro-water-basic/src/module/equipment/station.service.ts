import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResultData } from '@app/common/utils/result';
import { SysDictDataEntity, WaterStationEntity, Paginate } from '@app/common';
import { Response } from 'express';
import { ExportTable } from '@app/common/utils/export';
import * as exceljs from 'exceljs';

@Injectable()
export class StationService {
  constructor(
    @InjectRepository(WaterStationEntity)
    private readonly rep: Repository<WaterStationEntity>,
    @InjectRepository(SysDictDataEntity)
    private readonly dictRep: Repository<SysDictDataEntity>,
  ) {}

  private async getDictMaps(dictType: string) {
    const rows = await this.dictRep.find({ where: { dictType, delFlag: '0' as any } });
    const byLabel = new Map<string, string>();
    const byValue = new Map<string, string>();
    for (const r of rows) {
      byLabel.set(String(r.dictLabel || '').trim(), String(r.dictValue || '').trim());
      byValue.set(String(r.dictValue || '').trim(), String(r.dictValue || '').trim());
    }
    return { rows, byLabel, byValue };
  }

  private async normalizeStationType(raw: any) {
    const input = String(raw ?? '').trim();
    if (!input) return { ok: true, value: 'OTHER' };

    const legacyMap: Record<string, string> = {
      '1': 'WATER_PLANT',
      '2': 'PUMP_STATION',
      '3': 'OTHER',
      '4': 'OTHER',
      '5': 'MONITOR',
    };

    if (legacyMap[input]) return { ok: true, value: legacyMap[input] };

    const { rows, byLabel, byValue } = await this.getDictMaps('water_station_type');
    if (byValue.has(input)) return { ok: true, value: input };
    if (byLabel.has(input)) return { ok: true, value: byLabel.get(input) };

    return {
      ok: false,
      value: input,
      allowed: rows.map((r) => ({ label: r.dictLabel, value: r.dictValue })),
    };
  }

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

    // 按 status 状态排序（0优先，然后1，最后2），然后按 sort 排序
    entity
      .orderBy('station.status', 'ASC')
      .addOrderBy('station.sort', 'ASC')
      .addOrderBy('station.createTime', 'DESC');
    
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
        { title: '站点类型', dataIndex: 'type' },
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
      { header: '站点类型(填写字典值或中文名称)', key: 'type', width: 28 },
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
      zoneCode: 'ZONE-01', name: '示例站点', code: 'ST-001', type: 'WATER_PLANT', longitude: '118.58', latitude: '24.93', designCapacity: 50000, constructionUnit: '市水务集团', commissioningDate: '2023-01-01', managerName: '张三', managerPhone: '13812345678', address: '某某路100号'
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
    
    return this.importBatch(dataList, user);
  }

  async importBatch(dataList: any[], user: any) {
    const validData = dataList.filter(item => !!item.name && !!item.code);
    if (!validData || validData.length === 0) return ResultData.ok();

    const errors: any[] = [];
    const normalized: any[] = [];
    for (let i = 0; i < validData.length; i++) {
      const item = validData[i];
      const normType = await this.normalizeStationType(item.type);
      if (!normType.ok) {
        errors.push({ row: i + 2, field: 'type', value: item.type, allowed: normType.allowed });
        continue;
      }
      normalized.push({ ...item, type: normType.value });
    }

    if (errors.length > 0) {
      return ResultData.fail(500, `导入失败：站点类型不匹配（示例：WATER_PLANT/水厂）`, { errors });
    }

    const insertData = normalized.map((item, index) => ({
      ...item,
      createBy: user.userName,
      deptId: user.deptId,
      sort: index,
    }));

    // 分批插入，每批处理 500 条数据，防止拼接的 SQL 语句过长导致数据库 max_allowed_packet 报错
    const batchSize = 500;
    for (let i = 0; i < insertData.length; i += batchSize) {
      const chunk = insertData.slice(i, i + batchSize);
      await this.rep.save(chunk);
    }
    
    return ResultData.ok({ msg: `成功导入 ${insertData.length} 条记录` });
  }
}
