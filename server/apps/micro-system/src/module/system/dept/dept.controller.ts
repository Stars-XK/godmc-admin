import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { DeptService } from './dept.service';

@Controller()
export class DeptController {
  constructor(private readonly deptService: DeptService) {}

  @MessagePattern('system.dept.create')
  create(@Payload() createDeptDto: any) {
    return this.deptService.create(createDeptDto);
  }

  @MessagePattern('system.dept.findAll')
  findAll(@Payload() query: any) {
    return this.deptService.findAll(query);
  }

  @MessagePattern('system.dept.findOne')
  findOne(@Payload() deptId: any) {
    return this.deptService.findOne(deptId);
  }

  @MessagePattern('system.dept.findDeptIdsByDataScope')
  findDeptIdsByDataScope(@Payload() payload: any) {
    return this.deptService.findDeptIdsByDataScope(payload.deptId, payload.dataScope);
  }

  @MessagePattern('system.dept.findListExclude')
  findListExclude(@Payload() id: any) {
    return this.deptService.findListExclude(id);
  }

  @MessagePattern('system.dept.update')
  update(@Payload() updateDeptDto: any) {
    return this.deptService.update(updateDeptDto);
  }

  @MessagePattern('system.dept.remove')
  remove(@Payload() deptId: any) {
    return this.deptService.remove(deptId);
  }

  @MessagePattern('system.dept.deptTree')
  deptTree() {
    return this.deptService.deptTree();
  }

}
