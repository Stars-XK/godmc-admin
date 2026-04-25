# Alarm Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the independent `micro-alarm` service with a `json-rules-engine` core, configure the database schemas, implement the global frontend silent fallback (Axios interceptor), and build the visual Rule Builder and Alarm History UI.

**Architecture:** 
1. **Frontend**: Vue 3 + Element Plus. Global Axios interceptor for 502/504 to prevent full-screen errors and instead show a silent right-bottom notification. Two new pages: Rule Builder and Alarm History.
2. **Database**: MySQL (`sys_alarm_rule`, `sys_alarm_history`) with associated dictionaries and menus.
3. **Backend**: NestJS microservice (`micro-alarm`) listening on port 3008, registered in API Gateway. Uses `json-rules-engine` for dynamic condition evaluation.

**Tech Stack:** Vue 3, Element Plus, NestJS, TypeORM, MySQL, Redis, `json-rules-engine`

---

### Task 1: Database Initialization & API Gateway Registration

**Files:**
- Modify: `server/db/init.sql`
- Modify: `server/apps/api-gateway/src/main.ts`

- [ ] **Step 1: Add Alarm tables to init.sql**
  Append the DDL for `sys_alarm_rule` and `sys_alarm_history` to `init.sql`.

```sql
-- 报警规则配置表
CREATE TABLE `sys_alarm_rule` (
  `rule_id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '规则ID',
  `rule_name` varchar(100) NOT NULL COMMENT '规则名称',
  `rule_type` varchar(2) DEFAULT '1' COMMENT '规则类型(1-设备 2-分区 3-系统)',
  `rule_conditions` json NOT NULL COMMENT '条件JSON',
  `rule_actions` json NOT NULL COMMENT '动作JSON',
  `status` char(1) DEFAULT '0' COMMENT '状态(0正常 1停用)',
  `create_by` varchar(64) DEFAULT '' COMMENT '创建者',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_by` varchar(64) DEFAULT '' COMMENT '更新者',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  `remark` varchar(500) DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`rule_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='报警规则配置表';

-- 报警历史记录表
CREATE TABLE `sys_alarm_history` (
  `alarm_id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '报警ID',
  `rule_id` bigint(20) NOT NULL COMMENT '规则ID',
  `rule_name` varchar(100) NOT NULL COMMENT '规则名称',
  `alarm_level` varchar(2) DEFAULT '3' COMMENT '报警级别(1-紧急 2-重要 3-次要 4-提示)',
  `alarm_content` varchar(500) NOT NULL COMMENT '报警内容',
  `alarm_time` datetime NOT NULL COMMENT '报警时间',
  `alarm_source` varchar(100) DEFAULT NULL COMMENT '报警源(如deviceCode或zoneCode)',
  `status` char(1) DEFAULT '0' COMMENT '状态(0未处理 1已处理)',
  `resolve_time` datetime DEFAULT NULL COMMENT '处理时间',
  `resolve_by` varchar(64) DEFAULT '' COMMENT '处理人',
  `resolve_remark` varchar(500) DEFAULT NULL COMMENT '处理备注',
  PRIMARY KEY (`alarm_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='报警历史记录表';
```

- [ ] **Step 2: Add initial dictionary data to init.sql**

```sql
INSERT INTO `sys_dict_type` (`dict_name`, `dict_type`, `status`, `create_by`, `create_time`, `remark`) VALUES ('报警规则类型', 'sys_alarm_rule_type', '0', 'admin', sysdate(), '报警规则类型列表');
INSERT INTO `sys_dict_type` (`dict_name`, `dict_type`, `status`, `create_by`, `create_time`, `remark`) VALUES ('报警级别', 'sys_alarm_level', '0', 'admin', sysdate(), '报警级别列表');
INSERT INTO `sys_dict_type` (`dict_name`, `dict_type`, `status`, `create_by`, `create_time`, `remark`) VALUES ('报警处理状态', 'sys_alarm_status', '0', 'admin', sysdate(), '报警处理状态列表');

INSERT INTO `sys_dict_data` (`dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `remark`) VALUES 
(1, '设备报警', '1', 'sys_alarm_rule_type', '', 'primary', 'Y', '0', 'admin', sysdate(), '设备报警'),
(2, '分区报警', '2', 'sys_alarm_rule_type', '', 'success', 'N', '0', 'admin', sysdate(), '分区报警'),
(3, '系统报警', '3', 'sys_alarm_rule_type', '', 'warning', 'N', '0', 'admin', sysdate(), '系统报警');

INSERT INTO `sys_dict_data` (`dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `remark`) VALUES 
(1, '紧急', '1', 'sys_alarm_level', '', 'danger', 'N', '0', 'admin', sysdate(), '紧急'),
(2, '重要', '2', 'sys_alarm_level', '', 'warning', 'N', '0', 'admin', sysdate(), '重要'),
(3, '次要', '3', 'sys_alarm_level', '', 'primary', 'Y', '0', 'admin', sysdate(), '次要'),
(4, '提示', '4', 'sys_alarm_level', '', 'info', 'N', '0', 'admin', sysdate(), '提示');

INSERT INTO `sys_dict_data` (`dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `remark`) VALUES 
(1, '未处理', '0', 'sys_alarm_status', '', 'danger', 'Y', '0', 'admin', sysdate(), '未处理'),
(2, '已处理', '1', 'sys_alarm_status', '', 'success', 'N', '0', 'admin', sysdate(), '已处理');
```

- [ ] **Step 3: Register API Gateway Route**
Modify `server/apps/api-gateway/src/main.ts`. Add `{ path: '/alarm', target: 'http://127.0.0.1:3008' }` to the `proxies` array.

- [ ] **Step 4: Commit**
```bash
git add server/db/init.sql server/apps/api-gateway/src/main.ts
git commit -m "feat: init alarm database tables and gateway route"
```

---

### Task 2: Global Frontend Silent Fallback (Axios Interceptor)

**Files:**
- Modify: `admin/src/utils/request.js`

- [ ] **Step 1: Modify Axios Response Interceptor**
In `admin/src/utils/request.js`, locate the `axios.interceptors.response.use` error handler. Intercept 502, 503, and 504 errors specifically for `/alarm/` and `/report/` paths.

```javascript
    let { message } = error;
    if (message == "Network Error") {
      message = "后端接口连接异常";
    } else if (message.includes("timeout")) {
      message = "系统接口请求超时";
    } else if (message.includes("Request failed with status code")) {
      const code = message.substr(message.length - 3);
      // NEW: Silent fallback for microservices (502/503/504)
      if (['502', '503', '504'].includes(code)) {
        const url = error.config?.url || '';
        if (url.includes('/alarm/') || url.includes('/report/') || url.includes('/data-integration/')) {
          ElNotification({
            title: '服务暂时离线',
            message: `相关服务模块当前离线或重启中，请稍后再试。`,
            type: 'warning',
            position: 'bottom-right',
            duration: 5000
          });
          // Return an empty success-like structure so the page doesn't crash/white-screen
          return Promise.resolve({ code: 200, data: [], rows: [], total: 0, msg: 'Service offline fallback' });
        }
      }
      message = "系统接口" + code + "异常";
    }
```

- [ ] **Step 2: Commit**
```bash
git add admin/src/utils/request.js
git commit -m "feat: add silent global fallback for offline microservices"
```

---

### Task 3: Scaffold `micro-alarm` Microservice

**Files:**
- Create directory: `server/apps/micro-alarm`
- Create: `server/apps/micro-alarm/package.json`
- Create: `server/apps/micro-alarm/tsconfig.app.json`

- [ ] **Step 1: Scaffold micro-alarm with Nest CLI**
```bash
cd server
nest generate app micro-alarm
```

- [ ] **Step 2: Install json-rules-engine**
```bash
cd server
npm install json-rules-engine
```

- [ ] **Step 3: Setup micro-alarm main.ts**
Modify `server/apps/micro-alarm/src/main.ts` to listen on port 3008, setup global pipes, filters, and Swagger, similar to `micro-data-integration`.

- [ ] **Step 4: Commit**
```bash
git add server/nest-cli.json server/package.json server/package-lock.json server/apps/micro-alarm
git commit -m "feat: scaffold micro-alarm service and add json-rules-engine"
```

---

### Task 4: Alarm Entities & Service Layer

**Files:**
- Create: `server/libs/common/src/entities/alarm/sys-alarm-rule.entity.ts`
- Create: `server/libs/common/src/entities/alarm/sys-alarm-history.entity.ts`
- Modify: `server/apps/micro-alarm/src/micro-alarm.module.ts`
- Create: `server/apps/micro-alarm/src/rule/rule.module.ts`
- Create: `server/apps/micro-alarm/src/rule/rule.service.ts`
- Create: `server/apps/micro-alarm/src/rule/rule.controller.ts`

- [ ] **Step 1: Create TypeORM Entities**
Define `SysAlarmRuleEntity` and `SysAlarmHistoryEntity` in the common library. Export them from `server/libs/common/src/index.ts`.

- [ ] **Step 2: Setup MicroAlarmModule**
Configure `TypeOrmModule`, `ConfigModule`, `JwtModule` in `micro-alarm.module.ts` (mirroring `micro-data-integration`). Import the new entities.

- [ ] **Step 3: Implement Rule CRUD Service**
Implement standard CRUD operations in `RuleService` and `RuleController` (create, update, delete, list, findOne). Ensure Swagger decorators are present.

- [ ] **Step 4: Commit**
```bash
git add server/libs/common/src/entities server/libs/common/src/index.ts server/apps/micro-alarm/src
git commit -m "feat: implement alarm entities and rule CRUD service"
```

---

### Task 5: The Rules Engine Core

**Files:**
- Create: `server/apps/micro-alarm/src/engine/engine.module.ts`
- Create: `server/apps/micro-alarm/src/engine/engine.service.ts`

- [ ] **Step 1: Implement EngineService**
Initialize `json-rules-engine` in `EngineService`.

```typescript
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Engine } from 'json-rules-engine';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SysAlarmRuleEntity, SysAlarmHistoryEntity } from '@app/common';

@Injectable()
export class EngineService implements OnModuleInit {
  private engine: Engine;
  private readonly logger = new Logger(EngineService.name);

  constructor(
    @InjectRepository(SysAlarmRuleEntity)
    private readonly ruleRep: Repository<SysAlarmRuleEntity>,
    @InjectRepository(SysAlarmHistoryEntity)
    private readonly historyRep: Repository<SysAlarmHistoryEntity>,
  ) {}

  async onModuleInit() {
    await this.reloadEngine();
  }

  async reloadEngine() {
    this.engine = new Engine();
    const rules = await this.ruleRep.find({ where: { status: '0' } });
    
    for (const r of rules) {
      try {
        const conditions = typeof r.ruleConditions === 'string' ? JSON.parse(r.ruleConditions) : r.ruleConditions;
        this.engine.addRule({
          conditions: conditions,
          event: {
            type: 'alarm_triggered',
            params: { ruleId: r.ruleId, ruleName: r.ruleName, ruleActions: r.ruleActions }
          }
        });
      } catch (e) {
        this.logger.error(`Failed to load rule ${r.ruleId}`, e);
      }
    }

    this.engine.on('success', async (event, almanac, ruleResult) => {
      this.logger.warn(`Alarm Triggered: ${event.params.ruleName}`);
      // In production, evaluate facts to generate alarmContent dynamically
      const factValue = await almanac.factValue('value');
      
      const history = this.historyRep.create({
        ruleId: event.params.ruleId,
        ruleName: event.params.ruleName,
        alarmLevel: '2', // Default to important for now
        alarmContent: `触发报警规则: ${event.params.ruleName}, 当前检测值: ${factValue}`,
        alarmTime: new Date(),
        status: '0',
      });
      await this.historyRep.save(history);
      // TODO: Push to Frontend via WebSocket
    });
  }

  async evaluate(facts: Record<string, any>) {
    return this.engine.run(facts);
  }
}
```

- [ ] **Step 2: Commit**
```bash
git add server/apps/micro-alarm/src/engine
git commit -m "feat: implement json-rules-engine core for micro-alarm"
```

---

### Task 6: Frontend Rule Builder UI

**Files:**
- Create: `admin/src/api/alarm/rule.js`
- Create: `admin/src/views/alarm/rule/index.vue`
- Create: `admin/src/views/alarm/rule/components/RuleBuilder.vue`

- [ ] **Step 1: Create API functions**
In `admin/src/api/alarm/rule.js`, define `listRule`, `getRule`, `addRule`, `updateRule`, `delRule`.

- [ ] **Step 2: Create RuleBuilder Component**
Build a recursive Vue component that outputs `json-rules-engine` compatible JSON.
```vue
<template>
  <div class="rule-builder">
    <el-card shadow="never" class="condition-group">
      <div class="group-header">
        <el-radio-group v-model="localConditions.operator" size="small">
          <el-radio-button label="all">且 (AND)</el-radio-button>
          <el-radio-button label="any">或 (OR)</el-radio-button>
        </el-radio-group>
        <el-button type="primary" link icon="Plus" @click="addCondition">添加条件</el-button>
      </div>
      <!-- List conditions (fact, operator, value) -->
      <!-- ... -->
    </el-card>
  </div>
</template>
```

- [ ] **Step 3: Create Rule List View**
Standard Element Plus CRUD table in `index.vue` that lists rules, allows opening a dialog to use `RuleBuilder.vue` to edit `ruleConditions` and save to backend.

- [ ] **Step 4: Commit**
```bash
git add admin/src/api/alarm admin/src/views/alarm/rule
git commit -m "feat: implement frontend visual rule builder UI"
```

---

### Task 7: Frontend Alarm History UI

**Files:**
- Create: `admin/src/api/alarm/history.js`
- Create: `admin/src/views/alarm/history/index.vue`

- [ ] **Step 1: Create API functions**
In `admin/src/api/alarm/history.js`, define `listHistory`, `resolveHistory`.

- [ ] **Step 2: Create History View**
Standard Element Plus table showing `sys_alarm_history`. Include a "处理" (Resolve) button that opens a dialog to input `resolve_remark` and updates the status to '1'.

- [ ] **Step 3: Register Menus in Database**
Provide SQL to add the Alarm menus to the database so they show up in the sidebar.

```sql
-- Insert into sys_menu (assume parent_id = 0 for top level "报警中心")
-- Then insert Rule and History under it.
```

- [ ] **Step 4: Commit**
```bash
git add admin/src/api/alarm admin/src/views/alarm/history
git commit -m "feat: implement alarm history UI and menus"
```
