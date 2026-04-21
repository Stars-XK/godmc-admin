import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, In } from 'typeorm';
import { ResultData } from '@app/common/utils/result';
import { WaterZoneEntity, WaterDeviceEntity } from '@app/common';
import { WaterRevenueUserEntity } from '@app/common/entities/water-basic/water-revenue-user.entity';
import { ListToTree } from '@app/common/utils/index';
import { Response } from 'express';
import { ExportTable } from '@app/common/utils/export';
import * as exceljs from 'exceljs';

@Injectable()
export class ZoneService {
  constructor(
    @InjectRepository(WaterZoneEntity)
    private readonly zoneRep: Repository<WaterZoneEntity>,
    @InjectRepository(WaterDeviceEntity)
    private readonly deviceRep: Repository<WaterDeviceEntity>,
    @InjectRepository(WaterRevenueUserEntity)
    private readonly revenueUserRep: Repository<WaterRevenueUserEntity>,
  ) {}

  async create(createDto: any, user: any) {
    createDto.createBy = user.userName;
    createDto.deptId = user.deptId;
    if (createDto.parentId && createDto.parentId !== 0) {
      const parentCode = String(createDto.parentId);
      const parent = await this.zoneRep.findOne({
        where: {
          code: parentCode,
          delFlag: '0',
        },
        select: ['ancestors', 'level', 'code'],
      });
      if (!parent) {
        return ResultData.fail(500, '父级分区不存在');
      }
      const ancestors = parent.ancestors ? `${parent.ancestors},${parent.code}` : `${parent.code}`;
      Object.assign(createDto, { ancestors: ancestors, level: parent.level + 1 });
    } else {
      Object.assign(createDto, { ancestors: '0', level: 1 });
    }
    await this.zoneRep.save(createDto);
    return ResultData.ok();
  }

  async findList(query: any, user: any) {
    const entity = this.zoneRep.createQueryBuilder('zone');
    entity.where('zone.delFlag = :delFlag', { delFlag: '0' });

    if (query.type) {
      entity.andWhere('zone.type = :type', { type: query.type });
    }
    if (query.name) {
      entity.andWhere(`zone.name LIKE "%${query.name}%"`);
    }
    if (query.code) {
      entity.andWhere(`zone.code LIKE "%${query.code}%"`);
    }
    if (query.status) {
      entity.andWhere('zone.status = :status', { status: query.status });
    }

    const isAdmin = user.roles?.includes('admin') || user.user?.roles?.some((r) => r.roleKey === 'admin' || r.roleId === 1);
    if (!isAdmin && user.deptId) {
      entity.andWhere('zone.deptId = :deptId', { deptId: user.deptId });
    }

    entity.orderBy('zone.sort', 'ASC');

    const res = await entity.getMany();
    return ResultData.ok(res);
  }

  async findTree(query: any, user: any) {
    const entity = this.zoneRep.createQueryBuilder('zone');
    entity.where('zone.delFlag = :delFlag', { delFlag: '0' });

    if (query.type) {
      entity.andWhere('zone.type = :type', { type: query.type });
    }
    if (query.name) {
      entity.andWhere(`zone.name LIKE "%${query.name}%"`);
    }
    if (query.code) {
      entity.andWhere(`zone.code LIKE "%${query.code}%"`);
    }
    if (query.status) {
      entity.andWhere('zone.status = :status', { status: query.status });
    }

    // 简单的数据权限过滤：这里只过滤属于当前用户部门及子部门的数据
    // 如果系统没有完善的 deptService 共享方法，这里退化为只看本部门数据或全部数据
    // 由于业务系统管理员看全部，普通人员看自己部门，可以通过用户 role 进行简单判定
    const isAdmin = user.roles?.includes('admin') || user.user?.roles?.some((r) => r.roleKey === 'admin' || r.roleId === 1);
    if (!isAdmin && user.deptId) {
      // 假设当前用户只能看本部门的数据
      entity.andWhere('zone.deptId = :deptId', { deptId: user.deptId });
    }

    // 如果有查询条件（名称、编码、状态），则说明用户在搜索，为了保证搜索结果能被看到，不限制层级；
    // 如果是无条件默认加载首屏，为了性能，仅返回前3层，剩下的让前端懒加载
    const hasSearchFilter = query.name || query.code || query.status;
    if (!hasSearchFilter) {
      entity.andWhere('zone.level <= 3');
    }

    const res = await entity.getMany();
    // 使用 ListToTree 并开启自动补充 hasChildren 标识，便于前端判断是否显示展开箭头
    const tree = ListToTree(
      res,
      (m) => m.code,
      (m) => m.parentId
    );
    
    // 如果是默认加载（有限制层级），我们需要把处在边缘层（level === 3）但实际数据库中还有子节点的标记一下
    // 因为 ListToTree 后，level=3 的节点 children 是空的，前端会认为它没有子节点而隐藏展开箭头
    if (!hasSearchFilter) {
      const markHasChildren = async (nodes: any[]) => {
        for (const node of nodes) {
          if (node.level === 3) {
            // 查询数据库中是否有以它为父级的节点
            const childCount = await this.zoneRep.count({ where: { parentId: node.code, delFlag: '0' } });
            node.hasChildren = childCount > 0;
            // 懒加载必须彻底删除 children 属性，不能是空数组 []，否则前端 el-table 不会触发 load 事件
            delete node.children;
          } else if (node.children && node.children.length > 0) {
            await markHasChildren(node.children);
          }
        }
      };
      await markHasChildren(tree);
    }

    return ResultData.ok(tree);
  }

  async findLazyChildren(parentId: string, query: any, user: any) {
    const entity = this.zoneRep.createQueryBuilder('zone');
    entity.where('zone.delFlag = :delFlag', { delFlag: '0' });

    // 只查询当前父节点的所有子孙节点，或者直接在内存中做？
    // 为了保证 count 和权限过滤的一致性，我们仍然查出符合条件的所有数据
    if (query.type) entity.andWhere('zone.type = :type', { type: query.type });
    if (query.name) entity.andWhere(`zone.name LIKE "%${query.name}%"`);
    if (query.code) entity.andWhere(`zone.code LIKE "%${query.code}%"`);
    if (query.status) entity.andWhere('zone.status = :status', { status: query.status });

    const isAdmin = user.roles?.includes('admin') || user.user?.roles?.some((r) => r.roleKey === 'admin' || r.roleId === 1);
    if (!isAdmin && user.deptId) {
      entity.andWhere('zone.deptId = :deptId', { deptId: user.deptId });
    }

    const res = await entity.getMany();

    // 内存中找出直接下级，并计算 hasChildren 和 childCount
    // 注意：如果是前端懒加载，这里的查询条件应当仅针对指定的 parentId
    const children = res.filter(m => String(m.parentId) === parentId);
    
    // 给 children 补充 childCount 和 hasChildren 属性
    const mappedChildren = [];
    for (const child of children) {
      const childCodeStr = String(child.code);
      const childCodeNum = Number(child.code);
      const childCount = await this.zoneRep.count({ where: { parentId: childCodeNum, delFlag: '0' } });
      const mappedChild = {
        ...child,
        childCount,
        hasChildren: childCount > 0,
      };
      // 删除 children 属性，确保前端 el-table 能继续触发下一层的 lazy load
      if ('children' in mappedChild) {
        delete mappedChild.children;
      }
      mappedChildren.push(mappedChild);
    }

    return ResultData.ok(mappedChildren);
  }

  async findOne(id: number) {
    const data = await this.zoneRep.findOne({
      where: {
        id: id,
        delFlag: '0',
      },
    });
    return ResultData.ok(data);
  }

  async update(updateDto: any, user: any) {
    updateDto.updateBy = user.userName;
    if (updateDto.parentId && updateDto.parentId !== 0) {
      const parentCode = String(updateDto.parentId);
      const parent = await this.zoneRep.findOne({
        where: {
          code: parentCode,
          delFlag: '0',
        },
        select: ['ancestors', 'level', 'code'],
      });
      if (!parent) {
        return ResultData.fail(500, '父级分区不存在');
      }
      const ancestors = parent.ancestors ? `${parent.ancestors},${parent.code}` : `${parent.code}`;
      Object.assign(updateDto, { ancestors: ancestors, level: parent.level + 1 });
    } else {
      Object.assign(updateDto, { ancestors: '0', level: 1 });
    }
    await this.zoneRep.update({ id: updateDto.id }, updateDto);
    return ResultData.ok();
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
    if (!validData || validData.length === 0) return ResultData.ok();

    let parentLevel = 0;
    let parentAncestors = '0';

    if (parentId && parentId !== 0) {
      const parentCode = String(parentId);
      const parent = await this.zoneRep.findOne({
        where: { code: parentCode, delFlag: '0' },
        select: ['ancestors', 'level', 'code'],
      });
      if (!parent) return ResultData.fail(500, '指定的父级分区不存在');
      parentLevel = parent.level;
      parentAncestors = parent.ancestors ? `${parent.ancestors},${parent.code}` : `${parent.code}`;
    }

    const insertData = validData.map((item, index) => {
      return {
        ...item,
        parentId: parentId || 0,
        ancestors: parentAncestors,
        level: parentLevel + 1,
        createBy: user.userName,
        deptId: user.deptId,
        sort: item.sort || index,
      };
    });

    await this.zoneRep.save(insertData);
    return ResultData.ok();
  }

  async export(res: Response, query: any, user: any) {
    const listRes: any = await this.findList(query, user);
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

  async remove(id: number) {
    const current = await this.zoneRep.findOne({
      where: { id: id, delFlag: '0' },
      select: ['code'],
    });
    if (!current) {
      return ResultData.fail(500, '数据不存在');
    }

    const hasChild = await this.zoneRep
      .createQueryBuilder('zone')
      .where('zone.delFlag = :delFlag', { delFlag: '0' })
      .andWhere('zone.parentId = :parentId', { parentId: current.code })
      .getCount();
    if (hasChild > 0) {
      return ResultData.fail(500, '存在子级分区,不允许删除');
    }
    const data = await this.zoneRep.update(
      { id: id },
      {
        delFlag: '1',
      },
    );
    return ResultData.ok(data);
  }

  // ================= 关联设备 =================

  async unboundDeviceList(query: any) {
    const { name, code, type, pageNum = 1, pageSize = 20 } = query;
    const pn = Math.max(parseInt(pageNum, 10) || 1, 1);
    const ps = Math.min(Math.max(parseInt(pageSize, 10) || 20, 1), 500);
    const qb = this.deviceRep.createQueryBuilder('device')
      .where('device.delFlag = :delFlag', { delFlag: '0' })
      .andWhere('device.zoneCode IS NULL');

    if (name) qb.andWhere(`device.name LIKE "%${name}%"`);
    if (code) qb.andWhere(`device.code LIKE "%${code}%"`);
    if (type) qb.andWhere('device.type = :type', { type });

    const [list, total] = await qb
      .orderBy('device.createTime', 'DESC')
      .skip((pn - 1) * ps)
      .take(ps)
      .getManyAndCount();
    return ResultData.ok({ list, total });
  }

  async bindDevices(zoneCode: string, deviceIds: string[]) {
    if (!zoneCode || !deviceIds || deviceIds.length === 0) return ResultData.ok();
    await this.deviceRep.update({ id: In(deviceIds) }, { zoneCode });
    return ResultData.ok();
  }

  async importBindDevices(zoneCode: string, mode: string, dataList: any[]) {
    if (!zoneCode) return ResultData.fail(500, '缺少分区编码');
    
    if (mode === 'replace') {
      await this.deviceRep.createQueryBuilder()
        .update(WaterDeviceEntity)
        .set({ zoneCode: null })
        .where("zone_code = :zoneCode", { zoneCode })
        .execute();
    }

    let successCount = 0;
    let failCount = 0;
    const results = [];

    for (const item of dataList) {
      const code = item.code || item['设备编码'];
      if (!code) {
        failCount++;
        results.push({ code: '未知', success: false, reason: '缺少设备编码' });
        continue;
      }

      const device = await this.deviceRep.findOne({ where: { code, delFlag: '0' } });
      if (!device) {
        failCount++;
        results.push({ code, success: false, reason: '设备编码不存在' });
        continue;
      }

      if (device.zoneCode && device.zoneCode !== zoneCode) {
        failCount++;
        results.push({ code, success: false, reason: `该设备已被其他分区(${device.zoneCode})绑定` });
        continue;
      }

      await this.deviceRep.update(device.id, { zoneCode });
      successCount++;
      results.push({ code, success: true, reason: '关联成功' });
    }

    return ResultData.ok({ successCount, failCount, results });
  }

  // ================= 关联营收 =================

  async unboundRevenueList(query: any) {
    const { name, userNo, userCategory, pageNum = 1, pageSize = 20 } = query;
    const pn = Math.max(parseInt(pageNum, 10) || 1, 1);
    const ps = Math.min(Math.max(parseInt(pageSize, 10) || 20, 1), 500);
    const qb = this.revenueUserRep.createQueryBuilder('user')
      .where('user.delFlag = :delFlag', { delFlag: '0' })
      .andWhere('user.zoneCode IS NULL');

    if (name) qb.andWhere(`user.userName LIKE "%${name}%"`);
    if (userNo) qb.andWhere(`user.userNo LIKE "%${userNo}%"`);
    if (userCategory) qb.andWhere('user.userCategory = :userCategory', { userCategory });

    const [list, total] = await qb
      .orderBy('user.createTime', 'DESC')
      .skip((pn - 1) * ps)
      .take(ps)
      .getManyAndCount();
    return ResultData.ok({ list, total });
  }

  async bindRevenueUsers(zoneCode: string, userIds: string[]) {
    if (!zoneCode || !userIds || userIds.length === 0) return ResultData.ok();
    await this.revenueUserRep.update({ id: In(userIds) }, { zoneCode });
    return ResultData.ok();
  }

  async importBindRevenueUsers(zoneCode: string, mode: string, dataList: any[]) {
    if (!zoneCode) return ResultData.fail(500, '缺少分区编码');
    
    if (mode === 'replace') {
      await this.revenueUserRep.createQueryBuilder()
        .update(WaterRevenueUserEntity)
        .set({ zoneCode: null })
        .where("zone_code = :zoneCode", { zoneCode })
        .execute();
    }

    let successCount = 0;
    let failCount = 0;
    const results = [];

    for (const item of dataList) {
      const userNo = item.userNo || item['用户编号'];
      if (!userNo) {
        failCount++;
        results.push({ userNo: '未知', success: false, reason: '缺少用户编号' });
        continue;
      }

      const user = await this.revenueUserRep.findOne({ where: { userNo, delFlag: '0' } });
      if (!user) {
        failCount++;
        results.push({ userNo, success: false, reason: '用户编号不存在' });
        continue;
      }

      if (user.zoneCode && user.zoneCode !== zoneCode) {
        failCount++;
        results.push({ userNo, success: false, reason: `该用户已被其他分区(${user.zoneCode})绑定` });
        continue;
      }

      await this.revenueUserRep.update(user.id, { zoneCode });
      successCount++;
      results.push({ userNo, success: true, reason: '关联成功' });
    }

    return ResultData.ok({ successCount, failCount, results });
  }

  async bindDeviceTemplate(res: Response) {
    const workbook = new exceljs.Workbook();
    const worksheet = workbook.addWorksheet('设备关联模板');
    worksheet.columns = [
      { header: '设备编码', key: 'code', width: 30 },
    ];
    worksheet.addRow({ code: 'DEV001' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=ZoneBindDeviceTemplate.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  }

  async bindRevenueTemplate(res: Response) {
    const workbook = new exceljs.Workbook();
    const worksheet = workbook.addWorksheet('营收关联模板');
    worksheet.columns = [
      { header: '用户编号', key: 'userNo', width: 30 },
    ];
    worksheet.addRow({ userNo: 'U0001' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=ZoneBindRevenueTemplate.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  }
}
