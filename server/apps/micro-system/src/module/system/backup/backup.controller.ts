import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { BackupService } from './backup.service';
import { RequirePermission } from '@app/common/decorators/require-premission.decorator';

@Controller('system/backup')
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Get('list')
  @RequirePermission('system:backup:list')
  async list() {
    const data = await this.backupService.listBackups();
    return { code: 200, data };
  }

  @Post('create')
  @RequirePermission('system:backup:create')
  async create() {
    await this.backupService.createBackup();
    return { code: 200, msg: '备份成功' };
  }

  @Post('restore')
  @RequirePermission('system:backup:restore')
  async restore(@Body('filename') filename: string) {
    await this.backupService.restoreBackup(filename);
    return { code: 200, msg: '恢复成功' };
  }

  @Delete(':filename')
  @RequirePermission('system:backup:remove')
  async remove(@Param('filename') filename: string) {
    await this.backupService.deleteBackup(filename);
    return { code: 200, msg: '删除成功' };
  }
}
