import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResultData } from '@app/common/utils/result';
import { SysDictDataEntity, WaterPipeEntity } from '@app/common';
import { Response } from 'express';
import { ExportTable } from '@app/common/utils/export';
import * as exceljs from 'exceljs';

@Injectable()
export class PipeService {
  constructor(
    @InjectRepository(WaterPipeEntity)
    private readonly rep: Repository<WaterPipeEntity>,
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

  private normalizePipeType(raw: any, dictMaps: { rows: any[]; byLabel: Map<string, string>; byValue: Map<string, string> }) {
    const input = String(raw ?? '').trim();
    if (!input) return { ok: true, value: 'WATER_SUPPLY' };
    const { rows, byLabel, byValue } = dictMaps;
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
    const entity = this.rep.createQueryBuilder('pipe');
    entity.where('pipe.delFlag = :delFlag', { delFlag: '0' });

    if (query.name) entity.andWhere('pipe.name LIKE :name', { name: `%${query.name}%` });
    if (query.code) entity.andWhere('pipe.code LIKE :code', { code: `%${query.code}%` });
    if (query.pipeType) entity.andWhere('pipe.pipeType = :pipeType', { pipeType: query.pipeType });
    if (query.material) entity.andWhere('pipe.material = :material', { material: query.material });
    if (query.status) entity.andWhere('pipe.status = :status', { status: query.status });
    if (query.zoneCode) entity.andWhere('pipe.zoneCode = :zoneCode', { zoneCode: query.zoneCode });

    const isAdmin = user.roles?.includes('admin') || user.user?.roles?.some((r: any) => r.roleKey === 'admin' || r.roleId === 1);
    if (!isAdmin && user.deptId) {
      entity.andWhere('pipe.deptId = :deptId', { deptId: user.deptId });
    }

    entity
      .orderBy('pipe.status', 'ASC')
      .addOrderBy('pipe.sort', 'ASC')
      .addOrderBy('pipe.createTime', 'DESC');

    const [list, total] = await entity.skip((query.pageNum - 1) * query.pageSize).take(query.pageSize).getManyAndCount();
    return ResultData.ok({ list, total });
  }

  async findOne(id: number) {
    const data = await this.rep.findOne({ where: { id, delFlag: '0' } });
    return ResultData.ok(data);
  }

  async update(updateDto: any, user: any) {
    updateDto.updateBy = user.userName;
    await this.rep.update({ id: updateDto.id }, updateDto);
    return ResultData.ok();
  }

  async remove(id: number) {
    await this.rep.update({ id }, { delFlag: '1' });
    return ResultData.ok();
  }

  async export(res: Response, query: any, user: any) {
    query.pageNum = 1;
    query.pageSize = 100000;
    const listRes: any = await this.findList(query, user);
    const list = listRes?.data?.list || [];

    const options = {
      sheetName: '管网管线数据',
      data: list,
      header: [
        { title: '所属分区编码', dataIndex: 'zoneCode' },
        { title: '管线名称', dataIndex: 'name' },
        { title: '管线编码', dataIndex: 'code' },
        { title: '管线类型', dataIndex: 'pipeType' },
        { title: '管材', dataIndex: 'material' },
        { title: '管径(mm)', dataIndex: 'diameter' },
        { title: '长度(m)', dataIndex: 'length' },
        { title: '起点节点', dataIndex: 'startNode' },
        { title: '终点节点', dataIndex: 'endNode' },
        { title: '埋深(m)', dataIndex: 'burialDepth' },
        { title: '铺设日期', dataIndex: 'installDate' },
        { title: '施工单位', dataIndex: 'constructionUnit' },
      ],
    };
    ExportTable(options, res);
  }

  async importTemplate(res: Response) {
    const workbook = new exceljs.Workbook();
    const worksheet = workbook.addWorksheet('管网管线导入模板');
    worksheet.columns = [
      { header: '所属分区编码', key: 'zoneCode', width: 15 },
      { header: '管线名称(必填)', key: 'name', width: 20 },
      { header: '管线编码(必填)', key: 'code', width: 20 },
      { header: '管线类型(必填)', key: 'pipeType', width: 20 },
      { header: '管材', key: 'material', width: 15 },
      { header: '管径(mm)', key: 'diameter', width: 15 },
      { header: '长度(m)', key: 'length', width: 15 },
      { header: '起点节点', key: 'startNode', width: 20 },
      { header: '终点节点', key: 'endNode', width: 20 },
      { header: '埋深(m)', key: 'burialDepth', width: 15 },
      { header: '铺设日期(YYYY-MM-DD)', key: 'installDate', width: 20 },
      { header: '施工单位', key: 'constructionUnit', width: 20 },
    ];
    worksheet.addRow({
      zoneCode: 'ZONE-01', name: '示例管线', code: 'PIPE-001', pipeType: 'WATER_SUPPLY', material: 'PE', diameter: 200, length: 500, startNode: '泵站A', endNode: '小区B', burialDepth: 1.5, installDate: '2023-01-01', constructionUnit: '市水务集团',
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
      { field: '所属分区编码', required: '否', type: '字符串', example: 'ZONE-01', desc: '如果不填则不属于任何分区' },
      { field: '管线名称', required: '是', type: '字符串', example: '示例管线', desc: '管线的中文名称' },
      { field: '管线编码', required: '是', type: '字符串', example: 'PIPE-001', desc: '管线的唯一编码标识' },
      { field: '管线类型', required: '是', type: '字符串', example: 'WATER_SUPPLY', desc: '关联字典：water_pipe_type' },
      { field: '管材', required: '否', type: '字符串', example: 'PE', desc: '管材类型：PE/PVC/铸铁/钢管等' },
      { field: '管径(mm)', required: '否', type: '整数', example: '200', desc: '管道直径，单位毫米' },
      { field: '长度(m)', required: '否', type: '小数', example: '500', desc: '管线长度，单位米' },
      { field: '起点节点', required: '否', type: '字符串', example: '泵站A', desc: '起点连接节点名称' },
      { field: '终点节点', required: '否', type: '字符串', example: '小区B', desc: '终点连接节点名称' },
      { field: '埋深(m)', required: '否', type: '小数', example: '1.5', desc: '埋设深度，单位米' },
      { field: '铺设日期', required: '否', type: '日期', example: '2023-01-01', desc: '格式为 YYYY-MM-DD' },
      { field: '施工单位', required: '否', type: '字符串', example: '市水务集团', desc: '施工方名称' },
    ]);

    const sheet3 = workbook.addWorksheet('字典值参考');
    sheet3.columns = [
      { header: '字典类型', key: 'dictType', width: 25 },
      { header: '字典标签(展示值)', key: 'label', width: 20 },
      { header: '字典键值(填入值)', key: 'value', width: 20 },
    ];
    sheet3.addRows([
      { dictType: 'water_pipe_type', label: '供水管', value: 'WATER_SUPPLY' },
      { dictType: 'water_pipe_type', label: '排水管', value: 'DRAINAGE' },
      { dictType: 'water_pipe_type', label: '污水管', value: 'SEWAGE' },
      { dictType: 'water_pipe_type', label: '回用水管', value: 'RECLAIMED' },
    ]);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=PipeImportTemplate.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  }

  async importData(file: Express.Multer.File, user: any) {
    if (!file) return { code: 500, msg: '未上传文件' };
    const workbook = new exceljs.Workbook();
    await workbook.xlsx.load(file.buffer as any);
    const worksheet = workbook.getWorksheet(1);

    const dataList: any[] = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        let installDate = null;
        if (row.getCell(11).value) {
          const dateVal = new Date(row.getCell(11).value?.toString());
          if (!isNaN(dateVal.getTime())) installDate = dateVal;
        }
        dataList.push({
          zoneCode: row.getCell(1).value?.toString() || '',
          name: row.getCell(2).value?.toString() || '',
          code: row.getCell(3).value?.toString() || '',
          pipeType: row.getCell(4).value?.toString() || 'WATER_SUPPLY',
          material: row.getCell(5).value?.toString() || '',
          diameter: parseFloat(row.getCell(6).value?.toString() || '0') || null,
          length: parseFloat(row.getCell(7).value?.toString() || '0') || null,
          startNode: row.getCell(8).value?.toString() || '',
          endNode: row.getCell(9).value?.toString() || '',
          burialDepth: parseFloat(row.getCell(10).value?.toString() || '0') || null,
          installDate,
          constructionUnit: row.getCell(12).value?.toString() || '',
        });
      }
    });
    return this.importBatch(dataList, user);
  }

  async importBatch(dataList: any[], user: any) {
    const validData = dataList.filter((item) => !!item.name && !!item.code);
    if (!validData || validData.length === 0) return ResultData.ok();

    const dictMaps = await this.getDictMaps('water_pipe_type');
    const errors: any[] = [];
    const normalized: any[] = [];
    for (let i = 0; i < validData.length; i++) {
      const item = validData[i];
      const normType = this.normalizePipeType(item.pipeType, dictMaps);
      if (!normType.ok) {
        errors.push({ row: i + 2, field: 'pipeType', value: item.pipeType, allowed: normType.allowed });
        continue;
      }
      normalized.push({ ...item, pipeType: normType.value });
    }

    if (errors.length > 0) {
      return ResultData.fail(500, '导入失败：管线类型不匹配', { errors });
    }

    const insertData = normalized.map((item, index) => ({
      ...item,
      createBy: user.userName,
      deptId: user.deptId,
      sort: index,
    }));

    const batchSize = 500;
    for (let i = 0; i < insertData.length; i += batchSize) {
      const chunk = insertData.slice(i, i + batchSize);
      await this.rep.insert(chunk);
    }

    return ResultData.ok({ msg: `成功导入 ${insertData.length} 条记录` });
  }
}
