import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResultData } from '@app/common/utils/result';
import { SysDictDataEntity, WaterDeviceEntity, Paginate } from '@app/common';
import { Response } from 'express';
import { ExportTable } from '@app/common/utils/export';
import * as exceljs from 'exceljs';

@Injectable()
export class DeviceService {
  constructor(
    @InjectRepository(WaterDeviceEntity)
    private readonly rep: Repository<WaterDeviceEntity>,
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

  private async normalizeDeviceType(raw: any) {
    const input = String(raw ?? '').trim();
    if (!input) return { ok: true, value: 'OTHER' };

    const legacyMap: Record<string, string> = {
      '1': 'PUMP',
      '2': 'VALVE',
      '3': 'INSTRUMENT_FLOW',
      '4': 'INSTRUMENT_PRESSURE',
      '5': 'INSTRUMENT_QUALITY',
    };

    if (legacyMap[input]) return { ok: true, value: legacyMap[input] };

    const { rows, byLabel, byValue } = await this.getDictMaps('water_device_type');
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
        { title: '所属站点编码', dataIndex: 'stationCode' },
        { title: '设备名称', dataIndex: 'name' },
        { title: '设备编码', dataIndex: 'code' },
        { title: '设备类型', dataIndex: 'type' },
        { title: '型号', dataIndex: 'model' },
        { title: '厂家', dataIndex: 'manufacturer' },
        { title: '安装日期', dataIndex: 'installDate' },
        { title: '设计寿命(年)', dataIndex: 'lifespan' },
        { title: '额定功率(kW)', dataIndex: 'power' },
        { title: '负责人', dataIndex: 'managerName' },
        { title: '电话', dataIndex: 'managerPhone' },
      ],
    };
    ExportTable(options, res);
  }

  async importTemplate(res: Response) {
    const workbook = new exceljs.Workbook();
    const worksheet = workbook.addWorksheet('设备导入模板');
    worksheet.columns = [
      { header: '所属站点编码(必填)', key: 'stationCode', width: 20 },
      { header: '设备名称(必填)', key: 'name', width: 20 },
      { header: '设备编码(必填)', key: 'code', width: 20 },
      { header: '设备类型(填写字典值或中文名称)', key: 'type', width: 28 },
      { header: '型号', key: 'model', width: 20 },
      { header: '厂家', key: 'manufacturer', width: 20 },
      { header: '安装日期(YYYY-MM-DD)', key: 'installDate', width: 20 },
      { header: '设计寿命(年)', key: 'lifespan', width: 15 },
      { header: '额定功率(kW)', key: 'power', width: 15 },
      { header: '负责人', key: 'managerName', width: 15 },
      { header: '电话', key: 'managerPhone', width: 15 },
    ];
    worksheet.addRow({
      stationCode: 'ST-001', name: '1号水泵', code: 'DEV-001', type: 'PUMP', model: 'A-100', manufacturer: '某某设备厂', installDate: '2023-01-01', lifespan: 10, power: '15.5', managerName: '李四', managerPhone: '13812345678'
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
        let installDate = null;
        if (row.getCell(7).value) {
           const dateVal = new Date(row.getCell(7).value?.toString());
           if (!isNaN(dateVal.getTime())) {
             installDate = dateVal;
           }
        }
        dataList.push({
          stationCode: row.getCell(1).value?.toString() || '',
          name: row.getCell(2).value?.toString() || '',
          code: row.getCell(3).value?.toString() || '',
          type: row.getCell(4).value?.toString() || '1',
          model: row.getCell(5).value?.toString() || '',
          manufacturer: row.getCell(6).value?.toString() || '',
          installDate: installDate,
          lifespan: parseInt(row.getCell(8).value?.toString() || '0') || null,
          power: row.getCell(9).value?.toString() || '',
          managerName: row.getCell(10).value?.toString() || '',
          managerPhone: row.getCell(11).value?.toString() || '',
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
      const normType = await this.normalizeDeviceType(item.type);
      if (!normType.ok) {
        errors.push({ row: i + 2, field: 'type', value: item.type, allowed: normType.allowed });
        continue;
      }
      normalized.push({ ...item, type: normType.value });
    }

    if (errors.length > 0) {
      return ResultData.fail(500, `导入失败：设备类型不匹配（示例：PUMP/水泵类）`, { errors });
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
