import { ApiProperty } from '@nestjs/swagger';

export class ResolveHistoryDto {
  @ApiProperty({ description: '报警ID' })
  alarmId: number;

  @ApiProperty({ description: '处理备注', required: false })
  resolveRemark?: string;
}
