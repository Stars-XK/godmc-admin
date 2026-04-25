import { Controller, Get, Post, Body, Put, Delete, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RuleService } from './rule.service';
import { SysAlarmRuleEntity } from '@app/common';
import { RequirePermission } from '@app/common/decorators/require-premission.decorator';
import { User, UserDto } from '@app/common/decorators/user.decorator';

@ApiTags('报警规则配置')
@Controller('alarm/rule')
export class RuleController {
  constructor(private readonly ruleService: RuleService) {}

  @ApiOperation({ summary: '获取报警规则列表' })
  @RequirePermission('alarm:rule:list')
  @Get('list')
  findAll(@Query() query: any) {
    return this.ruleService.findAll(query);
  }

  @ApiOperation({ summary: '获取报警规则详细信息' })
  @RequirePermission('alarm:rule:query')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ruleService.findOne(+id);
  }

  @ApiOperation({ summary: '新增报警规则' })
  @RequirePermission('alarm:rule:add')
  @Post()
  create(@Body() createDto: Partial<SysAlarmRuleEntity>, @User() user: UserDto) {
    return this.ruleService.create(createDto, user.user?.userName || '');
  }

  @ApiOperation({ summary: '修改报警规则' })
  @RequirePermission('alarm:rule:edit')
  @Put()
  update(@Body() updateDto: Partial<SysAlarmRuleEntity>, @User() user: UserDto) {
    return this.ruleService.update(updateDto.ruleId, updateDto, user.user?.userName || '');
  }

  @ApiOperation({ summary: '删除报警规则' })
  @RequirePermission('alarm:rule:remove')
  @Delete(':ids')
  remove(@Param('ids') ids: string) {
    const idArray = ids.split(',').map(id => +id);
    return this.ruleService.remove(idArray);
  }
}

