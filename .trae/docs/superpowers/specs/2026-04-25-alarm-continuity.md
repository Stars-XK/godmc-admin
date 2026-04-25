# Micro-Alarm 报警连续性 (Debounce / Time-Window) 设计规范

**日期**: 2026-04-25  
**模块**: `micro-alarm`

## 1. 背景与需求
在监控与告警系统中，设备或指标的异常往往会发生抖动（Flapping），导致短时间内产生大量重复告警。为了减少告警风暴，提高告警质量，`micro-alarm` 服务需要引入**连续性（Continuity）与防抖（Debounce）**机制。

具体需要支持以下两种防抖触发策略：
1. **连续触发 N 次** (Trigger only if continuous for N times)
2. **持续异常 M 分钟** (Trigger only if lasts for M minutes)

## 2. 方案选型：基于 Redis 的有状态滑动窗口
为了在分布式微服务环境下保证状态一致性与高并发处理能力，我们采用 **Redis** 作为状态存储，使用其内置的数据结构实现时间滑动窗口（Stateful Sliding Window）。

### 2.1 核心数据结构设计
我们将利用 Redis 的 **Sorted Set (ZSET)** 以及 **String (带过期时间)** 来存储设备状态。

- **ZSET Key**: `alarm:window:{rule_id}:{device_id}`
  - **Score**: 事件发生的时间戳 (毫秒/秒)。
  - **Member**: 事件唯一 ID (或时间戳拼接随机数，如 `1680000000000-uuid`)。
- **String Key**: `alarm:state:{rule_id}:{device_id}`
  - 存储首次异常发生的时间戳。

## 3. 配置存储设计 (Database & UI)
你提到的非常对，这些连续性参数（N次、M分钟）本质上是**报警规则的一部分**，因此必须存储在 `sys_alarm_rule` 表中，并在前端让用户自由配置。

### 3.1 数据库结构扩展
我们不需要修改表结构增加新字段，而是直接利用现有的 `rule_actions` 或 `rule_conditions` 这个 JSON 字段来存储防抖策略。
建议在 `rule_actions` JSON 中新增 `debounce` 节点：
```json
{
  "type": "notify",
  "debounce": {
    "enabled": true,
    "strategy": "count", // 'count' 表示连续N次, 'time' 表示持续M分钟
    "threshold": 5 // 如果是 count 则为 5 次；如果是 time 则为 5 分钟
  }
}
```

### 3.2 前端配置页面 (RuleBuilder)
在 `admin/src/views/alarm/rule/index.vue` (或 RuleBuilder 组件) 中，在“报警动作”区域增加以下表单项：
- **开启连续性防抖** (Switch 开关)
- **防抖策略** (Select 下拉框: 连续触发次数 / 持续异常时间)
- **阈值** (InputNumber: N 次 / M 分钟)

当后端 `EngineService` 命中基础规则时，会读取该规则 JSON 中的 `debounce` 配置，决定是立即报警，还是放入 Redis 滑动窗口进行累计。

---

## 4. 策略实现逻辑

### 3.1 策略一：连续触发 N 次 (Continuous N Times)
此策略关注的是**连续的异常次数**。如果有正常的指标上报，应当打断并重置连续性。

**处理流程**：
1. **当收到异常事件时**：
   - 使用 `ZADD alarm:window:{rule_id}:{device_id} <timestamp> <event_id>` 将事件加入窗口。
   - (可选) 使用 `ZREMRANGEBYSCORE` 移除超出最大时间窗口范围（如最近 1 小时之外）的旧数据，防止 ZSET 无限增长。
   - 使用 `ZCARD` 获取当前 ZSET 中的异常事件数量。
   - 判断：如果 `ZCARD >= N`，则**触发最终告警**，随后使用 `DEL` 清空该 ZSET，重置防抖状态。
2. **当收到正常事件时**：
   - 使用 `DEL alarm:window:{rule_id}:{device_id}` 清除窗口，打断连续异常状态。

### 3.2 策略二：持续异常 M 分钟 (Lasts for M minutes)
此策略关注的是**异常状态维持的时长**，期间不能被正常事件打断。

**处理流程**：
1. **当收到异常事件时**：
   - 检查 `alarm:state:{rule_id}:{device_id}` 是否存在。
   - **如果不存在**：说明是首次异常，记录当前时间戳 `SET alarm:state:{rule_id}:{device_id} <timestamp> EX <TTL>`。
   - **如果存在**：获取记录的时间戳 `start_time`，并计算 `current_time - start_time`。
   - 判断：如果时长 `>= M 分钟`，则**触发最终告警**，并删除该 Key（或更新时间戳进入下一个周期）。
2. **当收到正常事件时**：
   - `DEL alarm:state:{rule_id}:{device_id}` 清除状态，打断持续计时。

> **可选进阶方案（ZSET 滑动时间窗检查）**：
> 如果要求在 M 分钟内允许少量丢点，但只要首尾相差 M 分钟且异常率达标即触发，可通过 `ZSET` 记录所有异常点，移除 `now - M` 之前的数据。然后比对 `ZMIN(score)` 与当前时间的差值是否 `>= M 分钟`，若满足则触发告警。

## 4. 容错与过期清理 (TTL)
为了防止废弃的监控项在 Redis 中产生脏数据（Memory Leak）：
- 每次更新 ZSET 或 String 时，均需要通过 `EXPIRE` 刷新其过期时间。
- 过期时间建议设置为防抖窗口上限的 2 倍。例如，要求持续 5 分钟，则 `EXPIRE` 可设为 10 分钟。超过时间没有新数据到来，Redis 将自动回收状态。

## 5. 总结
通过 Redis 的 `ZSET` 和 `String`，我们可以实现分布式场景下的告警滑动窗口防抖。该方案具有 O(log(N)) 的高效率，并且易于在多个 `micro-alarm` 实例中共享状态，保证了告警判断的一致性。
