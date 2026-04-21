import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResultData } from '@app/common/utils/result';
import { WaterZoneEntity } from '@app/common';
import { ListToTree } from '@app/common/utils/index';
import { Response } from 'express';
import { ExportTable } from '@app/common/utils/export';
import * as exceljs from 'exceljs';

@Injectable()
export class ZoneService {
  constructor(
    @InjectRepository(WaterZoneEntity)
    private readonly zoneRep: Repository<WaterZoneEntity>,
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
        select: ['ancestors', 'level'],
      });
      if (!parent) {
        return ResultData.fail(500, '父级分区不存在');
      }
      const ancestors = parent.ancestors ? `${parent.ancestors},${createDto.parentId}` : `${createDto.parentId}`;
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

    const isAdmin = user.roles?.some((r) => r.roleKey === 'admin' || r.roleId === 1);
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
    const isAdmin = user.roles?.some((r) => r.roleKey === 'admin' || r.roleId === 1);
    if (!isAdmin && user.deptId) {
      // 假设当前用户只能看本部门的数据
      entity.andWhere('zone.deptId = :deptId', { deptId: user.deptId });
    }

    const res = await entity.getMany();
    // 直接返回扁平数据，由前端 proxy.handleTree 处理为树形结构，避免属性丢失
    return ResultData.ok(res);
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
        select: ['ancestors', 'level'],
      });
      if (!parent) {
        return ResultData.fail(500, '父级分区不存在');
      }
      const ancestors = parent.ancestors ? `${parent.ancestors},${updateDto.parentId}` : `${updateDto.parentId}`;
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
      const parent = await this.zoneRep.findOne({
        where: { id: parentId, delFlag: '0' },
        select: ['ancestors', 'level'],
      });
      if (!parent) return ResultData.fail(500, '指定的父级分区不存在');
      parentLevel = parent.level;
      parentAncestors = parent.ancestors ? `${parent.ancestors},${parentId}` : `${parentId}`;
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
    const hasChild = await this.zoneRep.count({
      where: { parentId: id, delFlag: '0' },
    });
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
}
