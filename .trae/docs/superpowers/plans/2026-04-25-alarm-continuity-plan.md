# Alarm Continuity (Debounce) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the stateful sliding window debounce mechanism for `micro-alarm` using Redis, and update the frontend UI to allow users to configure these settings natively.

**Architecture:** 
- The backend `EngineService` will inject `RedisService` to store the state of continuous rule triggers. It will listen to both `success` and `failure` events from `json-rules-engine` to manage (increment or clear) Redis state.
- The frontend `admin/src/views/alarm/rule/index.vue` will replace the raw JSON textarea for `ruleActions` with a set of visual form controls specifically designed for setting up the debounce mechanism (enabled, strategy, threshold).

**Tech Stack:** Vue 3, Element Plus, NestJS, `ioredis`, `json-rules-engine`

---

### Task 1: Frontend Rule Actions Config UI

**Files:**
- Modify: `admin/src/views/alarm/rule/index.vue`

- [ ] **Step 1: Replace raw textarea with visual form controls**
Find the `<el-form-item label="触发动作" prop="ruleActions">` block and replace it with the new visual controls for Debounce setup.

```vue
        <el-form-item label="报警动作设置" prop="ruleActions">
          <div style="border: 1px solid #ebeef5; padding: 16px; border-radius: 4px; width: 100%;">
            <el-form-item label="开启连续性防抖" label-width="120px">
              <el-switch v-model="form.ruleActions.debounce.enabled" />
              <span class="ml-2 text-gray-400 text-sm">（开启后可避免数据抖动导致的频繁误报）</span>
            </el-form-item>
            
            <template v-if="form.ruleActions.debounce.enabled">
              <el-form-item label="防抖策略" label-width="120px" class="mt-4">
                <el-radio-group v-model="form.ruleActions.debounce.strategy">
                  <el-radio-button label="count">连续触发次数</el-radio-button>
                  <el-radio-button label="time">持续异常时间</el-radio-button>
                </el-radio-group>
              </el-form-item>

              <el-form-item label="报警阈值" label-width="120px" class="mt-4">
                <el-input-number 
                  v-model="form.ruleActions.debounce.threshold" 
                  :min="1" 
                  :max="100" 
                  controls-position="right"
                />
                <span class="ml-2 text-gray-500">
                  {{ form.ruleActions.debounce.strategy === 'count' ? '次 (连续达到该次数才报警)' : '分钟 (持续异常达该时长才报警)' }}
                </span>
              </el-form-item>
            </template>
          </div>
        </el-form-item>
```

- [ ] **Step 2: Update script logic to initialize `ruleActions` correctly**
Remove `ruleActionsStr` computed property entirely. Ensure `reset()` and `handleUpdate()` correctly initialize `form.value.ruleActions.debounce`.

```javascript
// Replace `ruleActionsStr` and update reset/handleUpdate methods
function reset() {
  form.value = {
    ruleId: undefined,
    ruleName: undefined,
    ruleType: "1",
    ruleConditions: { all: [] },
    ruleActions: { 
      action: "notify",
      debounce: {
        enabled: false,
        strategy: "count",
        threshold: 3
      }
    },
    status: "0",
    remark: undefined
  };
  proxy.$refs["ruleRef"]?.resetFields();
}

function handleUpdate(row) {
  reset();
  const ruleId = row.ruleId || ids.value[0];
  getRule(ruleId).then(response => {
    form.value = response.data;
    if (typeof form.value.ruleConditions === 'string') {
      try {
        form.value.ruleConditions = JSON.parse(form.value.ruleConditions);
      } catch(e) {
        form.value.ruleConditions = { all: [] };
      }
    }
    if (typeof form.value.ruleActions === 'string') {
      try {
        form.value.ruleActions = JSON.parse(form.value.ruleActions);
      } catch(e) {
        form.value.ruleActions = { action: "notify" };
      }
    }
    
    // Ensure debounce object exists for older records
    if (!form.value.ruleActions.debounce) {
      form.value.ruleActions.debounce = {
        enabled: false,
        strategy: "count",
        threshold: 3
      };
    }
    
    open.value = true;
    title.value = "修改规则";
  });
}
```

- [ ] **Step 3: Commit**
```bash
git add admin/src/views/alarm/rule/index.vue
git commit -m "feat: replace raw JSON actions with visual debounce configuration UI"
```

---

### Task 2: Backend Redis Integration for EngineService

**Files:**
- Modify: `server/apps/micro-alarm/src/engine/engine.module.ts`
- Modify: `server/apps/micro-alarm/src/engine/engine.service.ts`

- [ ] **Step 1: Inject RedisModule into EngineModule**
Modify `engine.module.ts` to import `RedisModule` from `@app/shared`.

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SysAlarmRuleEntity, SysAlarmHistoryEntity } from '@app/common';
import { EngineService } from './engine.service';
import { RedisModule } from '@app/shared'; // NEW

@Module({
  imports: [
    TypeOrmModule.forFeature([SysAlarmRuleEntity, SysAlarmHistoryEntity]),
    RedisModule // NEW
  ],
  providers: [EngineService],
  exports: [EngineService],
})
export class EngineModule {}
```

- [ ] **Step 2: Update EngineService to handle Debounce logic on Success/Failure**
Modify `engine.service.ts` to use `RedisService` to track debounce state.

```typescript
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Engine } from 'json-rules-engine';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SysAlarmRuleEntity, SysAlarmHistoryEntity, RedisService } from '@app/common';

@Injectable()
export class EngineService implements OnModuleInit {
  private engine: Engine;
  private readonly logger = new Logger(EngineService.name);

  constructor(
    @InjectRepository(SysAlarmRuleEntity)
    private readonly ruleRep: Repository<SysAlarmRuleEntity>,
    @InjectRepository(SysAlarmHistoryEntity)
    private readonly historyRep: Repository<SysAlarmHistoryEntity>,
    private readonly redisService: RedisService // NEW
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
        const actions = typeof r.ruleActions === 'string' ? JSON.parse(r.ruleActions) : r.ruleActions;
        this.engine.addRule({
          conditions: conditions,
          event: {
            type: 'alarm_triggered',
            params: { ruleId: r.ruleId, ruleName: r.ruleName, ruleActions: actions }
          }
        });
      } catch (e) {
        this.logger.error(`Failed to load rule ${r.ruleId}`, e);
      }
    }

    // SUCCESS HANDLER (Rule Matched)
    this.engine.on('success', async (event, almanac, ruleResult) => {
      const actions = event?.params?.ruleActions || {};
      const debounce = actions.debounce;
      
      let deviceId = 'global';
      try { deviceId = await almanac.factValue('deviceId') || await almanac.factValue('zoneCode') || 'global'; } catch(e) {}
      
      let factValue = 'unknown';
      try { factValue = await almanac.factValue('value'); } catch(e) {}

      const ruleId = event?.params?.ruleId;
      
      if (debounce && debounce.enabled) {
        const threshold = debounce.threshold || 1;
        const now = Date.now();
        
        if (debounce.strategy === 'count') {
          const key = `alarm:window:${ruleId}:${deviceId}`;
          const eventId = `${now}-${Math.random().toString(36).substring(7)}`;
          await this.redisService.getClient().zadd(key, now, eventId);
          await this.redisService.getClient().expire(key, 3600); // 1 hour TTL
          
          const count = await this.redisService.getClient().zcard(key);
          if (count >= threshold) {
            await this.redisService.getClient().del(key); // Reset after trigger
            await this.fireAlarm(ruleId, event?.params?.ruleName, factValue);
          }
        } else if (debounce.strategy === 'time') {
          const key = `alarm:state:${ruleId}:${deviceId}`;
          const existingTime = await this.redisService.getClient().get(key);
          
          if (!existingTime) {
            await this.redisService.getClient().set(key, now, 'EX', threshold * 60 * 2); // 2x TTL
          } else {
            const diffMinutes = (now - parseInt(existingTime, 10)) / (1000 * 60);
            if (diffMinutes >= threshold) {
              await this.redisService.getClient().del(key); // Reset after trigger
              await this.fireAlarm(ruleId, event?.params?.ruleName, factValue);
            }
          }
        }
      } else {
        // Immediate alarm
        await this.fireAlarm(ruleId, event?.params?.ruleName, factValue);
      }
    });

    // FAILURE HANDLER (Rule Not Matched - Reset State)
    this.engine.on('failure', async (event, almanac, ruleResult) => {
      const actions = event?.params?.ruleActions || {};
      const debounce = actions.debounce;
      
      if (debounce && debounce.enabled) {
        let deviceId = 'global';
        try { deviceId = await almanac.factValue('deviceId') || await almanac.factValue('zoneCode') || 'global'; } catch(e) {}
        const ruleId = event?.params?.ruleId;
        
        if (debounce.strategy === 'count') {
          await this.redisService.getClient().del(`alarm:window:${ruleId}:${deviceId}`);
        } else if (debounce.strategy === 'time') {
          await this.redisService.getClient().del(`alarm:state:${ruleId}:${deviceId}`);
        }
      }
    });
  }

  private async fireAlarm(ruleId: number, ruleName: string, factValue: any) {
    this.logger.warn(`Alarm Triggered: ${ruleName}`);
    const history = this.historyRep.create({
      ruleId: ruleId,
      ruleName: ruleName,
      alarmLevel: '2',
      alarmContent: `触发报警规则: ${ruleName}, 当前检测值: ${factValue}`,
      alarmTime: new Date(),
      status: '0',
    });
    await this.historyRep.save(history);
  }

  async evaluate(facts: Record<string, any>) {
    if (!this.engine) return null;
    return this.engine.run(facts);
  }
}
```

- [ ] **Step 3: Update common exports if needed**
Make sure `RedisService` is exported from `@app/common` if it isn't already, or change the import path to `@app/shared`. 
*Note: In Step 2, I used `@app/common` to import RedisService but in Step 1 I used `@app/shared` to import RedisModule. `RedisModule` and `RedisService` are in `libs/shared/src/redis`. I will use `import { RedisService } from '@app/shared';` in Step 2 instead.*

```typescript
// Fix imports in engine.service.ts
import { RedisService } from '@app/shared';
// Remove RedisService from @app/common import
```

- [ ] **Step 4: Compile and test**
Run `npm run build micro-alarm` in `server` directory to ensure no compilation errors.

- [ ] **Step 5: Commit**
```bash
git add server/apps/micro-alarm/src/engine
git commit -m "feat: implement redis-based sliding window and time-state debounce for alarm rules"
```
````