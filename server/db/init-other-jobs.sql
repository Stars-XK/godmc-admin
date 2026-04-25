INSERT INTO `sys_job` (`job_id`, `job_name`, `job_group`, `invoke_target`, `cron_expression`, `misfire_policy`, `concurrent`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`) VALUES
(1004, '刷新设备状态树', 'DEFAULT', 'statusEngine.refreshAssetTree()', '0 0 * * * ?', '3', '1', '0', 'admin', NOW(), '', NULL, '每小时全量刷新一次缓存中的设备状态树结构'),
(1005, '设备在线状态心跳检测', 'DEFAULT', 'statusEngine.checkStatus()', '0 * * * * ?', '3', '1', '0', 'admin', NOW(), '', NULL, '每分钟执行一次所有测点及设备的心跳检测与离线报警联动'),
(1006, '测点脏数据聚合(5m/1h/1d)', 'DEFAULT', 'httpTask.post(''http://127.0.0.1:3007/tdengine-agg/dirty-points'')', '0 * * * * ?', '3', '1', '0', 'admin', NOW(), '', NULL, '每分钟执行一次，将测点的时序脏数据自动向上聚合计算'),
(1007, '分区脏数据指标聚合', 'DEFAULT', 'httpTask.post(''http://127.0.0.1:3007/tdengine-agg/dirty-zones'')', '0 */2 * * * ?', '3', '1', '0', 'admin', NOW(), '', NULL, '每2分钟执行一次，对受测点聚合影响的分区指标进行重算'),
(1008, 'TDengine插入死信重试', 'DEFAULT', 'httpTask.post(''http://127.0.0.1:3007/tdengine-agg/retry-inserts'')', '*/10 * * * * ?', '3', '1', '0', 'admin', NOW(), '', NULL, '每10秒执行一次，重放写入失败的TDengine时序数据');
