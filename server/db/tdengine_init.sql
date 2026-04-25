-- 创建原始指标数据超级表 (Assuming database is already created and in use, e.g., USE water_db;)
CREATE STABLE IF NOT EXISTS raw_metrics (
    ts TIMESTAMP,
    val DOUBLE
) TAGS (
    device_id BINARY(64),
    metric_name BINARY(64)
);

-- 移动平均结果超级表
CREATE STABLE IF NOT EXISTS st_metric_ma (
    ts TIMESTAMP, 
    val_ma DOUBLE
) TAGS (
    device_id BINARY(64), 
    metric_name BINARY(64)
);

-- 斜率/变化率结果超级表
CREATE STABLE IF NOT EXISTS st_metric_slope (
    ts TIMESTAMP, 
    val_slope DOUBLE
) TAGS (
    device_id BINARY(64), 
    metric_name BINARY(64)
);

-- 突变差值结果超级表
CREATE STABLE IF NOT EXISTS st_metric_diff (
    ts TIMESTAMP, 
    val_diff DOUBLE
) TAGS (
    device_id BINARY(64), 
    metric_name BINARY(64)
);

-- 创建流计算 (Stream)
CREATE STREAM IF NOT EXISTS stream_ma_5m 
INTO st_metric_ma AS
SELECT 
    _wstart AS ts, 
    AVG(val) AS val_ma
FROM raw_metrics
PARTITION BY device_id, metric_name
INTERVAL(5m) SLIDING(1m);

CREATE STREAM IF NOT EXISTS stream_slope_5m 
INTO st_metric_slope AS
SELECT 
    _wstart AS ts, 
    DERIVATIVE(val, 1s, 0) AS val_slope
FROM raw_metrics
PARTITION BY device_id, metric_name
INTERVAL(5m) SLIDING(1m);

CREATE STREAM IF NOT EXISTS stream_diff_1m 
INTO st_metric_diff AS
SELECT 
    _wstart AS ts, 
    SPREAD(val) AS val_diff
FROM raw_metrics
PARTITION BY device_id, metric_name
INTERVAL(1m);

-- 创建 TMQ Topic
CREATE TOPIC IF NOT EXISTS topic_alarm_ma AS SELECT * FROM st_metric_ma;
CREATE TOPIC IF NOT EXISTS topic_alarm_slope AS SELECT * FROM st_metric_slope;
CREATE TOPIC IF NOT EXISTS topic_alarm_diff AS SELECT * FROM st_metric_diff;
