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

  private normalizeStationType(raw: any, dictMaps: { rows: any[], byLabel: Map<string, string>, byValue: Map<string, string> }) {
    const input = String(raw ?? '').trim();
    if (!input) return { ok: true, value: 'OTHER' };

    const { rows, byLabel, byValue } = dictMaps;
    if (byValue.has(input)) return { ok: true, value: input };
    if (byLabel.has(input)) return { ok: true, value: byLabel.get(input) };
    
    // 处理数字类型的输入
    const numericInput = parseInt(input, 10);
    if (!isNaN(numericInput)) {
      const dictItem = rows.find(item => String(item.dictValue) === String(numericInput));
      if (dictItem) {
        return { ok: true, value: dictItem.dictValue };
      }
    }

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
      { header: '站点类型(必填)', key: 'type', width: 25 },
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

    const sheet2 = workbook.addWorksheet('字段说明');
    sheet2.columns = [
      { header: '列名', key: 'field', width: 20 },
      { header: '是否必填', key: 'required', width: 10 },
      { header: '数据类型', key: 'type', width: 15 },
      { header: '示例值', key: 'example', width: 20 },
      { header: '说明', key: 'desc', width: 40 },
    ];
    sheet2.addRows([
      { field: '所属分区编码', required: '否', type: '字符串', example: 'ZONE-01', desc: '如果不填则该站点不挂载任何分区，填入必须在分区表存在' },
      { field: '站点名称', required: '是', type: '字符串', example: '示例站点', desc: '站点的中文名称' },
      { field: '站点编码', required: '是', type: '字符串', example: 'ST-001', desc: '站点的唯一编码标识' },
      { field: '站点类型', required: '是', type: '字符串', example: 'WATER_PLANT', desc: '关联字典：water_station_type' },
      { field: '经度(X)', required: '否', type: '小数', example: '118.58', desc: '地理经度' },
      { field: '纬度(Y)', required: '否', type: '小数', example: '24.93', desc: '地理纬度' },
      { field: '设计能力', required: '否', type: '整数', example: '50000', desc: '设计供水/处理能力' },
      { field: '建设单位', required: '否', type: '字符串', example: '市水务集团', desc: '建设方名称' },
      { field: '投运日期', required: '否', type: '日期', example: '2023-01-01', desc: '格式为 YYYY-MM-DD' },
      { field: '负责人', required: '否', type: '字符串', example: '张三', desc: '负责人姓名' },
      { field: '联系电话', required: '否', type: '字符串', example: '13812345678', desc: '负责人电话' },
      { field: '详细地址', required: '否', type: '字符串', example: '某某路100号', desc: '站点的具体地址' },
    ]);

    const sheet3 = workbook.addWorksheet('字典值参考');
    sheet3.columns = [
      { header: '字典类型', key: 'dictType', width: 25 },
      { header: '字典标签(展示值)', key: 'label', width: 20 },
      { header: '字典键值(填入值)', key: 'value', width: 20 },
    ];
    sheet3.addRows([
      { dictType: 'water_station_type', label: '水厂', value: '1' },
      { dictType: 'water_station_type', label: '泵站', value: '2' },
      { dictType: 'water_station_type', label: '二次供水站', value: '3' },
      { dictType: 'water_station_type', label: '管网监测点', value: '4' },
      { dictType: 'water_station_type', label: '污水处理厂', value: '5' },
    ]);

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

    const dictMaps = await this.getDictMaps('water_station_type');
    const errors: any[] = [];
    const normalized: any[] = [];
    for (let i = 0; i < validData.length; i++) {
      const item = validData[i];
      const normType = this.normalizeStationType(item.type, dictMaps);
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
