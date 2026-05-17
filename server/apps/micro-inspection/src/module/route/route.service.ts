import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ResultData } from '@app/common/utils/result';
import { InspectionRouteEntity, InspectionCheckpointEntity, InspectionCheckItemEntity } from '@app/common';

@Injectable()
export class RouteService {
  constructor(
    @InjectRepository(InspectionRouteEntity)
    private readonly routeRep: Repository<InspectionRouteEntity>,
    @InjectRepository(InspectionCheckpointEntity)
    private readonly checkpointRep: Repository<InspectionCheckpointEntity>,
    @InjectRepository(InspectionCheckItemEntity)
    private readonly checkItemRep: Repository<InspectionCheckItemEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async create(createDto: any, user: any) {
    createDto.createBy = user.userName;
    if (createDto.checkpointOrder && Array.isArray(createDto.checkpointOrder)) {
      createDto.checkpointCount = createDto.checkpointOrder.length;
    }
    await this.routeRep.save(createDto);
    return ResultData.ok();
  }

  async findList(query: any) {
    const pageNum = Number(query.pageNum) || 1;
    const pageSize = Number(query.pageSize) || 10;
    const qb = this.routeRep.createQueryBuilder('r');
    qb.where('r.delFlag = :delFlag', { delFlag: '0' });

    if (query.routeName) qb.andWhere('r.routeName LIKE :routeName', { routeName: `%${query.routeName}%` });
    if (query.routeCode) qb.andWhere('r.routeCode = :routeCode', { routeCode: query.routeCode });
    if (query.deptId) qb.andWhere('r.deptId = :deptId', { deptId: query.deptId });

    qb.orderBy('r.sort', 'ASC').addOrderBy('r.createTime', 'DESC');

    const [list, total] = await qb.skip((pageNum - 1) * pageSize).take(pageSize).getManyAndCount();

    return ResultData.ok({ list, total });
  }

  async findOne(id: number) {
    const route = await this.routeRep.findOne({ where: { id, delFlag: '0' } });
    if (!route) {
      return ResultData.fail(500, '巡检路线不存在');
    }
    return ResultData.ok(route);
  }

  async update(updateDto: any, user: any) {
    updateDto.updateBy = user.userName;
    if (updateDto.checkpointOrder && Array.isArray(updateDto.checkpointOrder)) {
      updateDto.checkpointCount = updateDto.checkpointOrder.length;
    }
    await this.routeRep.update(updateDto.id, updateDto);
    return ResultData.ok();
  }

  async remove(id: number) {
    await this.routeRep.update(id, { delFlag: '1' });
    return ResultData.ok();
  }

  async findGeoJson(id: number) {
    const route = await this.routeRep.findOne({
      where: { id, delFlag: '0' },
      select: ['id', 'routeName', 'routeCode', 'routeGeom', 'checkpointOrder', 'geofenceRadius'],
    });
    if (!route) {
      return ResultData.fail(500, '巡检路线不存在');
    }
    let geojson = null;
    if (route.routeGeom) {
      try {
        geojson = JSON.parse(route.routeGeom);
      } catch {
        geojson = null;
      }
    }
    return ResultData.ok({
      id: route.id,
      routeName: route.routeName,
      routeCode: route.routeCode,
      geojson,
      checkpointOrder: route.checkpointOrder,
      geofenceRadius: route.geofenceRadius,
    });
  }

  async findDesign(id: number) {
    const route = await this.routeRep.findOne({ where: { id, delFlag: '0' } });
    if (!route) {
      return ResultData.fail(500, '巡检路线不存在');
    }

    const checkpointIds: number[] = route.checkpointOrder || [];
    const checkpoints = checkpointIds.length > 0
      ? await this.checkpointRep
          .createQueryBuilder('cp')
          .where('cp.id IN (:...ids)', { ids: checkpointIds })
          .andWhere('cp.delFlag = :delFlag', { delFlag: '0' })
          .orderBy(`FIELD(cp.id, ${checkpointIds.join(',')})`)
          .getMany()
      : [];

    const cpIds = checkpoints.map(cp => cp.id);
    const allItems = cpIds.length > 0
      ? await this.checkItemRep
          .createQueryBuilder('ci')
          .where('ci.checkpointId IN (:...cpIds)', { cpIds })
          .andWhere('ci.delFlag = :delFlag', { delFlag: '0' })
          .orderBy('ci.sortOrder', 'ASC')
          .getMany()
      : [];

    const itemsByCp = new Map<number, any[]>();
    for (const item of allItems) {
      const arr = itemsByCp.get(item.checkpointId) || [];
      arr.push(item);
      itemsByCp.set(item.checkpointId, arr);
    }

    const populatedCheckpoints = checkpoints.map(cp => ({
      ...cp,
      items: itemsByCp.get(cp.id) || [],
    }));

    return ResultData.ok({
      route,
      checkpoints: populatedCheckpoints,
    });
  }

  async saveDesign(dto: any, user: any) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const routeData = dto.route || {};
      routeData.updateBy = user.userName;

      // Save route
      let route: InspectionRouteEntity;
      if (routeData.id) {
        await queryRunner.manager.update(InspectionRouteEntity, routeData.id, routeData);
        route = await queryRunner.manager.findOne(InspectionRouteEntity, { where: { id: routeData.id, delFlag: '0' } });
      } else {
        routeData.createBy = user.userName;
        route = queryRunner.manager.create(InspectionRouteEntity, routeData);
        route = await queryRunner.manager.save(InspectionRouteEntity, route);
      }

      // Upsert checkpoints
      const incomingCheckpoints = dto.checkpoints || [];
      const savedCpIds: number[] = [];
      const incomingCpIds: number[] = incomingCheckpoints
        .filter((cp: any) => cp.id)
        .map((cp: any) => cp.id);

      for (let i = 0; i < incomingCheckpoints.length; i++) {
        const cp = incomingCheckpoints[i];
        cp.sortOrder = i;
        cp.updateBy = user.userName;

        let savedCp: any;
        if (cp.id) {
          await queryRunner.manager.update(InspectionCheckpointEntity, cp.id, cp);
          savedCp = await queryRunner.manager.findOne(InspectionCheckpointEntity, { where: { id: cp.id } });
        } else {
          cp.createBy = user.userName;
          const created = queryRunner.manager.create(InspectionCheckpointEntity, cp);
          savedCp = await queryRunner.manager.save(InspectionCheckpointEntity, created);
        }
        savedCpIds.push(savedCp.id);

        // Upsert check items
        const items = cp.items || [];
        const incomingItemIds: number[] = items
          .filter((item: any) => item.id)
          .map((item: any) => item.id);

        // Soft-delete items removed from this checkpoint
        if (incomingItemIds.length > 0) {
          await queryRunner.manager.update(
            InspectionCheckItemEntity,
            { checkpointId: savedCp.id, delFlag: '0' },
            { delFlag: '1' },
          );
        } else if (cp.id) {
          await queryRunner.manager.update(
            InspectionCheckItemEntity,
            { checkpointId: savedCp.id, delFlag: '0' },
            { delFlag: '1' },
          );
        }

        for (let j = 0; j < items.length; j++) {
          const item = items[j];
          item.checkpointId = savedCp.id;
          item.sortOrder = j;
          item.updateBy = user.userName;

          if (item.id) {
            await queryRunner.manager.update(InspectionCheckItemEntity, item.id, item);
          } else {
            item.createBy = user.userName;
            const createdItem = queryRunner.manager.create(InspectionCheckItemEntity, item);
            await queryRunner.manager.save(InspectionCheckItemEntity, createdItem);
          }
        }

        // Update checkpoint checkItemCount
        const itemCount = await queryRunner.manager.count(InspectionCheckItemEntity, {
          where: { checkpointId: savedCp.id, delFlag: '0' },
        });
        await queryRunner.manager.update(InspectionCheckpointEntity, savedCp.id, { checkItemCount: itemCount });
      }

      // Soft-delete checkpoints removed from the route (not in the new list)
      const oldCheckpointOrder: number[] = (await this.routeRep.findOne({
        where: { id: route.id, delFlag: '0' },
        select: ['checkpointOrder'],
      }))?.checkpointOrder || [];

      for (const oldCpId of oldCheckpointOrder) {
        if (!savedCpIds.includes(oldCpId)) {
          await queryRunner.manager.update(InspectionCheckpointEntity, oldCpId, { delFlag: '1' });
        }
      }

      // Update route with checkpointOrder and checkpointCount
      await queryRunner.manager.update(InspectionRouteEntity, route.id, {
        checkpointOrder: savedCpIds,
        checkpointCount: savedCpIds.length,
        updateBy: user.userName,
      });

      await queryRunner.commitTransaction();

      // Reload the saved route design
      return this.findDesign(route.id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async removeDesign(id: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const route = await queryRunner.manager.findOne(InspectionRouteEntity, {
        where: { id, delFlag: '0' },
      });
      if (!route) {
        await queryRunner.rollbackTransaction();
        return ResultData.fail(500, '巡检路线不存在');
      }

      // Soft-delete associated checkpoints
      const cpIds: number[] = route.checkpointOrder || [];
      if (cpIds.length > 0) {
        await queryRunner.manager
          .createQueryBuilder()
          .update(InspectionCheckItemEntity)
          .set({ delFlag: '1' as any })
          .where('checkpointId IN (:...cpIds)', { cpIds })
          .execute();

        await queryRunner.manager
          .createQueryBuilder()
          .update(InspectionCheckpointEntity)
          .set({ delFlag: '1' as any })
          .where('id IN (:...cpIds)', { cpIds })
          .execute();
      }

      await queryRunner.manager.update(InspectionRouteEntity, id, { delFlag: '1' });
      await queryRunner.commitTransaction();
      return ResultData.ok();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
