import { Controller, Post, Body, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { EngineService } from './engine.service';
import { RequirePermission } from '@app/common/decorators/require-premission.decorator';
import { NotRequireAuth } from '@app/common/decorators/user.decorator';
import { ResultData } from '@app/common/utils/result';

@ApiTags('报警引擎控制')
@Controller('alarm/engine')
export class EngineController {
  constructor(private readonly engineService: EngineService) {}

  @ApiOperation({ summary: '重载报警规则引擎（修改规则后调用，避免重启服务）' })
  @RequirePermission('alarm:rule:edit')
  @Post('reload')
  async reload() {
    try {
      await this.engineService.reloadEngine();
      return ResultData.ok(null, '报警引擎规则重载成功');
    } catch (e) {
      return ResultData.fail(500, `重载失败: ${e.message}`);
    }
  }

  @ApiOperation({ summary: '手动提交事实数据给报警引擎评估（用于测试或外部系统触发）' })
  @NotRequireAuth()
  @Post('evaluate')
  async evaluate(@Body() body: Record<string, any>) {
    if (!body || Object.keys(body).length === 0) {
      return ResultData.fail(400, '缺少 facts 数据');
    }
    // 兼容两种格式: { facts: {...}, targetType, targetKey } 或直接传 facts
    const targetType = body.targetType || 'device';
    const targetKey = body.targetKey;
    const facts = body.facts || body;
    // 清理元数据字段，避免污染 facts
    delete facts.targetType;
    delete facts.targetKey;
    delete facts.facts;

    try {
      await this.engineService.evaluate(facts, targetType, targetKey);
      return ResultData.ok(null, '事实已提交评估');
    } catch (e) {
      return ResultData.fail(500, `评估失败: ${e.message}`);
    }
  }

  @ApiOperation({ summary: '获取报警引擎状态' })
  @RequirePermission('alarm:rule:list')
  @Get('status')
  async status() {
    try {
      // 通过尝试评估一个空 facts 来检测引擎是否就绪
      await this.engineService.evaluate({ _ping: true });
      return ResultData.ok({ initialized: true, status: 'running' });
    } catch (e) {
      return ResultData.ok({ initialized: false, status: 'error', message: e.message });
    }
  }
}
