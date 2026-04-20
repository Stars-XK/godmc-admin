# Database Backup & Auto-Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement automated/manual MySQL database backups, restores, and automatic execution of SQL files in `server/db/`.

**Architecture:** We use Node's `child_process.exec` to run `mysqldump` and `mysql` CLI commands. Backup configuration lives in `sys_config`. A new table `sys_db_updates` tracks executed SQL files to ensure idempotency. Frontend adds a new Vue view for Backup Management.

**Tech Stack:** NestJS, TypeORM, Vue 3, Element Plus, MySQL CLI tools.

---

### Task 1: Create Initial Database Configurations in `sys_config`

**Files:**
- Create: `server/db/1.1.0-backup-config.sql`

- [ ] **Step 1: Write the initial configuration SQL file**

```sql
-- 1.1.0-backup-config.sql
INSERT INTO sys_config (config_name, config_key, config_value, config_type, remark, create_time)
VALUES
('数据库备份周期', 'sys.backup.cron', '0 0 2 * * *', 'Y', '备份任务的Cron表达式，默认每天凌晨2点', NOW()),
('数据库备份最大保留数量', 'sys.backup.limit', '30', 'Y', '超出该数量后自动删除最旧的备份文件', NOW()),
('数据库备份存储路径', 'sys.backup.path', '../upload/backups', 'Y', '备份文件存放的相对目录', NOW());

CREATE TABLE IF NOT EXISTS sys_db_updates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  filename VARCHAR(255) NOT NULL UNIQUE COMMENT 'SQL文件名',
  status VARCHAR(20) NOT NULL COMMENT '执行状态: SUCCESS/FAILED',
  error_msg TEXT COMMENT '失败时的错误信息',
  executed_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '执行时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='数据库自动更新记录表';
```

- [ ] **Step 2: Commit**
```bash
git add server/db/1.1.0-backup-config.sql
git commit -m "feat(db): add backup config keys and sys_db_updates table"
```

### Task 2: Implement Auto-SQL Executor in `micro-system`

**Files:**
- Create: `server/apps/micro-system/src/module/system/db-updater/db-update.entity.ts`
- Create: `server/apps/micro-system/src/module/system/db-updater/db-updater.service.ts`
- Create: `server/apps/micro-system/src/module/system/db-updater/db-updater.module.ts`
- Modify: `server/apps/micro-system/src/module/system/system.module.ts`

- [ ] **Step 1: Create Entity for `sys_db_updates`**
```typescript
// server/apps/micro-system/src/module/system/db-updater/db-update.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('sys_db_updates')
export class SysDbUpdateEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'filename', length: 255, unique: true })
  filename: string;

  @Column({ name: 'status', length: 20 })
  status: string;

  @Column({ name: 'error_msg', type: 'text', nullable: true })
  errorMsg: string;

  @CreateDateColumn({ name: 'executed_at' })
  executedAt: Date;
}
```

- [ ] **Step 2: Create DB Updater Service**
```typescript
// server/apps/micro-system/src/module/system/db-updater/db-updater.service.ts
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SysDbUpdateEntity } from './db-update.entity';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

@Injectable()
export class DbUpdaterService implements OnModuleInit {
  private readonly logger = new Logger(DbUpdaterService.name);

  constructor(
    @InjectRepository(SysDbUpdateEntity)
    private readonly dbUpdateRepo: Repository<SysDbUpdateEntity>,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.runPendingUpdates();
  }

  async runPendingUpdates() {
    const dbDir = path.resolve(process.cwd(), 'db');
    if (!fs.existsSync(dbDir)) return;

    const files = fs.readdirSync(dbDir)
      .filter(f => f.endsWith('.sql'))
      .sort(); // 确保按名称顺序执行

    const dbConfig = this.configService.get('db.mysql');

    for (const file of files) {
      const existing = await this.dbUpdateRepo.findOne({ where: { filename: file } });
      if (existing && existing.status === 'SUCCESS') {
        continue;
      }

      this.logger.log(`Executing new SQL file: ${file}`);
      const filePath = path.join(dbDir, file);
      
      try {
        const cmd = `mysql -h${dbConfig.host} -P${dbConfig.port} -u${dbConfig.username} -p${dbConfig.password} ${dbConfig.database} < "${filePath}"`;
        await execAsync(cmd);
        
        await this.dbUpdateRepo.save({
          filename: file,
          status: 'SUCCESS',
          errorMsg: null,
          executedAt: new Date()
        });
        this.logger.log(`Successfully executed ${file}`);
      } catch (error) {
        this.logger.error(`Failed to execute ${file}`, error.message);
        
        const record = existing || new SysDbUpdateEntity();
        record.filename = file;
        record.status = 'FAILED';
        record.errorMsg = error.message;
        record.executedAt = new Date();
        await this.dbUpdateRepo.save(record);
      }
    }
  }
}
```

- [ ] **Step 3: Create and Import Module**
```typescript
// server/apps/micro-system/src/module/system/db-updater/db-updater.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SysDbUpdateEntity } from './db-update.entity';
import { DbUpdaterService } from './db-updater.service';

@Module({
  imports: [TypeOrmModule.forFeature([SysDbUpdateEntity])],
  providers: [DbUpdaterService],
  exports: [DbUpdaterService]
})
export class DbUpdaterModule {}
```

- [ ] **Step 4: Register in `SystemModule`**
Modify `server/apps/micro-system/src/module/system/system.module.ts`:
Add `DbUpdaterModule` to the `imports` array.

- [ ] **Step 5: Commit**
```bash
git add server/apps/micro-system/src/module/system/db-updater server/apps/micro-system/src/module/system/system.module.ts
git commit -m "feat(system): implement automatic SQL file execution on startup"
```

### Task 3: Implement Backup/Restore Service Backend

**Files:**
- Create: `server/apps/micro-system/src/module/system/backup/backup.controller.ts`
- Create: `server/apps/micro-system/src/module/system/backup/backup.service.ts`
- Create: `server/apps/micro-system/src/module/system/backup/backup.module.ts`
- Modify: `server/apps/micro-system/src/module/system/system.module.ts`

- [ ] **Step 1: Create Backup Service**
```typescript
// server/apps/micro-system/src/module/system/backup/backup.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import { ConfigService as SysConfigService } from '../config/config.service';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as dayjs from 'dayjs';

const execAsync = promisify(exec);

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);

  constructor(
    private readonly nestConfig: NestConfigService,
    private readonly sysConfig: SysConfigService,
  ) {}

  private async getBackupPath() {
    const defaultPath = '../upload/backups';
    let configuredPath = await this.sysConfig.getConfigValue('sys.backup.path');
    if (!configuredPath) configuredPath = defaultPath;
    
    const absolutePath = path.resolve(process.cwd(), configuredPath);
    if (!fs.existsSync(absolutePath)) {
      fs.mkdirSync(absolutePath, { recursive: true });
    }
    return absolutePath;
  }

  async createBackup() {
    const dbConfig = this.nestConfig.get('db.mysql');
    const backupDir = await this.getBackupPath();
    const filename = `backup_${dayjs().format('YYYYMMDD_HHmmss')}.sql`;
    const filepath = path.join(backupDir, filename);

    const cmd = `mysqldump -h${dbConfig.host} -P${dbConfig.port} -u${dbConfig.username} -p${dbConfig.password} ${dbConfig.database} > "${filepath}"`;
    
    try {
      await execAsync(cmd);
      this.logger.log(`Backup created successfully: ${filepath}`);
      await this.cleanupOldBackups(backupDir);
      return { filename, path: filepath, size: fs.statSync(filepath).size };
    } catch (error) {
      this.logger.error('Backup failed', error.message);
      throw new Error(`备份失败: ${error.message}`);
    }
  }

  async restoreBackup(filename: string) {
    const dbConfig = this.nestConfig.get('db.mysql');
    const backupDir = await this.getBackupPath();
    const filepath = path.join(backupDir, filename);

    if (!fs.existsSync(filepath)) {
      throw new Error('备份文件不存在');
    }

    const cmd = `mysql -h${dbConfig.host} -P${dbConfig.port} -u${dbConfig.username} -p${dbConfig.password} ${dbConfig.database} < "${filepath}"`;
    
    try {
      await execAsync(cmd);
      this.logger.log(`Restore completed from: ${filepath}`);
      return true;
    } catch (error) {
      this.logger.error('Restore failed', error.message);
      throw new Error(`恢复失败: ${error.message}`);
    }
  }

  async listBackups() {
    const backupDir = await this.getBackupPath();
    const files = fs.readdirSync(backupDir).filter(f => f.endsWith('.sql'));
    
    return files.map(filename => {
      const stats = fs.statSync(path.join(backupDir, filename));
      return {
        filename,
        size: stats.size,
        createdAt: stats.birthtime
      };
    }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async deleteBackup(filename: string) {
    const backupDir = await this.getBackupPath();
    const filepath = path.join(backupDir, filename);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
    return true;
  }

  private async cleanupOldBackups(backupDir: string) {
    const limitStr = await this.sysConfig.getConfigValue('sys.backup.limit');
    const limit = parseInt(limitStr || '30', 10);
    
    const files = fs.readdirSync(backupDir)
      .filter(f => f.endsWith('.sql'))
      .map(name => ({
        name,
        time: fs.statSync(path.join(backupDir, name)).birthtime.getTime()
      }))
      .sort((a, b) => b.time - a.time);

    if (files.length > limit) {
      const toDelete = files.slice(limit);
      for (const file of toDelete) {
        fs.unlinkSync(path.join(backupDir, file.name));
        this.logger.log(`Auto-cleaned old backup: ${file.name}`);
      }
    }
  }
}
```

- [ ] **Step 2: Create Backup Controller**
```typescript
// server/apps/micro-system/src/module/system/backup/backup.controller.ts
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
```

- [ ] **Step 3: Create Module and Register**
```typescript
// server/apps/micro-system/src/module/system/backup/backup.module.ts
import { Module } from '@nestjs/common';
import { BackupController } from './backup.controller';
import { BackupService } from './backup.service';
import { SysConfigModule } from '../config/config.module';

@Module({
  imports: [SysConfigModule],
  controllers: [BackupController],
  providers: [BackupService],
  exports: [BackupService]
})
export class BackupModule {}
```
Modify `server/apps/micro-system/src/module/system/system.module.ts`:
Add `BackupModule` to imports.

- [ ] **Step 4: Update API Gateway to route to this controller**
Modify `server/apps/api-gateway/src/module/system/system.module.ts` (or equivalent routing if needed, though usually standard decorators handle this if micro-system handles its own routes via TCP, wait, Godmc usually exposes APIs via API Gateway controller -> Microservice, let's check how config is exposed).
*Self-correction: If it's a microservice architecture using `ClientsModule`, the Gateway needs a Controller. Since we want a simple approach, we'll build the controller in API Gateway and the logic in Micro-System, OR just build it in API Gateway directly if it's a monolithic-like gateway. Let's just put it in `micro-system` and use the gateway's standard HTTP routing if they share it, or add an API gateway controller.*
Actually, `nest-admin` (godmc) routes directly to the gateway. Let's put the Controller in `api-gateway` and service in `api-gateway` for simplicity, OR use TCP.
*Correction:* Look at `apps/api-gateway/src/module/system/config/config.controller.ts` in the project. It handles HTTP.
Let's place the HTTP Controller in `apps/api-gateway/src/module/system/backup/backup.controller.ts` and the `BackupService` in `apps/api-gateway/src/module/system/backup/backup.service.ts` to avoid TCP boilerplate for a simple script execution.

Let's revise **Step 1, 2, 3**: Place them in `server/apps/api-gateway/src/module/system/backup/`.
Modify `server/apps/api-gateway/src/module/system/system.module.ts` to import `BackupModule`.

- [ ] **Step 5: Commit**
```bash
git add server/apps/api-gateway/src/module/system/backup server/apps/api-gateway/src/module/system/system.module.ts
git commit -m "feat(gateway): add database backup and restore API endpoints"
```

### Task 4: Add Cron Job for Automated Backup

**Files:**
- Create: `server/apps/api-gateway/src/module/system/backup/backup.task.ts`
- Modify: `server/apps/api-gateway/src/module/system/backup/backup.module.ts`

- [ ] **Step 1: Create Backup Task**
```typescript
// server/apps/api-gateway/src/module/system/backup/backup.task.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';
import { BackupService } from './backup.service';
import { ConfigService as SysConfigService } from '../config/config.service';
import { CronJob } from 'cron';

@Injectable()
export class BackupTask {
  private readonly logger = new Logger(BackupTask.name);

  constructor(
    private readonly backupService: BackupService,
    private readonly sysConfig: SysConfigService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {
    this.initCron();
  }

  async initCron() {
    const cronExp = await this.sysConfig.getConfigValue('sys.backup.cron') || '0 0 2 * * *';
    const job = new CronJob(cronExp, async () => {
      this.logger.log('Starting automated database backup...');
      try {
        await this.backupService.createBackup();
      } catch (e) {
        this.logger.error('Automated backup failed', e);
      }
    });

    this.schedulerRegistry.addCronJob('database_backup', job);
    job.start();
    this.logger.log(`Automated backup job scheduled with cron: ${cronExp}`);
  }
}
```

- [ ] **Step 2: Add to Backup Module**
Update `BackupModule` providers to include `BackupTask` and import `ScheduleModule.forRoot()` if not already in `AppModule`. (It should be in AppModule).

- [ ] **Step 3: Commit**
```bash
git add server/apps/api-gateway/src/module/system/backup
git commit -m "feat(backup): schedule automated backups via cron"
```

### Task 5: Frontend - Backup Management View

**Files:**
- Create: `admin/src/api/system/backup.js`
- Create: `admin/src/views/system/backup/index.vue`
- Create: `admin/src/views/system/backup/components/BackupCard.vue` (Optional, or just a table)

- [ ] **Step 1: Create API functions**
```javascript
// admin/src/api/system/backup.js
import request from '@/utils/request'

export function listBackups() {
  return request({ url: '/system/backup/list', method: 'get' })
}

export function createBackup() {
  return request({ url: '/system/backup/create', method: 'post' })
}

export function restoreBackup(filename) {
  return request({ url: '/system/backup/restore', method: 'post', data: { filename } })
}

export function delBackup(filename) {
  return request({ url: '/system/backup/' + filename, method: 'delete' })
}
```

- [ ] **Step 2: Create View Component**
```vue
<!-- admin/src/views/system/backup/index.vue -->
<template>
  <div class="app-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>数据库备份管理</span>
          <el-button type="primary" @click="handleCreate" :loading="creating" v-hasPermi="['system:backup:create']">
            <el-icon><Download /></el-icon> 立即备份
          </el-button>
        </div>
      </template>

      <el-table v-loading="loading" :data="backupList" style="width: 100%">
        <el-table-column prop="filename" label="备份文件名" min-width="250" />
        <el-table-column prop="size" label="文件大小" width="150">
          <template #default="scope">
            {{ formatBytes(scope.row.size) }}
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="备份时间" width="200">
          <template #default="scope">
            {{ parseTime(scope.row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-button link type="warning" @click="handleRestore(scope.row)" v-hasPermi="['system:backup:restore']">
              <el-icon><RefreshLeft /></el-icon> 恢复
            </el-button>
            <el-button link type="danger" @click="handleDelete(scope.row)" v-hasPermi="['system:backup:remove']">
              <el-icon><Delete /></el-icon> 删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup name="Backup">
import { ref, onMounted, getCurrentInstance } from 'vue'
import { listBackups, createBackup, restoreBackup, delBackup } from '@/api/system/backup'

const { proxy } = getCurrentInstance()
const backupList = ref([])
const loading = ref(true)
const creating = ref(false)

function getList() {
  loading.value = true
  listBackups().then(res => {
    backupList.value = res.data
    loading.value = false
  })
}

function handleCreate() {
  creating.value = true
  createBackup().then(() => {
    proxy.$modal.msgSuccess('备份成功')
    getList()
  }).finally(() => {
    creating.value = false
  })
}

function handleRestore(row) {
  proxy.$modal.confirm('确认要恢复到备份文件 "' + row.filename + '" 吗？此操作将覆盖当前数据库数据，且不可逆！').then(() => {
    return restoreBackup(row.filename)
  }).then(() => {
    proxy.$modal.msgSuccess('数据恢复成功')
  }).catch(() => {})
}

function handleDelete(row) {
  proxy.$modal.confirm('确认要删除备份文件 "' + row.filename + '" 吗？').then(() => {
    return delBackup(row.filename)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess('删除成功')
  }).catch(() => {})
}

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

onMounted(() => {
  getList()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
```

- [ ] **Step 3: Commit**
```bash
git add admin/src/api/system/backup.js admin/src/views/system/backup
git commit -m "feat(admin): add backup management view"
```

### Task 6: Add SQL Menu Records (Optional / Manual DB Seed)
Insert menu items into the `sys_menu` table to ensure the "Backup Management" page appears in the sidebar. This can be done via `1.1.0-backup-config.sql` we created in Task 1, or by advising the user to add the menu manually.

- [ ] **Step 1: Append to `1.1.0-backup-config.sql`**
```sql
-- Insert Backup Menu
INSERT INTO sys_menu (menu_name, parent_id, order_num, path, component, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
VALUES
('备份管理', 1, 9, 'backup', 'system/backup/index', 1, 0, 'C', '0', '0', 'system:backup:list', 'server', 'admin', NOW(), '', NULL, '数据库备份管理菜单');

-- Add specific permissions
SET @parentId = LAST_INSERT_ID();
INSERT INTO sys_menu (menu_name, parent_id, order_num, path, component, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
VALUES
('创建备份', @parentId, 1, '', '', 1, 0, 'F', '0', '0', 'system:backup:create', '#', 'admin', NOW(), '', NULL, ''),
('恢复备份', @parentId, 2, '', '', 1, 0, 'F', '0', '0', 'system:backup:restore', '#', 'admin', NOW(), '', NULL, ''),
('删除备份', @parentId, 3, '', '', 1, 0, 'F', '0', '0', 'system:backup:remove', '#', 'admin', NOW(), '', NULL, '');
```

- [ ] **Step 2: Commit**
```bash
git add server/db/1.1.0-backup-config.sql
git commit -m "feat(db): add backup menu SQL inserts"
```

---
