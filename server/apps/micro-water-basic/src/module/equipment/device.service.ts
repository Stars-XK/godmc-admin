import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResultData } from '@app/common/utils/result';
import { SysDictDataEntity, WaterDeviceEntity } from '@app/common';
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

  private normalizeDeviceType(raw: any, dictMaps: { rows: any[], byLabel: Map<string, string>, byValue: Map<string, string> }) {
    const input = String(raw ?? '').trim();
    if (!input) return { ok: true, value: 'OTHER' };

    const { rows, byLabel, byValue } = dictMaps;
    if (byValue.has(input)) return { ok: true, value: input };
    if (byLabel.has(input)) return { ok: true, value: byLabel.get(input) };
    
    // 直接查询字典数据，处理数字类型的输入
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
      { header: '所属站点编码', key: 'stationCode', width: 20 },
      { header: '所属分区编码', key: 'zoneCode', width: 20 },
      { header: '设备名称(必填)', key: 'name', width: 20 },
      { header: '设备编码(必填)', key: 'code', width: 20 },
      { header: '设备类型(必填)', key: 'type', width: 15 },
      { header: '型号', key: 'model', width: 20 },
      { header: '厂家', key: 'manufacturer', width: 20 },
      { header: '安装日期(YYYY-MM-DD)', key: 'installDate', width: 20 },
      { header: '设计寿命(年)', key: 'lifespan', width: 15 },
      { header: '额定功率(kW)', key: 'power', width: 15 },
      { header: '负责人', key: 'managerName', width: 15 },
      { header: '电话', key: 'managerPhone', width: 15 },
    ];
    worksheet.addRow({
      stationCode: 'ST-001', zoneCode: 'ZONE-01', name: '1号水泵', code: 'DEV-001', type: 'PUMP', model: 'A-100', manufacturer: '某某设备厂', installDate: '2023-01-01', lifespan: 10, power: '15.5', managerName: '李四', managerPhone: '13812345678'
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
      { field: '所属站点编码', required: '否', type: '字符串', example: 'ST-001', desc: '如果不填则设备不挂载到站点，填入必须在站点表存在' },
      { field: '所属分区编码', required: '否', type: '字符串', example: 'ZONE-01', desc: '如果不填则设备不挂载到分区，填入必须在分区表存在' },
      { field: '设备名称', required: '是', type: '字符串', example: '1号水泵', desc: '设备的中文名称' },
      { field: '设备编码', required: '是', type: '字符串', example: 'DEV-001', desc: '设备的唯一编码标识' },
      { field: '设备类型', required: '是', type: '字符串', example: 'PUMP', desc: '关联字典：water_device_type' },
      { field: '型号', required: '否', type: '字符串', example: 'A-100', desc: '设备型号' },
      { field: '厂家', required: '否', type: '字符串', example: '某某设备厂', desc: '设备生产厂家' },
      { field: '安装日期', required: '否', type: '日期', example: '2023-01-01', desc: '格式为 YYYY-MM-DD' },
      { field: '设计寿命(年)', required: '否', type: '整数', example: '10', desc: '设备设计寿命' },
      { field: '额定功率(kW)', required: '否', type: '字符串', example: '15.5', desc: '设备额定功率' },
      { field: '负责人', required: '否', type: '字符串', example: '李四', desc: '负责人姓名' },
      { field: '电话', required: '否', type: '字符串', example: '13812345678', desc: '负责人电话' },
    ]);

    const sheet3 = workbook.addWorksheet('字典值参考');
    sheet3.columns = [
      { header: '字典类型', key: 'dictType', width: 25 },
      { header: '字典标签(展示值)', key: 'label', width: 20 },
      { header: '字典键值(填入值)', key: 'value', width: 20 },
    ];
    sheet3.addRows([
      { dictType: 'water_device_type', label: '水泵', value: 'PUMP' },
      { dictType: 'water_device_type', label: '阀门', value: 'VALVE' },
      { dictType: 'water_device_type', label: '流量计', value: 'FLOWMETER' },
      { dictType: 'water_device_type', label: '压力表', value: 'PRESSURE_METER' },
      { dictType: 'water_device_type', label: '水质仪', value: 'QUALITY_METER' },
      { dictType: 'water_device_type', label: '网关/DTU', value: 'GATEWAY' },
      { dictType: 'water_device_type', label: 'PLC/RTU', value: 'PLC' },
      { dictType: 'water_device_type', label: '变频器', value: 'VFD' },
      { dictType: 'water_device_type', label: '其他设备', value: 'OTHER' },
    ]);

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

    const dictMaps = await this.getDictMaps('water_device_type');
    const errors: any[] = [];
    const normalized: any[] = [];
    for (let i = 0; i < validData.length; i++) {
      const item = validData[i];
      const normType = this.normalizeDeviceType(item.type, dictMaps);
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
        await this.rep.insert(chunk);
      }

    return ResultData.ok({ msg: `成功导入 ${insertData.length} 条记录` });
  }
}
