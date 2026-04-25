# TDengine 流计算高级告警指标设计规范

## 1. 背景与目的
为了实现更高级别的告警监控能力，本设计旨在利用 TDengine 的流计算（Stream Computing）特性，对原始指标数据进行实时预聚合与二次计算。支持的高级告警指标包括：
- **移动平均 (Moving Average)**：平滑数据波动，识别长期趋势异常。
- **斜率/变化率 (Slope/Derivative)**：识别数据突变的速度（如温度急剧上升）。
- **突变差值 (Sudden Change/Spread)**：识别短时间内数据的剧烈抖动（最大值与最小值之差）。

这些流计算结果将被推送至 `micro-alarm` 微服务中进行告警规则匹配。

## 2. 超级表设计 (Super Table Schema)

首先定义用于接收底层设备原始指标数据的超级表（Super Table）：

```sql
-- 创建原始指标数据超级表
CREATE STABLE raw_metrics (
    ts TIMESTAMP,         -- 时间戳
    val DOUBLE            -- 指标值
) TAGS (
    device_id BINARY(64), -- 设备标识符
    metric_name BINARY(64)-- 指标名称（如 temperature, pressure 等）
);
```

基于流计算的结果，我们需要分别定义对应的高级指标存放的超级表（TDengine 3.x 及以上版本中，流计算结果可以直接写入新的超级表）：

```sql
-- 移动平均结果超级表
CREATE STABLE st_metric_ma (
    ts TIMESTAMP, 
    val_ma DOUBLE
) TAGS (
    device_id BINARY(64), 
    metric_name BINARY(64)
);

-- 斜率/变化率结果超级表
CREATE STABLE st_metric_slope (
    ts TIMESTAMP, 
    val_slope DOUBLE
) TAGS (
    device_id BINARY(64), 
    metric_name BINARY(64)
);

-- 突变差值结果超级表
CREATE STABLE st_metric_diff (
    ts TIMESTAMP, 
    val_diff DOUBLE
) TAGS (
    device_id BINARY(64), 
    metric_name BINARY(64)
);
```

## 3. 流计算创建语句 (Stream Creation SQLs)

通过定义流计算（STREAM），我们可以对原始数据进行基于时间窗口（Window）的连续计算。

### 3.1 移动平均 (Moving Average)
计算过去 5 分钟的平均值，滑动步长为 1 分钟：
```sql
CREATE STREAM stream_ma_5m 
INTO st_metric_ma AS
SELECT 
    _wstart AS ts, 
    AVG(val) AS val_ma
FROM raw_metrics
PARTITION BY device_id, metric_name
INTERVAL(5m) SLIDING(1m);
```

### 3.2 斜率/变化率 (Slope)
计算过去 5 分钟内数值的变化率（单位：每秒变化量）：
```sql
CREATE STREAM stream_slope_5m 
INTO st_metric_slope AS
SELECT 
    _wstart AS ts, 
    DERIVATIVE(val, 1s, 0) AS val_slope
FROM raw_metrics
PARTITION BY device_id, metric_name
INTERVAL(5m) SLIDING(1m);
```

### 3.3 突变差值 (Sudden Change)
计算过去 1 分钟内最大值与最小值的极差（Spread），用于捕获瞬间的数据抖动：
```sql
CREATE STREAM stream_diff_1m 
INTO st_metric_diff AS
SELECT 
    _wstart AS ts, 
    SPREAD(val) AS val_diff
FROM raw_metrics
PARTITION BY device_id, metric_name
INTERVAL(1m);
```

## 4. 微服务订阅架构 (`micro-alarm` Subscription)

为保证告警的低延迟与系统解耦，`micro-alarm` 微服务将使用 TDengine 提供的数据订阅功能（TMQ, TDengine Message Queue）来实时消费流计算产生的数据。

### 4.1 定义 TMQ Topic
在 TDengine 中为每个流计算结果表创建 Topic：
```sql
CREATE TOPIC topic_alarm_ma AS SELECT * FROM st_metric_ma;
CREATE TOPIC topic_alarm_slope AS SELECT * FROM st_metric_slope;
CREATE TOPIC topic_alarm_diff AS SELECT * FROM st_metric_diff;
```

### 4.2 `micro-alarm` 订阅实现逻辑
在 NestJS 微服务架构下，`micro-alarm` 需要实现以下机制：
1. **初始化 TMQ Consumer**：在 `micro-alarm` 启动时，使用 TDengine 的 Node.js 客户端（如 `@tdengine/client` 或相应的 C-connector 封装）建立与 TDengine 集群的 TMQ 连接。
2. **订阅 Topics**：消费者订阅 `topic_alarm_ma`、`topic_alarm_slope` 和 `topic_alarm_diff`。
3. **数据处理流 (Event Pipeline)**：
   - TMQ Consumer 拉取到数据后，解析出 `device_id`, `metric_name`, 以及对应的 `val_ma` / `val_slope` / `val_diff`。
   - 在内存中（或借助 Redis 缓存）加载该设备及指标关联的**高级告警规则**（如：“当水压变化率 `slope > 0.5` 触发异常告警”）。
   - 将流计算结果送入规则引擎执行匹配。
4. **触发动作**：一旦命中规则，`micro-alarm` 通过消息队列（如 RabbitMQ/Kafka）或直接调用通知服务，进行告警下发、工单创建和前端推送。

### 4.3 容错与恢复策略
- **Offset 记录**：TMQ 自动管理消费进度（Offset），如果 `micro-alarm` 服务重启，会自动从上一次提交的 Offset 处继续消费，避免告警遗漏。
- **降级机制**：若 TMQ 暂时不可用，可备选采用短轮询的方式定时拉取 `st_metric_*` 等结果表中的最新数据（基于时间戳 `ts > last_check_time`）进行告警判断。
