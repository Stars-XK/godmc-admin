-- 更新系统基础表
ALTER TABLE `sys_user` COMMENT = '【系统基础】用户信息表';
ALTER TABLE `sys_role` COMMENT = '【系统基础】角色信息表';
ALTER TABLE `sys_menu` COMMENT = '【系统基础】菜单权限表';
ALTER TABLE `sys_dept` COMMENT = '【系统基础】部门表';
ALTER TABLE `sys_post` COMMENT = '【系统基础】岗位信息表';
ALTER TABLE `sys_dict_type` COMMENT = '【系统基础】字典类型表';
ALTER TABLE `sys_dict_data` COMMENT = '【系统基础】字典数据表';
ALTER TABLE `sys_config` COMMENT = '【系统基础】参数配置表';
ALTER TABLE `sys_notice` COMMENT = '【系统基础】通知公告表';
ALTER TABLE `sys_oper_log` COMMENT = '【系统基础】操作日志记录';
ALTER TABLE `sys_logininfor` COMMENT = '【系统基础】系统访问记录';
ALTER TABLE `sys_user_role` COMMENT = '【系统基础】用户和角色关联表';
ALTER TABLE `sys_role_menu` COMMENT = '【系统基础】角色和菜单关联表';
ALTER TABLE `sys_role_dept` COMMENT = '【系统基础】角色和部门关联表';
ALTER TABLE `sys_user_post` COMMENT = '【系统基础】用户与岗位关联表';
ALTER TABLE `sys_job` COMMENT = '【系统基础】定时任务调度表';
ALTER TABLE `sys_job_log` COMMENT = '【系统基础】定时任务调度日志表';
ALTER TABLE `sys_upload` COMMENT = '【系统基础】文件上传记录表';

-- 更新代码生成表
ALTER TABLE `gen_table` COMMENT = '【代码生成】代码生成业务表';
ALTER TABLE `gen_table_column` COMMENT = '【代码生成】代码生成业务表字段';

-- 更新水务基础表
ALTER TABLE `water_station` COMMENT = '【水务基础】站点信息表';
ALTER TABLE `water_device` COMMENT = '【水务基础】设备信息表';
ALTER TABLE `water_point` COMMENT = '【水务基础】测点信息表';
ALTER TABLE `water_zone` COMMENT = '【水务基础】分区信息表';
ALTER TABLE `scada_revenue_user` COMMENT = '【水务基础】营收基础用户信息表';