import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PhotoService } from './photo.service';
import { RequirePermission } from '@app/common/decorators/require-premission.decorator';

@ApiTags('巡检管理 - 照片管理')
@ApiBearerAuth()
@Controller('inspection/photo')
export class PhotoController {
  constructor(private readonly photoService: PhotoService) {}

  @ApiOperation({ summary: '查询照片列表' })
  @RequirePermission('inspection:photo:query')
  @Get('list')
  findList(@Query() query: any) {
    return this.photoService.findList(query);
  }
}
