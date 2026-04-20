import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResultData } from '@app/common/utils/result';
import { WaterZoneEntity } from '@app/common';
import { ListToTree } from '@app/common/utils/index';

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
    const tree = ListToTree(
      res,
      (m) => m.id,
      (m) => m.name,
    );
    return ResultData.ok(tree);
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

  async importData(dataList: any[], parentId: number, user: any) {
    if (!dataList || dataList.length === 0) return ResultData.ok();

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

    const insertData = dataList.map((item, index) => {
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
