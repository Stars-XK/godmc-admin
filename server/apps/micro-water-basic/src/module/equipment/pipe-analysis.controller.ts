import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WaterPipeEntity } from '@app/common';
import { ResultData } from '@app/common/utils/result';

@ApiTags('管网分析')
@Controller('water-basic/pipe-analysis')
export class PipeAnalysisController {
  constructor(
    @InjectRepository(WaterPipeEntity)
    private readonly pipeRep: Repository<WaterPipeEntity>,
  ) {}

  @ApiOperation({ summary: '获取管网统计分析数据' })
  @Get('stats')
  async getStats() {
    const where = { delFlag: '0' };

    const [summary, byType, byMaterial, diameterRanges] = await Promise.all([
      this.pipeRep
        .createQueryBuilder('p')
        .select('COUNT(p.id)', 'totalCount')
        .addSelect('COALESCE(SUM(p.length), 0)', 'totalLength')
        .addSelect('COALESCE(AVG(p.diameter), 0)', 'avgDiameter')
        .where('p.delFlag = :delFlag', { delFlag: '0' })
        .getRawOne(),

      this.pipeRep
        .createQueryBuilder('p')
        .select('p.pipeType', 'type')
        .addSelect('COUNT(*)', 'count')
        .where('p.delFlag = :delFlag', { delFlag: '0' })
        .groupBy('p.pipeType')
        .getRawMany(),

      this.pipeRep
        .createQueryBuilder('p')
        .select('p.material', 'material')
        .addSelect('COUNT(*)', 'count')
        .where('p.delFlag = :delFlag', { delFlag: '0' })
        .groupBy('p.material')
        .getRawMany(),

      this.pipeRep
        .createQueryBuilder('p')
        .select(
          `CASE
            WHEN p.diameter < 100 THEN 'DN < 100'
            WHEN p.diameter >= 100 AND p.diameter < 200 THEN 'DN 100-200'
            WHEN p.diameter >= 200 AND p.diameter < 400 THEN 'DN 200-400'
            WHEN p.diameter >= 400 AND p.diameter < 800 THEN 'DN 400-800'
            ELSE 'DN >= 800'
          END`,
          'label',
        )
        .addSelect('COUNT(*)', 'count')
        .addSelect('COALESCE(SUM(p.length), 0)', 'length')
        .where('p.delFlag = :delFlag', { delFlag: '0' })
        .groupBy('label')
        .orderBy('MIN(p.diameter)', 'ASC')
        .getRawMany(),
    ]);

    const typeLabels: Record<string, string> = {
      WATER_SUPPLY: '供水', DRAINAGE: '排水', SEWAGE: '污水', RECLAIMED: '中水',
    };

    return ResultData.ok({
      totalCount: Number(summary?.totalCount) || 0,
      totalLength: (Number(summary?.totalLength) || 0).toFixed(2),
      avgDiameter: (Number(summary?.avgDiameter) || 0).toFixed(1),
      byType: (byType || []).map(r => ({ type: r.type, label: typeLabels[r.type] || r.type || '未知', count: Number(r.count) })),
      byMaterial: (byMaterial || []).map(r => ({ material: r.material || '未知', count: Number(r.count) })),
      diameterRanges: (diameterRanges || []).map(r => ({ label: r.label, count: Number(r.count), length: Number(r.length) })),
    });
  }
}
