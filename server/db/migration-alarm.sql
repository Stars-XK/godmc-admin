-- ============================================
-- 报警系统 - sys_alarm_history 表新增 recovery_time 列
-- ============================================

ALTER TABLE `sys_alarm_history`
  ADD COLUMN `recovery_time` datetime DEFAULT NULL COMMENT '自动恢复时间'
  AFTER `resolve_time`;
