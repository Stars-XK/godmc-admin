import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResultData } from '@app/common/utils/result';
import { SysDictDataEntity, WaterPointEntity, Paginate } from '@app/common';
import { Response } from 'express';
import { ExportTable } from '@app/common/utils/export';
import * as exceljs from 'exceljs';

@Injectable()
export class PointService {
  constructor(
    @InjectRepository(WaterPointEntity)
    private readonly rep: Repository<WaterPointEntity>,
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

  private async normalizePointType(raw: any) {
    const input = String(raw ?? '').trim();
    if (!input) return { ok: true, value: 'OTHER' };

    const { rows, byLabel, byValue } = await this.getDictMaps('water_point_type');
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
      { header: '测点类型(必填)', key: 'type', width: 20 },
      { header: '聚合模式(必填)', key: 'aggType', width: 20 },
      { header: '量程上限', key: 'rangeMax', width: 15 },
      { header: '量程下限', key: 'rangeMin', width: 15 },
      { header: '报警上限', key: 'alarmMax', width: 15 },
      { header: '报警下限', key: 'alarmMin', width: 15 },
      { header: '单位(m³/h,MPa等)', key: 'unit', width: 15 },
      { header: '数据类型', key: 'dataType', width: 15 },
      { header: '读写属性(R/W)', key: 'rwAttr', width: 15 },
    ];
    worksheet.addRow({
      deviceCode: 'DEV-001', name: '出水压力', code: 'PT-001', type: 'PRESSURE', aggType: 'instantaneous', rangeMax: 1.0, rangeMin: 0, alarmMax: 0.8, alarmMin: 0.2, unit: 'MPa', dataType: 'float', rwAttr: 'R'
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
      { field: '所属设备编码', required: '是', type: '字符串', example: 'DEV-001', desc: '必须在设备表中已存在该编码' },
      { field: '测点名称', required: '是', type: '字符串', example: '出水压力', desc: '测点的中文名称' },
      { field: '测点编码', required: '是', type: '字符串', example: 'PT-001', desc: '全局唯一，通常对应网关采集的点位标识' },
      { field: '测点类型', required: '是', type: '字符串', example: 'PRESSURE', desc: '业务分类，关联字典：water_point_type（如FLOW/PRESSURE）' },
      { field: '聚合模式', required: '是', type: '字符串', example: 'instantaneous', desc: '决定历史曲线图和报表的统计算法。关联字典：water_point_agg_type' },
      { field: '量程上下限', required: '否', type: '小数', example: '1.0', desc: '量程配置，用于前端仪表盘或量程校验' },
      { field: '报警上下限', required: '否', type: '小数', example: '0.8', desc: '报警配置，用于触发系统越限告警' },
      { field: '单位', required: '否', type: '字符串', example: 'MPa', desc: '数据单位，如 MPa、m³/h、m 等' },
      { field: '数据类型', required: '否', type: '字符串', example: 'float', desc: '数据类型：float/int/bool' },
      { field: '读写属性', required: '否', type: '字符串', example: 'R', desc: '读写属性：R(只读) / W(只写) / RW(读写)' },
    ]);

    const sheet3 = workbook.addWorksheet('字典值参考');
    sheet3.columns = [
      { header: '字典类型', key: 'dictType', width: 25 },
      { header: '字典标签(展示值)', key: 'label', width: 20 },
      { header: '字典键值(填入值)', key: 'value', width: 20 },
    ];
    sheet3.addRows([
      { dictType: 'water_point_agg_type (聚合模式)', label: '瞬时(取平均)', value: 'instantaneous' },
      { dictType: 'water_point_agg_type (聚合模式)', label: '累计(取最新)', value: 'cumulative' },
      { dictType: 'water_point_agg_type (聚合模式)', label: '增长量(取求和)', value: 'incremental' },
      { dictType: 'water_point_type (测点分类)', label: '压力参数', value: 'PRESSURE' },
      { dictType: 'water_point_type (测点分类)', label: '流量参数', value: 'FLOW' },
      { dictType: 'water_point_type (测点分类)', label: '液位参数', value: 'LEVEL' },
      { dictType: 'water_point_type (测点分类)', label: '水质参数', value: 'QUALITY' },
      { dictType: 'water_point_type (测点分类)', label: '电气参数', value: 'ELECTRIC' },
    ]);

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
          aggType: row.getCell(5).value?.toString() || 'instantaneous',
          rangeMax: parseFloat(row.getCell(6).value?.toString()) || null,
          rangeMin: parseFloat(row.getCell(7).value?.toString()) || null,
          alarmMax: parseFloat(row.getCell(8).value?.toString()) || null,
          alarmMin: parseFloat(row.getCell(9).value?.toString()) || null,
          unit: row.getCell(10).value?.toString() || '',
          dataType: row.getCell(11).value?.toString() || 'float',
          rwAttr: row.getCell(12).value?.toString() || 'R',
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
      const normType = await this.normalizePointType(item.type);
      if (!normType.ok) {
        errors.push({ row: i + 2, field: 'type', value: item.type, allowed: normType.allowed });
        continue;
      }
      normalized.push({ ...item, type: normType.value });
    }

    if (errors.length > 0) {
      return ResultData.fail(500, `导入失败：测点类型不匹配（示例：PRESSURE/压力参数）`, { errors });
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
