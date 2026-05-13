<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="规则名称" prop="ruleName">
        <el-input
          v-model="queryParams.ruleName"
          placeholder="请输入规则名称"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="规则类型" prop="ruleType">
        <el-select v-model="queryParams.ruleType" placeholder="请选择规则类型" clearable>
          <el-option
            v-for="dict in sys_alarm_rule_type"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
          <el-option label="正常" value="0" />
          <el-option label="停用" value="1" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="Plus"
          @click="handleAdd"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5" style="float: right; margin-right: 10px;">
        <el-button
          type="warning"
          plain
          icon="QuestionFilled"
          @click="openHelp = true"
        >报警说明</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="ruleList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="规则ID" align="center" prop="ruleId" />
      <el-table-column label="规则名称" align="center" prop="ruleName" />
      <el-table-column label="规则类型" align="center" prop="ruleType">
        <template #default="scope">
          <dict-tag :options="sys_alarm_rule_type" :value="scope.row.ruleType" />
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status">
        <template #default="scope">
          <el-tag :type="scope.row.status === '0' ? 'success' : 'danger'">
            {{ scope.row.status === '0' ? '正常' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" prop="createTime" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total > 0"
      :total="total"
      v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 添加或修改规则对话框 -->
    <el-dialog :title="title" v-model="open" width="1050px" top="5vh" append-to-body class="rule-dialog" destroy-on-close>
      <div class="dialog-scroll">
      <el-form ref="ruleRef" :model="form" :rules="rules" label-width="90px" class="rule-form">
        <!-- 基本信息卡片 -->
        <div class="form-card">
          <div class="card-header">
            <span class="card-dot"></span>
            <el-icon class="card-icon"><Document /></el-icon>
            <span class="card-title">基本信息</span>
          </div>
          <div class="card-body">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="规则名称" prop="ruleName">
                  <el-input v-model="form.ruleName" placeholder="请输入规则名称" clearable />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="规则类型" prop="ruleType">
                  <el-select v-model="form.ruleType" placeholder="请选择规则类型" class="w-full" @change="onRuleTypeChange">
                    <el-option
                      v-for="dict in sys_alarm_rule_type"
                      :key="dict.value"
                      :label="dict.label"
                      :value="dict.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
          </div>
        </div>

        <!-- 作用域卡片 -->
        <div class="form-card">
          <div class="card-header">
            <span class="card-dot dot-purple"></span>
            <el-icon class="card-icon"><Aim /></el-icon>
            <span class="card-title">作用范围</span>
            <el-tag size="small" type="info" class="ml-2">决定规则对哪些设备/分区生效</el-tag>
          </div>
          <div class="card-body">
            <el-row :gutter="20">
              <el-col :span="form.scopeType === 'all_devices' || form.scopeType === 'all_zones' ? 24 : 12">
                <el-form-item label="作用域类型" prop="scopeType">
                  <el-select v-model="form.scopeType" placeholder="请选择作用域" class="w-full">
                    <el-option
                      v-for="opt in scopeTypeOptions"
                      :key="opt.value"
                      :label="opt.label"
                      :value="opt.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12" v-if="form.scopeType !== 'all_devices' && form.scopeType !== 'all_zones'">
                <el-form-item label="作用域值" prop="scopeValue">
                  <el-input v-model="form.scopeValue" :placeholder="scopeValuePlaceholder" clearable />
                </el-form-item>
              </el-col>
            </el-row>
            <div class="scope-hint" v-if="scopeValueHint">
              <el-icon><InfoFilled /></el-icon>
              <span>{{ scopeValueHint }}</span>
            </div>
          </div>
        </div>

        <!-- 触发条件卡片 -->
        <div class="form-card">
          <div class="card-header">
            <span class="card-dot dot-green"></span>
            <el-icon class="card-icon"><Filter /></el-icon>
            <span class="card-title">触发条件</span>
            <el-tag size="small" type="warning" class="ml-2">核心配置</el-tag>
          </div>
          <div class="card-body">
            <el-form-item label-width="0" prop="ruleConditions" class="conditions-item">
              <rule-builder v-model="form.ruleConditions" />
            </el-form-item>
          </div>
        </div>

        <!-- 防抖设置卡片 -->
        <div class="form-card">
          <div class="card-header">
            <span class="card-dot dot-orange"></span>
            <el-icon class="card-icon"><BellFilled /></el-icon>
            <span class="card-title">防抖设置</span>
          </div>
          <div class="card-body">
            <div class="debounce-toggle">
              <div class="toggle-info">
                <span class="toggle-label">连续性防抖拦截</span>
                <span class="toggle-desc">避免数据抖动导致的频繁误报</span>
              </div>
              <el-switch
                v-model="form.ruleActions.debounce.enabled"
                inline-prompt
                active-text="开"
                inactive-text="关"
                style="--el-switch-on-color: #13ce66; --el-switch-off-color: #c0c4cc"
              />
            </div>

            <el-collapse-transition>
              <div v-if="form.ruleActions.debounce.enabled" class="debounce-panel">
                <div class="debounce-row">
                  <div class="debounce-item">
                    <div class="item-label">
                      <el-icon><Guide /></el-icon>
                      <span>防抖策略</span>
                    </div>
                    <el-radio-group v-model="form.ruleActions.debounce.strategy" size="default">
                      <el-radio-button label="count">
                        <span class="strategy-content">
                          <span class="strategy-title">连续次数</span>
                          <span class="strategy-desc">累计命中 N 次后触发</span>
                        </span>
                      </el-radio-button>
                      <el-radio-button label="time">
                        <span class="strategy-content">
                          <span class="strategy-title">持续时间</span>
                          <span class="strategy-desc">持续 N 分钟后触发</span>
                        </span>
                      </el-radio-button>
                    </el-radio-group>
                  </div>
                  <div class="debounce-item threshold-item">
                    <div class="item-label">
                      <el-icon><Odometer /></el-icon>
                      <span>触发阈值</span>
                      <el-tooltip content="条件连续命中次数或持续时间达到此值后才生成报警" placement="top">
                        <el-icon class="tip-icon"><QuestionFilled /></el-icon>
                      </el-tooltip>
                    </div>
                    <div class="threshold-input">
                      <el-input-number
                        v-model="form.ruleActions.debounce.threshold"
                        :min="1"
                        :max="100"
                        controls-position="right"
                      />
                      <span class="threshold-unit">{{ form.ruleActions.debounce.strategy === 'count' ? '次' : '分钟' }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </el-collapse-transition>
          </div>
        </div>

        <!-- 基础属性卡片 -->
        <div class="form-card">
          <div class="card-header">
            <span class="card-dot dot-gray"></span>
            <el-icon class="card-icon"><Setting /></el-icon>
            <span class="card-title">其他设置</span>
          </div>
          <div class="card-body">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="启用状态" prop="status">
                  <el-radio-group v-model="form.status">
                    <el-radio-button label="0">
                      <el-icon><CircleCheckFilled /></el-icon>
                      <span class="ml-1">正常监控</span>
                    </el-radio-button>
                    <el-radio-button label="1">
                      <el-icon><CircleCloseFilled /></el-icon>
                      <span class="ml-1">暂停停用</span>
                    </el-radio-button>
                  </el-radio-group>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="备注" prop="remark">
                  <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="规则用途描述（可选）..." />
                </el-form-item>
              </el-col>
            </el-row>
          </div>
        </div>
      </el-form>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancel" size="default">取 消</el-button>
          <el-button type="primary" @click="submitForm" size="default">
            <el-icon class="mr-1"><Check /></el-icon>
            保 存 规 则
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 报警说明抽屉 -->
    <el-drawer
      v-model="openHelp"
      title="报警规则配置说明"
      direction="rtl"
      size="600px"
      custom-class="help-drawer"
    >
      <div class="help-content">

        <!-- 一、报警系统架构 -->
        <h3 class="help-h3"><span class="step-num">1</span> 报警系统架构</h3>
        <div class="help-card">
          <div class="flow-steps">
            <div class="flow-step">
              <div class="flow-dot"></div>
              <div class="flow-line"></div>
              <div class="flow-text">
                <strong>数据采集层</strong>
                <p>网关/PLC 上报设备原始数据到 TDengine 时序库</p>
              </div>
            </div>
            <div class="flow-step">
              <div class="flow-dot"></div>
              <div class="flow-line"></div>
              <div class="flow-text">
                <strong>流计算聚合层</strong>
                <p>micro-data-integration 服务的 5 分钟滚动聚合任务，写入 <code>meters_5m</code> (设备) 和 <code>zone_meters_5m</code> (分区)</p>
              </div>
            </div>
            <div class="flow-step">
              <div class="flow-dot"></div>
              <div class="flow-line"></div>
              <div class="flow-text">
                <strong>报警轮询层 (TMQ)</strong>
                <p>micro-alarm 服务每 30 秒查询上述两张聚合表最新数据，将每条记录转化为一个"事实 (facts)"，携带 <code>targetType</code> + <code>targetKey</code> 提交给引擎</p>
              </div>
            </div>
            <div class="flow-step">
              <div class="flow-dot"></div>
              <div class="flow-line"></div>
              <div class="flow-text">
                <strong>规则引擎层 (Engine)</strong>
                <p>通过规则索引 Map&lt;targetKey, Rule[]&gt; 以 O(1) 查找该目标关联的所有规则，创建临时 json-rules-engine 实例，执行 condition → fact 匹配</p>
              </div>
            </div>
            <div class="flow-step">
              <div class="flow-dot"></div>
              <div class="flow-line"></div>
              <div class="flow-text">
                <strong>防抖判断层</strong>
                <p>命中后根据 debounce 配置：次数模式累计达到阈值才触发 / 时间模式持续超过阈值才触发</p>
              </div>
            </div>
            <div class="flow-step">
              <div class="flow-dot"></div>
              <div class="flow-line"></div>
              <div class="flow-text">
                <strong>报警生成层</strong>
                <p>写入 sys_alarm_history 表，Redis 标记活跃状态（防重复），异步推送通知（Webhook + 邮件）</p>
              </div>
            </div>
            <div class="flow-step">
              <div class="flow-dot"></div>
              <div class="flow-text">
                <strong>自动恢复层</strong>
                <p>当事实不再匹配规则时，自动生成恢复记录（status=2），清除 Redis 活跃标记</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 二、规则类型与作用域选择 -->
        <h3 class="help-h3"><span class="step-num">2</span> 规则类型与作用域 — 怎么选择</h3>
        <div class="help-card">
          <el-table :data="scopeGuideData" border size="small" style="width:100%">
            <el-table-column prop="ruleType" label="规则类型" width="90" />
            <el-table-column prop="scopeType" label="作用域类型" width="110" />
            <el-table-column prop="scopeValue" label="作用域值示例" width="150" />
            <el-table-column prop="useCase" label="适用场景" />
          </el-table>
          <el-alert type="info" :closable="false" style="margin-top: 12px;">
            <template #title>
              <strong>核心原则：</strong>一条规则 = 一个条件模板 + 一个作用域。作用域决定了哪些设备/分区会被这条规则检查。通过作用域，你可以用 <strong>1 条规则覆盖 100 个设备</strong>，无需逐一配置。
            </template>
          </el-alert>
        </div>

        <!-- 三、规则条件说明 -->
        <h3 class="help-h3"><span class="step-num">3</span> 规则条件 — 怎么判断触发报警</h3>
        <div class="help-card">
          <p class="text-sm mb-3">条件使用 <strong>AND/OR 逻辑树</strong> 结构：AND 组内所有条件必须同时满足，OR 组内任一条件满足即可。条件组可以无限嵌套。</p>

          <p class="text-sm font-bold mb-2">可用的事实变量 (Facts)：</p>
          <el-table :data="factsData" border size="small" style="width:100%">
            <el-table-column prop="name" label="变量名" width="130" />
            <el-table-column prop="desc" label="含义" width="230" />
            <el-table-column prop="example" label="条件示例" />
          </el-table>

          <p class="text-sm font-bold mt-3 mb-2">条件运算符说明：</p>
          <el-table :data="operatorData" border size="small" style="width:100%">
            <el-table-column prop="op" label="运算符" width="150" />
            <el-table-column prop="meaning" label="含义" />
          </el-table>
        </div>

        <!-- 四、防抖策略 -->
        <h3 class="help-h3"><span class="step-num">4</span> 防抖策略 — 防止误报</h3>
        <div class="help-card">
          <el-table :data="debounceData" border size="small" style="width:100%">
            <el-table-column prop="strategy" label="策略" width="130" />
            <el-table-column prop="desc" label="工作原理" />
            <el-table-column prop="example" label="举例" />
          </el-table>
          <el-alert type="warning" :closable="false" style="margin-top: 12px;" title="不开启防抖时，每次条件命中都会立即生成报警。生产环境强烈建议开启，避免因数据抖动产生报警风暴。" />
        </div>

        <!-- 五、配置示例 -->
        <h3 class="help-h3"><span class="step-num">5</span> 典型配置场景举例</h3>
        <div class="help-card">
          <div class="example-block">
            <h4 class="text-sm font-bold text-blue-600">场景 A：批量设备压力过高报警</h4>
            <ul class="text-sm">
              <li>规则类型：设备报警 (ruleType=1)</li>
              <li>作用域类型：<code>all_devices</code>（或 <code>device</code> + 逗号分隔的设备编码）</li>
              <li>条件：<code>pointCode == "PRESSURE" AND avgVal > 0.8</code></li>
              <li>防抖：次数模式，阈值 3 次（连续 3 个 5 分钟聚合窗口超限才报警）</li>
            </ul>
          </div>
          <div class="example-block mt-3">
            <h4 class="text-sm font-bold text-blue-600">场景 B：分区夜间最小流量异常</h4>
            <ul class="text-sm">
              <li>规则类型：分区报警 (ruleType=2)</li>
              <li>作用域类型：<code>zone</code>，作用域值：<code>ZONE-01,ZONE-02,ZONE-03</code></li>
              <li>条件：<code>pointCode == "flow_min" AND avgVal &lt; 0.5</code></li>
              <li>说明：该规则会在 TMQ 每次轮询时检查这三个分区的 flow_min 指标，低于 0.5 即触发。若需仅在夜间生效，可通过外部调度在夜间才向引擎提交该数据。</li>
            </ul>
          </div>
          <div class="example-block mt-3">
            <h4 class="text-sm font-bold text-blue-600">场景 C：分区月售水量超过阈值</h4>
            <ul class="text-sm">
              <li>规则类型：分区报警 (ruleType=2)</li>
              <li>作用域类型：<code>zone</code>，作用域值：<code>ZONE-01</code></li>
              <li>条件：<code>totalVal > 50000</code></li>
              <li>说明：由 RevenueAlarmScheduler 每日凌晨 2:07 自动查询 <code>zone_revenue_1mo</code> 表，将月售水量作为 totalVal 提交给引擎评估。</li>
            </ul>
          </div>
          <div class="example-block mt-3">
            <h4 class="text-sm font-bold text-blue-600">场景 D：全系统级异常（所有设备离线检测）</h4>
            <ul class="text-sm">
              <li>规则类型：系统报警 (ruleType=3)</li>
              <li>作用域类型：<code>all_devices</code></li>
              <li>条件：<code>avgVal == null OR avgVal == 0</code>（设备无数据上报）</li>
              <li>防抖：时间模式，阈值 15 分钟（持续 15 分钟无数据才报警，排除临时通讯中断）</li>
            </ul>
          </div>
        </div>

        <!-- 六、通知渠道 -->
        <h3 class="help-h3"><span class="step-num">6</span> 通知渠道</h3>
        <div class="help-card text-sm">
          <p>报警触发后，系统会异步发送通知（不阻塞报警写入）：</p>
          <ul style="padding-left: 20px; line-height: 2;">
            <li><strong>Webhook：</strong>向配置的 HTTP(S) 地址 POST 报警 JSON，配置项 <code>alarm.notify.webhook.url</code></li>
            <li><strong>邮件：</strong>向配置的收件人发送 HTML 格式报警邮件，配置项 <code>alarm.notify.email.to</code></li>
          </ul>
          <p class="mt-2 text-gray-500">配置在系统配置表 sys_config 中管理，可在系统管理 → 参数配置中修改。</p>
        </div>

      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, toRefs, computed, getCurrentInstance } from 'vue';
import {
  Filter, BellFilled, Setting, QuestionFilled,
  Document, Aim, InfoFilled, Guide, Odometer,
  CircleCheckFilled, CircleCloseFilled, Check,
} from '@element-plus/icons-vue';
import { listRule, getRule, addRule, updateRule, delRule } from '@/api/alarm/rule';
import RuleBuilder from './components/RuleBuilder.vue';

const { proxy } = getCurrentInstance();

// 报警说明抽屉
const openHelp = ref(false);

// 作用域指引数据
const scopeGuideData = [
  { ruleType: '设备报警 (1)', scopeType: 'device', scopeValue: 'DEV-001,DEV-002', useCase: '特定几个设备需要监控，设备编码已知' },
  { ruleType: '设备报警 (1)', scopeType: 'all_devices', scopeValue: '(留空)', useCase: '所有设备统一规则，如全局压力上限' },
  { ruleType: '设备报警 (1)', scopeType: 'device_group', scopeValue: 'pump_stations', useCase: '按组管理设备，如所有泵站设备' },
  { ruleType: '分区报警 (2)', scopeType: 'zone', scopeValue: 'ZONE-01,ZONE-02', useCase: '特定分区需要监控，如 DMA 分区夜间最小流量' },
  { ruleType: '分区报警 (2)', scopeType: 'all_zones', scopeValue: '(留空)', useCase: '所有分区统一规则，如全局产销差上限' },
  { ruleType: '系统报警 (3)', scopeType: 'all_devices', scopeValue: '(留空)', useCase: '系统级异常，如设备离线检测、数据中断' },
];

// 条件变量数据
const factsData = [
  { name: 'deviceId / deviceCode', desc: '设备编码', example: 'deviceId == "DEV-001"' },
  { name: 'zoneCode', desc: '分区编码', example: 'zoneCode == "ZONE-01"' },
  { name: 'pointCode', desc: '测点编码', example: 'pointCode == "PRESSURE"' },
  { name: 'value / avgVal', desc: '聚合平均值', example: 'avgVal > 0.8' },
  { name: 'maxVal', desc: '聚合最大值', example: 'maxVal > 1.2' },
  { name: 'minVal', desc: '聚合最小值', example: 'minVal < 0.1' },
  { name: 'spreadVal', desc: '波动幅度 (max-min)', example: 'spreadVal > 0.5' },
  { name: 'diffVal', desc: '变化量 (当前-上一个窗口)', example: 'diffVal > 0.3 (突增) 或 diffVal < -0.3 (突降)' },
  { name: 'totalVal', desc: '营收累计值 (日/月售水量)', example: 'totalVal > 50000' },
];

// 运算符数据
const operatorData = [
  { op: 'equal (==)', meaning: '值等于指定值' },
  { op: 'notEqual (!=)', meaning: '值不等于指定值' },
  { op: 'greaterThan (>)', meaning: '大于指定值' },
  { op: 'greaterThanInclusive (>=)', meaning: '大于等于指定值' },
  { op: 'lessThan (<)', meaning: '小于指定值' },
  { op: 'lessThanInclusive (<=)', meaning: '小于等于指定值' },
  { op: 'in', meaning: '值在指定列表中 (逗号分隔)' },
  { op: 'notIn', meaning: '值不在指定列表中 (逗号分隔)' },
];

// 防抖策略数据
const debounceData = [
  { strategy: '连续触发次数 (count)', desc: 'Redis Sorted Set 记录时间窗口内的命中次数，达到阈值才触发报警。触发后重置计数器。', example: '阈值=3：需连续 3 个 5 分钟聚合窗口都命中条件，即持续 15 分钟才报警' },
  { strategy: '持续异常时间 (time)', desc: '首次命中时记录时间戳，后续命中检查持续时间。超过阈值分钟数才触发报警。触发后重置计时器。', example: '阈值=10：条件持续满足 10 分钟后才报警，短暂抖动不会触发' },
];

// 作用域类型选项（根据规则类型动态过滤）
const scopeTypeOptions = computed(() => {
  const allOptions = [
    { value: 'device', label: '指定设备 (device)' },
    { value: 'zone', label: '指定分区 (zone)' },
    { value: 'all_devices', label: '全部设备 (all_devices)' },
    { value: 'all_zones', label: '全部分区 (all_zones)' },
    { value: 'device_group', label: '设备组 (device_group)' },
  ];
  // 分区报警不显示设备相关选项，设备报警不显示分区相关选项
  if (form.value.ruleType === '2') {
    return allOptions.filter(o => o.value === 'zone' || o.value === 'all_zones');
  }
  if (form.value.ruleType === '1') {
    return allOptions.filter(o => o.value !== 'all_zones');
  }
  return allOptions; // 系统报警显示全部
});

const scopeValuePlaceholder = computed(() => {
  const map = {
    device: '输入设备编码，多个用英文逗号分隔，如: DEV-001,DEV-002',
    zone: '输入分区编码，多个用英文逗号分隔，如: ZONE-01,ZONE-02',
    device_group: '输入设备组名称，多个用英文逗号分隔',
  };
  return map[form.value.scopeType] || '';
});

const scopeValueHint = computed(() => {
  if (form.value.scopeType === 'device') return '该规则将仅对列出的设备生效';
  if (form.value.scopeType === 'zone') return '该规则将仅对列出的分区生效';
  if (form.value.scopeType === 'device_group') return '该规则将对属于这些组的全部设备生效';
  if (form.value.scopeType === 'all_devices') return '该规则自动对所有设备生效，无需填写作用域值';
  if (form.value.scopeType === 'all_zones') return '该规则自动对所有分区生效，无需填写作用域值';
  return '';
});

// 规则类型变化时自动设置默认作用域
function onRuleTypeChange(val) {
  if (val === '1') form.value.scopeType = 'device';
  else if (val === '2') form.value.scopeType = 'zone';
  else form.value.scopeType = 'all_devices';
}

// 使用字典
const sys_alarm_rule_type = ref([
  { label: '设备报警', value: '1' },
  { label: '分区报警', value: '2' },
  { label: '系统报警', value: '3' }
]); // 此处为了简单直接mock，实际应使用 useDict('sys_alarm_rule_type')

const ruleList = ref([]);
const open = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const title = ref("");

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    ruleName: undefined,
    ruleType: undefined,
    status: undefined
  },
  rules: {
    ruleName: [{ required: true, message: "规则名称不能为空", trigger: "blur" }],
    ruleType: [{ required: true, message: "规则类型不能为空", trigger: "change" }]
  }
});

const { queryParams, form, rules } = toRefs(data);

// 解析时间（Mock实现，实际应来自全局 utils）
const parseTime = (time) => {
  if (!time) return '';
  const date = new Date(time);
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
};

/** 查询规则列表 */
function getList() {
  loading.value = true;
  listRule(queryParams.value).then(response => {
    ruleList.value = response.rows || [];
    total.value = response.total || 0;
    loading.value = false;
  }).catch(() => {
    loading.value = false;
  });
}

// 取消按钮
function cancel() {
  open.value = false;
  reset();
}

// 表单重置
function reset() {
  form.value = {
    ruleId: undefined,
    ruleName: undefined,
    ruleType: "1",
    scopeType: "device",
    scopeValue: "",
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

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1;
  getList();
}

/** 重置按钮操作 */
function resetQuery() {
  proxy.$refs["queryRef"]?.resetFields();
  handleQuery();
}

// 多选框选中数据
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.ruleId);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
function handleAdd() {
  reset();
  open.value = true;
  title.value = "添加规则";
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  const ruleId = row.ruleId || ids.value[0];
  getRule(ruleId).then(response => {
    form.value = response.data;
    // 确保 conditions 是对象
    if (typeof form.value.ruleConditions === 'string') {
      try {
        form.value.ruleConditions = JSON.parse(form.value.ruleConditions);
      } catch(e) {
        form.value.ruleConditions = { all: [] };
      }
    }
    // 确保 actions 是对象
    if (typeof form.value.ruleActions === 'string') {
      try {
        form.value.ruleActions = JSON.parse(form.value.ruleActions);
      } catch(e) {
        form.value.ruleActions = { action: "notify" };
      }
    }
    
    // Backward compat: ensure scope fields exist for older records
    if (!form.value.scopeType) {
      form.value.scopeType = form.value.ruleType === '2' ? 'zone' : 'device';
    }
    if (!form.value.scopeValue) {
      form.value.scopeValue = '';
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

/** 提交按钮 */
function submitForm() {
  proxy.$refs["ruleRef"].validate(valid => {
    if (valid) {
      // 提交时，确保保存格式正确
      const submitData = { ...form.value };
      if (submitData.ruleId != undefined) {
        updateRule(submitData).then(() => {
          proxy.$modal?.msgSuccess("修改成功") || alert("修改成功");
          open.value = false;
          getList();
        });
      } else {
        addRule(submitData).then(() => {
          proxy.$modal?.msgSuccess("新增成功") || alert("新增成功");
          open.value = false;
          getList();
        });
      }
    }
  });
}

/** 删除按钮操作 */
function handleDelete(row) {
  const ruleIds = row.ruleId || ids.value;
  if(confirm('是否确认删除规则编号为"' + ruleIds + '"的数据项？')) {
    delRule(ruleIds).then(() => {
      getList();
      proxy.$modal?.msgSuccess("删除成功") || alert("删除成功");
    });
  }
}

getList();
</script>

<style scoped>
/* ===== 对话框整体 ===== */
:deep(.rule-dialog) {
  margin-top: 0 !important;
}
:deep(.rule-dialog .el-dialog__header) {
  background: linear-gradient(135deg, #f8fafc 0%, #ecf5ff 100%);
  border-bottom: 1px solid #e4e7ed;
  padding: 16px 24px;
  margin: 0;
  flex-shrink: 0;
}
:deep(.rule-dialog .el-dialog__title) {
  font-size: 17px;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: 0.3px;
}
:deep(.rule-dialog .el-dialog__body) {
  padding: 0;
  background: #f8fafc;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: calc(90vh - 110px);
}
:deep(.rule-dialog .el-dialog__footer) {
  padding: 12px 24px;
  border-top: 1px solid #f0f2f5;
  background: #fff;
  flex-shrink: 0;
}

/* 滚动容器 */
.dialog-scroll {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 20px 24px;
}
.dialog-scroll::-webkit-scrollbar {
  width: 5px;
}
.dialog-scroll::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 3px;
}
.dialog-scroll::-webkit-scrollbar-track {
  background: transparent;
}

/* ===== 表单卡片 ===== */
.form-card {
  background: #fff;
  border: 1px solid #e8ecf1;
  border-radius: 10px;
  margin-bottom: 16px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,.04);
  transition: box-shadow 0.2s;
}
.form-card:hover {
  box-shadow: 0 2px 10px rgba(0,0,0,.06);
}

.card-header {
  display: flex;
  align-items: center;
  padding: 14px 20px;
  background: #fafbfc;
  border-bottom: 1px solid #f0f2f5;
  gap: 10px;
}
.card-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #409eff;
  flex-shrink: 0;
}
.card-dot.dot-purple { background: #8b5cf6; }
.card-dot.dot-green  { background: #10b981; }
.card-dot.dot-orange { background: #f59e0b; }
.card-dot.dot-gray   { background: #94a3b8; }

.card-icon {
  font-size: 16px;
  color: #64748b;
}
.card-title {
  font-size: 14px;
  font-weight: 600;
  color: #334155;
}
.card-body {
  padding: 18px 20px;
}

/* ===== 作用域提示 ===== */
.scope-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 2px;
  padding: 8px 12px;
  background: #f0f5ff;
  border-radius: 6px;
  font-size: 12px;
  color: #64748b;
}
.scope-hint .el-icon {
  color: #409eff;
  font-size: 14px;
  flex-shrink: 0;
}

/* ===== 触发条件 ===== */
.conditions-item {
  margin-bottom: 0;
}

/* ===== 防抖开关 ===== */
.debounce-toggle {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  background: #fafbfc;
  border-radius: 8px;
  border: 1px solid #f0f2f5;
}
.toggle-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.toggle-label {
  font-size: 14px;
  font-weight: 600;
  color: #334155;
}
.toggle-desc {
  font-size: 12px;
  color: #94a3b8;
}

/* ===== 防抖展开面板 ===== */
.debounce-panel {
  margin-top: 14px;
  padding: 18px;
  background: #fafbfc;
  border: 1px solid #e8ecf1;
  border-radius: 8px;
}
.debounce-row {
  display: flex;
  gap: 32px;
  align-items: flex-start;
  flex-wrap: wrap;
}
.debounce-item {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.debounce-item.threshold-item {
  min-width: 200px;
}

.item-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
}
.item-label .el-icon {
  font-size: 15px;
  color: #94a3b8;
}
.tip-icon {
  font-size: 14px;
  color: #c0c4cc;
  cursor: pointer;
}
.tip-icon:hover {
  color: #909399;
}

/* 策略选择按钮增强 */
.strategy-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2px 8px;
  line-height: 1.4;
}
.strategy-title {
  font-size: 13px;
  font-weight: 600;
}
.strategy-desc {
  font-size: 11px;
  opacity: 0.7;
}
:deep(.el-radio-button__inner) {
  padding: 8px 16px !important;
}

/* 阈值输入 */
.threshold-input {
  display: flex;
  align-items: center;
  gap: 10px;
}
.threshold-unit {
  font-size: 14px;
  font-weight: 700;
  color: #409eff;
  background: #ecf5ff;
  padding: 4px 14px;
  border-radius: 6px;
  min-width: 44px;
  text-align: center;
}

/* ===== 基础属性 ===== */
:deep(.el-radio-button__inner) {
  border-radius: 6px !important;
}

/* 工具类 */
.w-full {
  width: 100%;
}
.ml-1 { margin-left: 4px; }
.ml-2 { margin-left: 8px; }
.mr-1 { margin-right: 4px; }
.mr-2 { margin-right: 8px; }
.mt-2 { margin-top: 8px; }
.mt-3 { margin-top: 12px; }
.mt-4 { margin-top: 16px; }
.mt-6 { margin-top: 24px; }
.mb-2 { margin-bottom: 8px; }
.mb-3 { margin-bottom: 12px; }
.mb-4 { margin-bottom: 16px; }

/* 对话框底部 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* ===== 报警说明抽屉样式 ===== */
.help-content {
  padding: 0 4px;
  line-height: 1.8;
}

.help-h3 {
  font-size: 15px;
  font-weight: bold;
  color: #303133;
  margin: 20px 0 12px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  align-items: center;
  gap: 8px;
}

.step-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #409eff;
  color: #fff;
  font-size: 12px;
  font-weight: bold;
  flex-shrink: 0;
}

.help-card {
  background: #fafafa;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  padding: 14px 16px;
}

/* 流程图 */
.flow-steps {
  position: relative;
  padding-left: 8px;
}

.flow-step {
  display: flex;
  align-items: flex-start;
  position: relative;
  padding-bottom: 10px;
}

.flow-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #409eff;
  flex-shrink: 0;
  margin-top: 6px;
  z-index: 1;
}

.flow-line {
  position: absolute;
  left: 4px;
  top: 16px;
  width: 2px;
  height: calc(100% - 6px);
  background: #e4e7ed;
}

.flow-step:last-child .flow-line {
  display: none;
}

.flow-text {
  padding-left: 14px;
  flex: 1;
}

.flow-text strong {
  font-size: 13px;
  color: #303133;
}

.flow-text p {
  margin: 2px 0 0 0;
  font-size: 12px;
  color: #909399;
}

.flow-text code {
  background: #ecf5ff;
  color: #409eff;
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 11px;
}

/* 示例块 */
.example-block {
  background: #fff;
  border: 1px dashed #dcdfe6;
  border-radius: 6px;
  padding: 12px 16px;
}

.example-block ul {
  padding-left: 18px;
  line-height: 2;
  color: #606266;
}

.example-block code {
  background: #ecf5ff;
  color: #409eff;
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 11px;
}

.text-xs { font-size: 12px; }
.text-sm { font-size: 13px; }
.text-gray-400 { color: #94a3b8; }
.text-gray-500 { color: #64748b; }
.text-gray-600 { color: #475569; }
.text-blue-600 { color: #409eff; }
.font-bold { font-weight: 700; }
</style>
