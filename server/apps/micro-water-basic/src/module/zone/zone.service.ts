import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, In } from 'typeorm';
import { ResultData } from '@app/common/utils/result';
import { WaterZoneEntity, WaterDeviceEntity, WaterPointEntity, WaterZoneMetricCalcEntity, WaterStationEntity } from '@app/common';
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
    @InjectRepository(WaterStationEntity)
    private readonly stationRep: Repository<WaterStationEntity>,
    @InjectRepository(WaterPointEntity)
    private readonly pointRep: Repository<WaterPointEntity>,
    @InjectRepository(WaterZoneMetricCalcEntity)
    private readonly metricCalcRep: Repository<WaterZoneMetricCalcEntity>,
    @InjectRepository(WaterRevenueUserEntity)
    private readonly revenueUserRep: Repository<WaterRevenueUserEntity>,
  ) {}

  async create(createDto: any, user: any) {
    createDto.createBy = user.userName;
    createDto.deptId = user.deptId;
    if (createDto.parentId && createDto.parentId !== 0) {
      const parent = await this.zoneRep.findOne({
        where: {
          id: createDto.parentId,
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

  // ================= 核心分区管理接口 =================

  async findList(query: any, user: any) {
    const entity = this.zoneRep.createQueryBuilder('zone');
    entity.where('zone.delFlag = :delFlag', { delFlag: '0' });

    if (query.type) {
      entity.andWhere('zone.type = :type', { type: query.type });
    }
    if (query.name) {
      entity.andWhere('zone.name LIKE :name', { name: `%${query.name}%` });
    }
    if (query.code) {
      entity.andWhere('zone.code LIKE :code', { code: `%${query.code}%` });
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
      entity.andWhere('zone.name LIKE :name', { name: `%${query.name}%` });
    }
    if (query.code) {
      entity.andWhere('zone.code LIKE :code', { code: `%${query.code}%` });
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
    if (query.name) entity.andWhere('zone.name LIKE :name', { name: `%${query.name}%` });
    if (query.code) entity.andWhere('zone.code LIKE :code', { code: `%${query.code}%` });
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
      const parent = await this.zoneRep.findOne({
        where: {
          id: updateDto.parentId,
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
          parentCode: row.getCell(1).value?.toString() || '',
          name: row.getCell(2).value?.toString() || '',
          code: row.getCell(3).value?.toString() || '',
          type: (row.getCell(4).value?.toString() || '1').substring(0, 1),
          area: parseFloat(row.getCell(5).value?.toString() || '0'),
          population: parseInt(row.getCell(6).value?.toString() || '0', 10),
          address: row.getCell(7).value?.toString() || '',
          managerName: '',
          managerPhone: '',
        });
      }
    });
    
    const validData = dataList.filter(item => !!item.name);
    if (!validData || validData.length === 0) return ResultData.ok();

    const insertData = [];
    
    if (parentId && parentId !== 0) {
      // 场景1：带有parentId，所有导入的分区都作为该分区的子级
      const parent = await this.zoneRep.findOne({
        where: { code: String(parentId), delFlag: '0' },
        select: ['id', 'ancestors', 'level', 'code'],
      });
      if (!parent) return ResultData.fail(500, '指定的父级分区不存在');
      
      for (let i = 0; i < validData.length; i++) {
        const item = validData[i];
        insertData.push({
          name: item.name,
          code: item.code,
          type: item.type,
          area: item.area,
          population: item.population,
          address: item.address,
          managerName: item.managerName,
          managerPhone: item.managerPhone,
          parentId: parent.id,
          ancestors: parent.ancestors ? `${parent.ancestors},${parent.code}` : `${parent.code}`,
          level: parent.level + 1,
          createBy: user.userName,
          deptId: user.deptId,
          sort: item.sort || i,
        });
      }

      const batchSize = 500;
      for (let i = 0; i < insertData.length; i += batchSize) {
        const chunk = insertData.slice(i, i + batchSize);
        await this.zoneRep.insert(chunk);
      }
    } else {
      // 场景2：没有parentId，根据Excel中的parentCode构建树结构
      // 1. 先收集所有分区的code和基本信息
      const zoneMap = new Map();
      validData.forEach(item => {
        zoneMap.set(item.code, {
          ...item,
          id: null, // 临时存储ID
        });
      });
      
      // 2. 批量插入根分区（parentCode为0或空）
      const rootZones = validData.filter(item => !item.parentCode || item.parentCode === '0');
      
      const rootEntities = rootZones.map((item, i) => ({
        name: item.name,
        code: item.code,
        type: item.type,
        area: item.area,
        population: item.population,
        address: item.address,
        managerName: item.managerName,
        managerPhone: item.managerPhone,
        parentId: 0,
        ancestors: '0',
        level: 1,
        createBy: user.userName,
        deptId: user.deptId,
        sort: item.sort || i,
      }));
      
      const savedRoots = await this.zoneRep.insert(rootEntities);
      
      const processedCodes = new Set();
      rootEntities.forEach((z, idx) => {
        const info = zoneMap.get(z.code);
        if (info) {
          info.id = savedRoots.identifiers[idx].id;
          info.ancestors = z.ancestors;
          info.level = z.level;
        }
        processedCodes.add(z.code);
      });
      
      // 3. 批量插入子分区（按层级递归处理）
      let currentParents = rootZones.map(z => z.code);
      
      while (currentParents.length > 0) {
        const children = validData.filter(item => currentParents.includes(item.parentCode) && !processedCodes.has(item.code));
        if (children.length === 0) break;
        
        const childEntities = children.map((item, i) => {
          const parentInfo = zoneMap.get(item.parentCode);
          return {
            name: item.name,
            code: item.code,
            type: item.type,
            area: item.area,
            population: item.population,
            address: item.address,
            managerName: item.managerName,
            managerPhone: item.managerPhone,
            parentId: parentInfo.id,
            ancestors: parentInfo.ancestors ? `${parentInfo.ancestors},${item.parentCode}` : `${item.parentCode}`,
            level: parentInfo.level + 1,
            createBy: user.userName,
            deptId: user.deptId,
            sort: item.sort || i,
          };
        });
        
        const savedChildren = await this.zoneRep.insert(childEntities);
        
        childEntities.forEach((z, idx) => {
          const info = zoneMap.get(z.code);
          if (info) {
            info.id = savedChildren.identifiers[idx].id;
            info.ancestors = z.ancestors;
            info.level = z.level;
          }
          processedCodes.add(z.code);
        });
        
        currentParents = children.map(z => z.code);
      }
    }

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
    worksheet.columns = [
      { header: '父级分区编码', key: 'parentCode', width: 20 },
      { header: '分区名称(必填)', key: 'name', width: 20 },
      { header: '分区编码(必填)', key: 'code', width: 20 },
      { header: '分区维度(必填)', key: 'type', width: 15 },
      { header: '覆盖面积(k㎡)', key: 'area', width: 15 },
      { header: '服务人口', key: 'population', width: 15 },
      { header: '位置描述', key: 'address', width: 30 },
    ];
    worksheet.addRow({
      parentCode: 'ZONE-ROOT', name: '城东片区', code: 'ZONE-01', type: '1', area: 15.5, population: 50000, address: '城东大道周边'
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
      { field: '父级分区编码', required: '否', type: '字符串', example: 'ZONE-ROOT', desc: '如果不填则作为顶级分区。填入的编码必须在系统中已存在。' },
      { field: '分区名称', required: '是', type: '字符串', example: '城东片区', desc: '分区的中文名称，不超过100字符。' },
      { field: '分区编码', required: '是', type: '字符串', example: 'ZONE-01', desc: '唯一编码标识，不能与系统已有编码重复。' },
      { field: '分区维度', required: '是', type: '数字字符串', example: '1', desc: '关联字典：water_zone_type（如：1代表行政营业分区，2代表DMA漏损等）。' },
      { field: '覆盖面积(k㎡)', required: '否', type: '小数', example: '15.5', desc: '分区的面积，单位为平方公里。' },
      { field: '服务人口', required: '否', type: '整数', example: '50000', desc: '该分区服务的总人口数。' },
      { field: '位置描述', required: '否', type: '字符串', example: '城东大道周边', desc: '详细地址或范围描述。' },
    ]);

    const sheet3 = workbook.addWorksheet('字典值参考');
    sheet3.columns = [
      { header: '字典类型', key: 'dictType', width: 25 },
      { header: '字典标签(展示值)', key: 'label', width: 20 },
      { header: '字典键值(填入值)', key: 'value', width: 20 },
    ];
    sheet3.addRows([
      { dictType: 'water_zone_type (分区维度)', label: '行政营业分区', value: '1' },
      { dictType: 'water_zone_type (分区维度)', label: 'DMA漏损分区', value: '2' },
      { dictType: 'water_zone_type (分区维度)', label: '控压高程分区', value: '3' },
      { dictType: 'water_zone_type (分区维度)', label: '供水调度分区', value: '4' },
    ]);

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
      .andWhere('zone.parentId = :parentId', { parentId: current.id })
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

    if (name) qb.andWhere('device.name LIKE :name', { name: `%${name}%` });
    if (code) qb.andWhere('device.code LIKE :code', { code: `%${code}%` });
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

    const codes = dataList.map(item => item.code || item['设备编码']).filter(Boolean);
    const existingDevices = codes.length > 0 
      ? await this.deviceRep.find({ where: { code: In(codes), delFlag: '0' } }) 
      : [];
    const deviceMap = new Map(existingDevices.map(d => [d.code, d]));

    const updateIds = [];

    for (const item of dataList) {
      const code = item.code || item['设备编码'];
      if (!code) {
        failCount++;
        results.push({ code: '未知', success: false, reason: '缺少设备编码' });
        continue;
      }

      const device = deviceMap.get(code);
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

      updateIds.push(device.id);
      successCount++;
      results.push({ code, success: true, reason: '关联成功' });
    }

    if (updateIds.length > 0) {
      const batchSize = 500;
      for (let i = 0; i < updateIds.length; i += batchSize) {
        await this.deviceRep.update({ id: In(updateIds.slice(i, i + batchSize)) }, { zoneCode });
      }
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

    if (name) qb.andWhere('user.userName LIKE :name', { name: `%${name}%` });
    if (userNo) qb.andWhere('user.userNo LIKE :userNo', { userNo: `%${userNo}%` });
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

    const userNos = dataList.map(item => item.userNo || item['用户编号']).filter(Boolean);
    const existingUsers = userNos.length > 0 
      ? await this.revenueUserRep.find({ where: { userNo: In(userNos), delFlag: '0' } }) 
      : [];
    const userMap = new Map(existingUsers.map(u => [u.userNo, u]));

    const updateIds = [];

    for (const item of dataList) {
      const userNo = item.userNo || item['用户编号'];
      if (!userNo) {
        failCount++;
        results.push({ userNo: '未知', success: false, reason: '缺少用户编号' });
        continue;
      }

      const user = userMap.get(userNo);
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

      updateIds.push(user.id);
      successCount++;
      results.push({ userNo, success: true, reason: '关联成功' });
    }

    if (updateIds.length > 0) {
      const batchSize = 500;
      for (let i = 0; i < updateIds.length; i += batchSize) {
        await this.revenueUserRep.update({ id: In(updateIds.slice(i, i + batchSize)) }, { zoneCode });
      }
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

  // ================= 全局批量导入关联 =================

  async globalBindDeviceTemplate(res: Response) {
    const workbook = new exceljs.Workbook();
    const worksheet = workbook.addWorksheet('全局设备与指标关联模板');
    worksheet.columns = [
      { header: '分区编码(必填)', key: 'zoneCode', width: 25 },
      { header: '设备编码(必填)', key: 'deviceCode', width: 25 },
      { header: '测点编码(选填)', key: 'pointCode', width: 25 },
      { header: '指标类型(选填: water_supply/min_flow)', key: 'metricType', width: 35 },
      { header: '计算符号(选填: 1进水/-1出水)', key: 'calcSign', width: 30 },
    ];
    worksheet.addRow({ zoneCode: 'ZONE_001', deviceCode: 'DEV_001', pointCode: 'PT_001_TOTAL', metricType: 'water_supply', calcSign: 1 });
    worksheet.addRow({ zoneCode: 'ZONE_001', deviceCode: 'DEV_001', pointCode: '', metricType: '', calcSign: '' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=GlobalBindDeviceAndMetricTemplate.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  }

  async globalBindRevenueTemplate(res: Response) {
    const workbook = new exceljs.Workbook();
    const worksheet = workbook.addWorksheet('全局营收关联模板');
    worksheet.columns = [
      { header: '分区编码', key: 'zoneCode', width: 30 },
      { header: '用户编号', key: 'userNo', width: 30 },
    ];
    worksheet.addRow({ zoneCode: 'ZONE_001', userNo: 'U0001' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=GlobalBindRevenueTemplate.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  }

  async globalImportBindDevices(dataList: any[]) {
    let successCount = 0;
    let failCount = 0;
    const results = [];

    // 用于记录已经被处理过的物理绑定，避免重复绑定（多行合并的情况）
    const processedDeviceBindings = new Set<string>();
    const processedStationBindings = new Set<string>();

    for (const item of dataList) {
      const zoneCode = String(item.zoneCode ?? item['分区编码(必填)'] ?? item['分区编码'] ?? '').trim();
      const deviceCode = String(item.deviceCode ?? item['设备编码(必填)'] ?? item['设备编码'] ?? '').trim();
      const pointCode = String(item.pointCode ?? item['测点编码(选填)'] ?? item['测点编码'] ?? '').trim();
      const metricType = String(item.metricType ?? item['指标类型(选填: water_supply/min_flow)'] ?? item['指标类型(water_supply/min_flow)'] ?? item['指标类型'] ?? '').trim();
      const calcSignRaw = item.calcSign !== undefined
        ? item.calcSign
        : (item['计算符号(选填: 1进水/-1出水)'] ?? item['计算符号(选填: -1进水/--1出水)'] ?? item['计算符号(1为进水/-1为出水)'] ?? item['计算符号']);
      const calcSignStr = calcSignRaw === undefined || calcSignRaw === null ? '' : String(calcSignRaw).trim();

      if (!zoneCode || !deviceCode) {
        failCount++;
        results.push({ code: deviceCode || '未知', success: false, reason: '缺少分区编码或设备编码' });
        continue;
      }

      const zone = await this.zoneRep.findOne({ where: { code: zoneCode, delFlag: '0' } });
      if (!zone) {
        failCount++;
        results.push({ code: deviceCode, success: false, reason: `分区编码(${zoneCode})不存在` });
        continue;
      }

      const device = await this.deviceRep.findOne({ where: { code: deviceCode, delFlag: '0' } });
      if (!device) {
        failCount++;
        results.push({ code: deviceCode, success: false, reason: '设备编码不存在' });
        continue;
      }

      // 步骤1：物理绑定 (如果同一设备在多行出现，只执行一次 Update)
      const bindKey = `${zoneCode}_${deviceCode}`;
      if (!processedDeviceBindings.has(bindKey)) {
        await this.deviceRep.update(device.id, { zoneCode });
        processedDeviceBindings.add(bindKey);

        const stationCode = String((device as any).stationCode ?? '').trim();
        if (stationCode) {
          const stationBindKey = `${zoneCode}_${stationCode}`;
          if (!processedStationBindings.has(stationBindKey)) {
            await this.stationRep.update({ code: stationCode, delFlag: '0' } as any, { zoneCode } as any);
            processedStationBindings.add(stationBindKey);
          }
        }
      }

      // 步骤2：逻辑指标计算绑定 (选填)
      let metricReason = '';
      if (pointCode && metricType && calcSignStr) {
        const calcSign = Number(calcSignStr);
        if (calcSign !== 1 && calcSign !== -1) {
          failCount++;
          results.push({ code: pointCode, success: false, reason: `测点(${pointCode})配置失败: 计算符号必须为 1 或 -1` });
          continue;
        }

        const point = await this.pointRep.findOne({ where: { code: pointCode, delFlag: '0' } });
        if (!point) {
          failCount++;
          results.push({ code: pointCode, success: false, reason: `测点编码(${pointCode})不存在` });
          continue;
        }
        if (point.deviceCode !== deviceCode) {
          failCount++;
          results.push({ code: pointCode, success: false, reason: `测点(${pointCode})不属于设备(${deviceCode})` });
          continue;
        }

        // Upsert 逻辑
        const exist = await this.metricCalcRep.findOne({ where: { zoneCode, metricType, pointCode, delFlag: '0' as any } as any });
        if (exist) {
          await this.metricCalcRep.update(exist.id, { calcSign });
        } else {
          const entity = new WaterZoneMetricCalcEntity();
          entity.zoneCode = zoneCode;
          entity.metricType = metricType;
          entity.pointCode = pointCode;
          entity.calcSign = calcSign;
          await this.metricCalcRep.save(entity);
        }
        metricReason = ` + 指标测点(${pointCode})配置成功`;
      }

      successCount++;
      results.push({ code: deviceCode, success: true, reason: `设备绑定成功${metricReason}` });
    }

    return ResultData.ok({ successCount, failCount, results });
  }

  async globalImportBindRevenueUsers(dataList: any[]) {
    let successCount = 0;
    let failCount = 0;
    const results = [];

    const zoneCodes = dataList.map(item => item.zoneCode || item['分区编码']).filter(Boolean);
    const userNos = dataList.map(item => item.userNo || item['用户编号']).filter(Boolean);

    const zones = zoneCodes.length > 0 ? await this.zoneRep.find({ where: { code: In(zoneCodes), delFlag: '0' } }) : [];
    const users = userNos.length > 0 ? await this.revenueUserRep.find({ where: { userNo: In(userNos), delFlag: '0' } }) : [];

    const zoneMap = new Map(zones.map(z => [z.code, z]));
    const userMap = new Map(users.map(u => [u.userNo, u]));

    const updates = new Map();

    for (const item of dataList) {
      const zoneCode = item.zoneCode || item['分区编码'];
      const userNo = item.userNo || item['用户编号'];

      if (!zoneCode || !userNo) {
        failCount++;
        results.push({ code: userNo || '未知', success: false, reason: '缺少分区编码或用户编号' });
        continue;
      }

      const zone = zoneMap.get(zoneCode);
      if (!zone) {
        failCount++;
        results.push({ code: userNo, success: false, reason: `分区编码(${zoneCode})不存在` });
        continue;
      }

      const user = userMap.get(userNo);
      if (!user) {
        failCount++;
        results.push({ code: userNo, success: false, reason: '用户编号不存在' });
        continue;
      }

      if (!updates.has(zoneCode)) updates.set(zoneCode, []);
      updates.get(zoneCode).push(user.id);

      successCount++;
      results.push({ code: userNo, success: true, reason: '关联成功' });
    }

    for (const [zCode, uIds] of updates.entries()) {
      const batchSize = 500;
      for (let i = 0; i < uIds.length; i += batchSize) {
        await this.revenueUserRep.update({ id: In(uIds.slice(i, i + batchSize)) }, { zoneCode: zCode });
      }
    }

    return ResultData.ok({ successCount, failCount, results });
  }

  async globalBindMetricTemplate(res: Response) {
    const workbook = new exceljs.Workbook();
    const worksheet = workbook.addWorksheet('全局指标配置模板');
    worksheet.columns = [
      { header: '分区编码', key: 'zoneCode', width: 25 },
      { header: '指标类型(water_supply/min_flow)', key: 'metricType', width: 30 },
      { header: '测点编码', key: 'pointCode', width: 25 },
      { header: '计算符号(1为进水/-1为出水)', key: 'calcSign', width: 25 },
    ];
    worksheet.addRow({ zoneCode: 'ZONE_001', metricType: 'water_supply', pointCode: 'PT_001', calcSign: 1 });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=GlobalBindMetricTemplate.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  }

  async globalImportBindMetrics(dataList: any[]) {
    let successCount = 0;
    let failCount = 0;
    const results = [];

    const zoneCodes = dataList.map(item => item.zoneCode || item['分区编码']).filter(Boolean);
    const pointCodes = dataList.map(item => item.pointCode || item['测点编码']).filter(Boolean);

    const zones = zoneCodes.length > 0 ? await this.zoneRep.find({ where: { code: In(zoneCodes), delFlag: '0' } }) : [];
    const points = pointCodes.length > 0 ? await this.pointRep.find({ where: { code: In(pointCodes), delFlag: '0' } }) : [];

    const zoneMap = new Map(zones.map(z => [z.code, z]));
    const pointMap = new Map(points.map(p => [p.code, p]));

    const metricCalcUpserts = [];

    for (const item of dataList) {
      const zoneCode = item.zoneCode || item['分区编码'];
      const metricType = item.metricType || item['指标类型(water_supply/min_flow)'];
      const pointCode = item.pointCode || item['测点编码'];
      const calcSignStr = item.calcSign !== undefined ? item.calcSign : item['计算符号(1为进水/-1为出水)'];

      if (!zoneCode || !metricType || !pointCode || calcSignStr === undefined || calcSignStr === null) {
        failCount++;
        results.push({ code: pointCode || '未知', success: false, reason: '缺少必填字段' });
        continue;
      }

      const calcSign = Number(calcSignStr);
      if (calcSign !== 1 && calcSign !== -1) {
        failCount++;
        results.push({ code: pointCode, success: false, reason: '计算符号必须为 1 或 -1' });
        continue;
      }

      // 校验分区
      const zone = zoneMap.get(zoneCode);
      if (!zone) {
        failCount++;
        results.push({ code: pointCode, success: false, reason: `分区编码(${zoneCode})不存在` });
        continue;
      }

      // 校验测点
      const point = pointMap.get(pointCode);
      if (!point) {
        failCount++;
        results.push({ code: pointCode, success: false, reason: `测点编码(${pointCode})不存在` });
        continue;
      }

      metricCalcUpserts.push({
        zoneCode,
        metricType,
        pointCode,
        calcSign,
      });
      
      successCount++;
      results.push({ code: pointCode, success: true, reason: '配置成功' });
    }

    if (metricCalcUpserts.length > 0) {
      const batchSize = 500;
      for (let i = 0; i < metricCalcUpserts.length; i += batchSize) {
        const chunk = metricCalcUpserts.slice(i, i + batchSize);
        // 逐条精确删除配对记录，避免 IN + IN 笛卡尔积误删
        for (const item of chunk) {
          await this.metricCalcRep.delete({ zoneCode: item.zoneCode, pointCode: item.pointCode });
        }
        await this.metricCalcRep.insert(chunk);
      }
    }

    return ResultData.ok({ successCount, failCount, results });
  }

  // ================= 指标计算配置接口 =================

  async getMetricCalcTree(zoneCode: string) {
    // 1. 找到该分区下的所有设备
    const devices = await this.deviceRep.find({
      where: { zoneCode, delFlag: '0' },
      select: ['code', 'name', 'type', 'id', 'stationCode']
    });

    if (devices.length === 0) {
      return ResultData.ok([]);
    }

    const deviceCodes = devices.map(d => d.code);
    const stationCodes = Array.from(new Set(devices.map(d => (d as any).stationCode).filter(Boolean)));

    const stations = stationCodes.length > 0
      ? await this.stationRep.find({ where: { code: In(stationCodes), delFlag: '0' }, select: ['code', 'name', 'type', 'id'] })
      : [];
    const stationMap = new Map(stations.map(s => [s.code, s]));

    // 2. 找到这些设备下的所有测点
    const points = await this.pointRep.find({
      where: { deviceCode: In(deviceCodes), delFlag: '0' },
      select: ['code', 'name', 'deviceCode', 'type', 'dataType', 'id']
    });

    const pointByDevice = new Map<string, any[]>();
    for (const p of points) {
      const list = pointByDevice.get(p.deviceCode) || [];
      list.push(p);
      pointByDevice.set(p.deviceCode, list);
    }

    const deviceNodes = devices.map(device => {
      const children = (pointByDevice.get(device.code) || []).map(p => ({
        id: `point_${p.code}`,
        label: p.name,
        code: p.code,
        type: p.type,
        isPoint: true
      }));

      return {
        id: `device_${device.code}`,
        label: device.name,
        code: device.code,
        type: device.type,
        isPoint: false,
        stationCode: (device as any).stationCode,
        children
      };
    });

    const deviceByStation = new Map<string, any[]>();
    const noStationDevices: any[] = [];
    for (const d of deviceNodes) {
      const stationCode = String(d.stationCode || '').trim();
      if (!stationCode) {
        noStationDevices.push(d);
        continue;
      }
      const list = deviceByStation.get(stationCode) || [];
      list.push(d);
      deviceByStation.set(stationCode, list);
    }

    const stationNodes = stations.map(station => ({
      id: `station_${station.code}`,
      label: station.name,
      code: station.code,
      type: station.type,
      isPoint: false,
      children: deviceByStation.get(station.code) || []
    }));

    if (noStationDevices.length > 0) {
      stationNodes.push({
        id: `station__unbound`,
        label: '未关联站点',
        code: '__unbound',
        type: 'UNBOUND',
        isPoint: false,
        children: noStationDevices
      } as any);
    }

    return ResultData.ok(stationNodes);
  }

  async getZoneMetricCalcConfig(zoneCode: string, metricType: string) {
    const configList = await this.metricCalcRep.find({
      where: { zoneCode, metricType }
    });
    
    // 补全测点名称
    const result = await Promise.all(configList.map(async (item) => {
      const point = await this.pointRep.findOne({ where: { code: item.pointCode } });
      return {
        ...item,
        pointName: point ? point.name : '未知测点'
      };
    }));

    return ResultData.ok(result);
  }

  async saveZoneMetricCalcConfig(body: { zoneCode: string; metricType: string; points: { pointCode: string; calcSign: number }[] }) {
    const { zoneCode, metricType, points } = body;
    
    // 先删除该分区该指标下的所有旧配置
    await this.metricCalcRep.delete({ zoneCode, metricType });

    // 批量插入新配置
    if (points && points.length > 0) {
      const entities = points.map(p => {
        const entity = new WaterZoneMetricCalcEntity();
        entity.zoneCode = zoneCode;
        entity.metricType = metricType;
        entity.pointCode = p.pointCode;
        entity.calcSign = p.calcSign;
        return entity;
      });
      await this.metricCalcRep.save(entities);
    }

    return ResultData.ok();
  }
}
