import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { ResultData } from '@app/common/utils/result';
import { ExportTable } from '@app/common/utils/export';
import { WaterRevenueUserEntity } from '@app/common/entities/water-basic/water-revenue-user.entity';
import * as exceljs from 'exceljs';

@Injectable()
export class RevenueUserService {
  constructor(
    @InjectRepository(WaterRevenueUserEntity)
    private readonly rep: Repository<WaterRevenueUserEntity>,
  ) {}

  async findList(query: any, user?: any) {
    const { pageNum = 1, pageSize = 10, userNo, userName, phone, status, cardCategory, userCategory } = query;
    const where: any = { delFlag: '0' };

    if (user && user.deptId) where.deptId = user.deptId;
    if (userNo) where.userNo = Like(`%${userNo}%`);
    if (userName) where.userName = Like(`%${userName}%`);
    if (phone) where.phone = Like(`%${phone}%`);
    if (status) where.status = status;
    if (cardCategory) where.cardCategory = cardCategory;
    if (userCategory) where.userCategory = userCategory;

    const [list, total] = await this.rep.findAndCount({
      where,
      order: { createTime: 'DESC' },
      skip: (pageNum - 1) * pageSize,
      take: pageSize,
    });
    return ResultData.ok({ list, total });
  }

  async findOne(id: string) {
    const data = await this.rep.findOne({ where: { id, delFlag: '0' } });
    return ResultData.ok(data);
  }

  async create(data: any, user: any) {
    const exists = await this.rep.findOne({ where: { userNo: data.userNo, delFlag: '0' } });
    if (exists) return ResultData.fail(500, `用户编号 ${data.userNo} 已存在`);

    data.createBy = user.userName;
    if (user.deptId) data.deptId = user.deptId;
    await this.rep.save(data);
    return ResultData.ok();
  }

  async update(data: any, user: any) {
    data.updateBy = user.userName;
    await this.rep.update(data.id, data);
    return ResultData.ok();
  }

  async remove(ids: string[]) {
    await this.rep.update(ids, { delFlag: '1' });
    return ResultData.ok();
  }

  async importTemplate(res: any) {
    const workbook = new exceljs.Workbook();
    const sheet1 = workbook.addWorksheet('营收用户导入模板');
    sheet1.columns = [
      { header: '用户编号', key: 'userNo', width: 20 },
      { header: '名称', key: 'userName', width: 20 },
      { header: '证件号码', key: 'idCard', width: 25 },
      { header: '合同编号', key: 'contractNo', width: 20 },
      { header: '水表编号', key: 'meterNo', width: 20 },
      { header: '表册编号', key: 'bookNo', width: 20 },
      { header: '手机号', key: 'phone', width: 15 },
      { header: '地址', key: 'address', width: 30 },
      { header: '收费类型', key: 'chargeType', width: 15 },
      { header: '口径(mm)', key: 'caliber', width: 15 },
      { header: '水卡分类', key: 'cardCategory', width: 15 },
      { header: '用户分类', key: 'userCategory', width: 25 },
      { header: '立户日期(YYYY-MM-DD)', key: 'installDate', width: 20 },
      { header: '账户余额', key: 'balance', width: 15 },
      { header: '欠费金额', key: 'arrearsAmount', width: 15 },
      { header: '状态', key: 'status', width: 10 },
    ];
    sheet1.addRow({
      userNo: 'REV-001', userName: '张三', idCard: '123456789012345678', contractNo: 'CT-001',
      meterNo: 'MT-001', bookNo: 'BK-001', phone: '13812345678', address: '某某街道1号',
      chargeType: 'monthly', caliber: '20', cardCategory: 'resident', userCategory: 'household',
      installDate: '2023-01-01', balance: '100', arrearsAmount: '0', status: '0'
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
      { field: '用户编号', required: '是', type: '字符串', example: 'REV-001', desc: '营收用户的唯一编码' },
      { field: '名称', required: '是', type: '字符串', example: '张三', desc: '用户名/户主姓名' },
      { field: '证件号码', required: '否', type: '字符串', example: '123456789012345678', desc: '身份证号' },
      { field: '合同编号', required: '否', type: '字符串', example: 'CT-001', desc: '供水合同编号' },
      { field: '水表编号', required: '否', type: '字符串', example: 'MT-001', desc: '水表编号' },
      { field: '表册编号', required: '否', type: '字符串', example: 'BK-001', desc: '抄表册编号' },
      { field: '手机号', required: '否', type: '字符串', example: '13812345678', desc: '联系电话' },
      { field: '地址', required: '否', type: '字符串', example: '某某街道1号', desc: '安装地址' },
      { field: '收费类型', required: '否', type: '字符串', example: 'monthly', desc: '如 monthly（按月）、quarterly（按季度）等' },
      { field: '口径(mm)', required: '否', type: '整数', example: '20', desc: '水表口径' },
      { field: '水卡分类', required: '否', type: '字符串', example: 'resident', desc: '关联字典：water_card_category' },
      { field: '用户分类', required: '否', type: '字符串', example: 'household', desc: '关联字典：water_user_category' },
      { field: '立户日期', required: '否', type: '日期', example: '2023-01-01', desc: '格式为 YYYY-MM-DD' },
      { field: '账户余额', required: '否', type: '数字', example: '100', desc: '账户当前余额' },
      { field: '欠费金额', required: '否', type: '数字', example: '0', desc: '当前欠费金额' },
      { field: '状态', required: '否', type: '字符串', example: '0', desc: '0=正常 1=停用' },
    ]);

    const sheet3 = workbook.addWorksheet('字典值参考');
    sheet3.columns = [
      { header: '字典类型', key: 'dictType', width: 25 },
      { header: '字典标签(展示值)', key: 'label', width: 20 },
      { header: '字典键值(填入值)', key: 'value', width: 20 },
    ];
    sheet3.addRows([
      { dictType: 'water_card_category', label: '居民', value: 'resident' },
      { dictType: 'water_card_category', label: '非居民', value: 'non_resident' },
      { dictType: 'water_card_category', label: '商业', value: 'commercial' },
      { dictType: 'water_user_category', label: '居民生活', value: 'household' },
      { dictType: 'water_user_category', label: '工业', value: 'industrial' },
      { dictType: 'water_user_category', label: '商业', value: 'business' },
      { dictType: 'water_user_category', label: '行政事业', value: 'government' },
      { dictType: 'sys_normal_disable', label: '正常', value: '0' },
      { dictType: 'sys_normal_disable', label: '停用', value: '1' },
    ]);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=RevenueUserImportTemplate.xlsx');
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
        if (row.getCell(13).value) {
          const dateVal = new Date(row.getCell(13).value?.toString());
          if (!isNaN(dateVal.getTime())) {
            installDate = dateVal;
          }
        }
        dataList.push({
          userNo: row.getCell(1).value?.toString() || '',
          userName: row.getCell(2).value?.toString() || '',
          idCard: row.getCell(3).value?.toString() || '',
          contractNo: row.getCell(4).value?.toString() || '',
          meterNo: row.getCell(5).value?.toString() || '',
          bookNo: row.getCell(6).value?.toString() || '',
          phone: row.getCell(7).value?.toString() || '',
          address: row.getCell(8).value?.toString() || '',
          chargeType: row.getCell(9).value?.toString() || '',
          caliber: row.getCell(10).value?.toString() || '',
          cardCategory: row.getCell(11).value?.toString() || '',
          userCategory: row.getCell(12).value?.toString() || '',
          installDate: installDate,
          balance: parseFloat(row.getCell(14).value?.toString() || '0') || 0,
          arrearsAmount: parseFloat(row.getCell(15).value?.toString() || '0') || 0,
          status: row.getCell(16).value?.toString() || '0',
        });
      }
    });

    return this.importBatch(dataList, user);
  }

  async importBatch(dataList: any[], user: any) {
    const validData = dataList.filter(item => !!item.userNo && !!item.userName);
    if (!validData || validData.length === 0) return ResultData.ok();

    // 批量校验 userNo 是否重复
    const userNos = validData.map(item => item.userNo);
    const existingUsers = await this.rep.find({ where: { userNo: In(userNos), delFlag: '0' } });
    const existingUserNos = new Set(existingUsers.map(u => u.userNo));

    const insertData = [];
    const errors = [];
    for (const item of validData) {
      if (existingUserNos.has(item.userNo)) {
        errors.push({ userNo: item.userNo, reason: '用户编号已存在' });
        continue;
      }
      insertData.push({
        ...item,
        createBy: user.userName,
        deptId: user.deptId,
      });
    }

    if (insertData.length > 0) {
      const batchSize = 500;
      for (let i = 0; i < insertData.length; i += batchSize) {
        const chunk = insertData.slice(i, i + batchSize);
        await this.rep.save(chunk);
      }
    }

    const message = errors.length > 0
      ? `成功导入 ${insertData.length} 条，失败 ${errors.length} 条`
      : `成功导入 ${insertData.length} 条记录`;
    return ResultData.ok({ msg: message, errors: errors.length > 0 ? errors : undefined });
  }

  async export(res: any, query: any, user?: any) {
    const { userNo, userName, phone, status, cardCategory, userCategory } = query;
    const where: any = { delFlag: '0' };

    if (user && user.deptId) where.deptId = user.deptId;
    if (userNo) where.userNo = Like(`%${userNo}%`);
    if (userName) where.userName = Like(`%${userName}%`);
    if (phone) where.phone = Like(`%${phone}%`);
    if (status) where.status = status;
    if (cardCategory) where.cardCategory = cardCategory;
    if (userCategory) where.userCategory = userCategory;

    const data = await this.rep.find({
      where,
      order: { createTime: 'DESC' },
    });

    const header = [
      { title: '用户编号', dataIndex: 'userNo', width: 20 },
      { title: '用户名称', dataIndex: 'userName', width: 20 },
      { title: '证件号码', dataIndex: 'idCard', width: 25 },
      { title: '合同编号', dataIndex: 'contractNo', width: 20 },
      { title: '水表编号', dataIndex: 'meterNo', width: 20 },
      { title: '表册编号', dataIndex: 'bookNo', width: 20 },
      { title: '手机号', dataIndex: 'phone', width: 15 },
      { title: '地址', dataIndex: 'address', width: 30 },
      { title: '收费类型', dataIndex: 'chargeType', width: 15 },
      { title: '口径', dataIndex: 'caliber', width: 10 },
      { title: '水卡分类', dataIndex: 'cardCategory', width: 15 },
      { title: '用户分类', dataIndex: 'userCategory', width: 25 },
      { title: '立户日期', dataIndex: 'installDate', width: 20 },
      { title: '账户余额', dataIndex: 'balance', width: 15 },
      { title: '欠费金额', dataIndex: 'arrearsAmount', width: 15 },
      { title: '状态', dataIndex: 'status', width: 10 },
    ];

    return ExportTable({
      data,
      header,
      sheetName: '营收基础用户信息',
      dictMap: {
        status: 'sys_normal_disable',
        cardCategory: 'water_card_category',
        userCategory: 'water_user_category'
      }
    }, res);
  }
}
