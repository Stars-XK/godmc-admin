/*
 Navicat Premium Data Transfer

 Source Server         : localhost
 Source Server Type    : MySQL
 Source Server Version : 80027 (8.0.27)
 Source Host           : localhost:3306
 Source Schema         : nest-admin

 Target Server Type    : MySQL
 Target Server Version : 80027 (8.0.27)
 File Encoding         : 65001

 Date: 28/02/2025 17:07:11
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS sys_db_updates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  filename VARCHAR(255) NOT NULL UNIQUE COMMENT 'SQL文件名',
  status VARCHAR(20) NOT NULL COMMENT '执行状态: SUCCESS/FAILED',
  error_msg TEXT COMMENT '失败时的错误信息',
  executed_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '执行时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='【系统管理模块 - 数据库自动更新记录表】数据库自动更新记录表';
-- ----------------------------
-- Table structure for gen_table
-- ----------------------------
DROP TABLE IF EXISTS `gen_table`;
CREATE TABLE `gen_table` (
  `table_id` int NOT NULL AUTO_INCREMENT COMMENT '编号',
  `table_name` varchar(200) NOT NULL DEFAULT '' COMMENT '表名称',
  `table_comment` varchar(500) NOT NULL DEFAULT '' COMMENT '表描述',
  `sub_table_name` varchar(64) DEFAULT NULL COMMENT '关联子表的表名',
  `sub_table_fk_name` varchar(64) DEFAULT NULL COMMENT '子表关联的外键名',
  `class_name` varchar(100) NOT NULL DEFAULT '' COMMENT '实体类名称',
  `tpl_category` varchar(200) NOT NULL DEFAULT 'crud' COMMENT '使用的模板（crud单表操作 tree树表操作）',
  `tpl_web_type` varchar(30) NOT NULL DEFAULT 'element-plus' COMMENT '前端模板类型（element-ui模版 element-plus模版）',
  `package_name` varchar(100) NOT NULL COMMENT '生成包路径',
  `module_name` varchar(30) NOT NULL COMMENT '生成模块名',
  `business_name` varchar(30) NOT NULL COMMENT '生成业务名',
  `function_name` varchar(50) NOT NULL COMMENT '生成功能名',
  `function_author` varchar(50) NOT NULL COMMENT '生成功能作者',
  `gen_type` char(1) NOT NULL DEFAULT '0' COMMENT '生成代码方式（0zip压缩包 1自定义路径）',
  `gen_path` varchar(200) NOT NULL DEFAULT '/' COMMENT '生成路径（不填默认项目路径）',
  `options` varchar(1000) NOT NULL DEFAULT '' COMMENT '其它生成选项',
  `status` char(1) NOT NULL DEFAULT '0' COMMENT '状态',
  `del_flag` char(1) NOT NULL DEFAULT '0' COMMENT '删除标志',
  `create_by` varchar(64) NOT NULL DEFAULT '' COMMENT '创建者',
  `create_time` datetime(6) DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `update_by` varchar(64) NOT NULL DEFAULT '' COMMENT '更新者',
  `update_time` datetime(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
  `remark` varchar(500) DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`table_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='【系统管理模块 - 代码生成业务表】代码生成业务表';

-- ----------------------------
-- Records of gen_table
-- ----------------------------
BEGIN;
COMMIT;

-- ----------------------------
-- Table structure for gen_table_column
-- ----------------------------
DROP TABLE IF EXISTS `gen_table_column`;
CREATE TABLE `gen_table_column` (
  `column_id` int NOT NULL AUTO_INCREMENT COMMENT '编号',
  `table_id` int NOT NULL COMMENT '归属表编号',
  `column_name` varchar(200) NOT NULL COMMENT '列名称',
  `column_comment` varchar(500) NOT NULL COMMENT '列描述',
  `column_type` varchar(100) NOT NULL COMMENT '列类型',
  `java_type` varchar(500) NOT NULL COMMENT 'JAVA类型',
  `java_field` varchar(200) NOT NULL COMMENT 'JAVA字段名',
  `is_pk` char(1) NOT NULL DEFAULT '0' COMMENT '是否主键（1是）',
  `is_increment` char(1) NOT NULL DEFAULT '0' COMMENT '是否自增（1是）',
  `is_required` char(1) NOT NULL DEFAULT '0' COMMENT '是否必填（1是）',
  `is_insert` char(1) NOT NULL DEFAULT '0' COMMENT '是否为插入字段（1是）',
  `is_edit` char(1) DEFAULT '0' COMMENT '是否编辑字段（1是）',
  `is_list` char(1) DEFAULT '0' COMMENT '是否列表字段（1是）',
  `is_query` char(1) DEFAULT '1' COMMENT '是否查询字段（1是）',
  `query_type` varchar(200) NOT NULL DEFAULT 'EQ' COMMENT '查询方式（等于、不等于、大于、小于、范围）',
  `html_type` varchar(200) NOT NULL DEFAULT '' COMMENT '显示类型（文本框、文本域、下拉框、复选框、单选框、日期控件）',
  `dict_type` varchar(200) NOT NULL DEFAULT '' COMMENT '字典类型',
  `column_default` varchar(200) DEFAULT NULL COMMENT '默认值',
  `sort` int NOT NULL COMMENT '排序',
  `status` char(1) NOT NULL DEFAULT '0' COMMENT '状态',
  `del_flag` char(1) NOT NULL DEFAULT '0' COMMENT '删除标志',
  `create_by` varchar(64) NOT NULL DEFAULT '' COMMENT '创建者',
  `create_time` datetime(6) DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `update_by` varchar(64) NOT NULL DEFAULT '' COMMENT '更新者',
  `update_time` datetime(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
  `remark` varchar(500) DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`column_id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='【系统管理模块 - 代码生成业务表字段】代码生成业务表字段';

-- ----------------------------
-- Records of gen_table_column
-- ----------------------------
BEGIN;
COMMIT;

-- ----------------------------
-- Table structure for sys_config
-- ----------------------------
DROP TABLE IF EXISTS `sys_config`;
CREATE TABLE `sys_config` (
  `config_id` int NOT NULL AUTO_INCREMENT COMMENT '参数主键',
  `config_name` varchar(100) NOT NULL DEFAULT '' COMMENT '参数名称',
  `config_key` varchar(100) NOT NULL DEFAULT '' COMMENT '参数键名',
  `config_value` varchar(500) NOT NULL DEFAULT '' COMMENT '参数键值',
  `config_type` char(1) NOT NULL DEFAULT 'N' COMMENT '系统内置',
  `create_by` varchar(64) NOT NULL DEFAULT '' COMMENT '创建者',
  `create_time` datetime(6) DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `update_by` varchar(64) NOT NULL DEFAULT '' COMMENT '更新者',
  `update_time` datetime(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
  `remark` varchar(500) DEFAULT NULL COMMENT '备注',
  `status` char(1) NOT NULL DEFAULT '0' COMMENT '状态',
  `del_flag` char(1) NOT NULL DEFAULT '0' COMMENT '删除标志',
  PRIMARY KEY (`config_id`)
) ENGINE=InnoDB AUTO_INCREMENT=100 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='【系统管理模块 - 参数配置表】参数配置表';

-- ----------------------------
-- Records of sys_config
-- ----------------------------
BEGIN;
INSERT INTO `sys_config` (`config_id`, `config_name`, `config_key`, `config_value`, `config_type`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `status`, `del_flag`) VALUES (1, '主框架页-默认皮肤样式名称', 'sys.index.skinName', 'skin-blue', 'Y', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '蓝色 skin-blue、绿色 skin-green、紫色 skin-purple、红色 skin-red、黄色 skin-yellow', '0', '0');
INSERT INTO `sys_config` (`config_id`, `config_name`, `config_key`, `config_value`, `config_type`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `status`, `del_flag`) VALUES (2, '用户管理-账号初始密码', 'sys.user.initPassword', '123456', 'Y', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '初始化密码 123456', '0', '0');
INSERT INTO `sys_config` (`config_id`, `config_name`, `config_key`, `config_value`, `config_type`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `status`, `del_flag`) VALUES (3, '主框架页-侧边栏主题', 'sys.index.sideTheme', 'theme-dark', 'Y', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '深色主题theme-dark，浅色主题theme-light', '0', '0');
INSERT INTO `sys_config` (`config_id`, `config_name`, `config_key`, `config_value`, `config_type`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `status`, `del_flag`) VALUES (4, '账号自助-验证码开关', 'sys.account.captchaEnabled', 'true', 'Y', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '是否开启验证码功能（true开启，false关闭）', '0', '0');
INSERT INTO `sys_config` (`config_id`, `config_name`, `config_key`, `config_value`, `config_type`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `status`, `del_flag`) VALUES (5, '账号自助-是否开启用户注册功能', 'sys.account.registerUser', 'false', 'Y', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '是否开启注册用户功能（true开启，false关闭）', '0', '0');
INSERT INTO `sys_config` (`config_id`, `config_name`, `config_key`, `config_value`, `config_type`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `status`, `del_flag`) VALUES (6, '用户登录-黑名单列表', 'sys.login.blackIPList', '', 'Y', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '设置登录IP黑名单限制，多个匹配项以;分隔，支持匹配（*通配、网段）', '0', '0');
INSERT INTO `sys_config` (`config_id`, `config_name`, `config_key`, `config_value`, `config_type`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `status`, `del_flag`) VALUES (7, '数据库备份周期', 'sys.backup.cron', '0 0 2 * * *', 'Y', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '备份任务的Cron表达式，默认每天凌晨2点', '0', '0');
INSERT INTO `sys_config` (`config_id`, `config_name`, `config_key`, `config_value`, `config_type`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `status`, `del_flag`) VALUES (8, '数据库备份最大保留数量', 'sys.backup.limit', '30', 'Y', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '超出该数量后自动删除最旧的备份文件', '0', '0');
INSERT INTO `sys_config` (`config_id`, `config_name`, `config_key`, `config_value`, `config_type`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `status`, `del_flag`) VALUES (9, '数据库备份存储路径', 'sys.backup.path', '../upload/backups', 'Y', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '备份文件存放的相对目录', '0', '0');
INSERT INTO `sys_config` (`config_id`, `config_name`, `config_key`, `config_value`, `config_type`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `status`, `del_flag`) VALUES (10, '网站Logo', 'sys.web.logo', 'https://example.com/logo.png', 'Y', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '网站Logo URL地址', '0', '0');
INSERT INTO `sys_config` (`config_id`, `config_name`, `config_key`, `config_value`, `config_type`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `status`, `del_flag`) VALUES (11, '网站名称', 'sys.web.siteName', 'Nest Admin', 'Y', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '网站显示的全局名称', '0', '0');
INSERT INTO `sys_config` (`config_id`, `config_name`, `config_key`, `config_value`, `config_type`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `status`, `del_flag`) VALUES (12, '网站标题', 'sys.web.title', 'Nest Admin 后台管理系统', 'Y', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '浏览器标签页标题', '0', '0');
INSERT INTO `sys_config` (`config_id`, `config_name`, `config_key`, `config_value`, `config_type`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `status`, `del_flag`) VALUES (13, '网站描述', 'sys.web.description', '一款基于 NestJS + Vue3 的后台管理系统', 'Y', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '网站SEO描述信息', '0', '0');
INSERT INTO `sys_config` (`config_id`, `config_name`, `config_key`, `config_value`, `config_type`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `status`, `del_flag`) VALUES (14, '系统主色调', 'sys.web.primaryColor', '#111827', 'Y', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '系统全局主色调', '0', '0');
INSERT INTO `sys_config` (`config_id`, `config_name`, `config_key`, `config_value`, `config_type`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `status`, `del_flag`) VALUES (15, '存储方式', 'sys.storage.type', 'local', 'Y', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '存储方式 (local/oss)', '0', '0');
INSERT INTO `sys_config` (`config_id`, `config_name`, `config_key`, `config_value`, `config_type`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `status`, `del_flag`) VALUES (16, '本地存储路径', 'sys.storage.local.path', '/upload/files', 'Y', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '本地存储目录', '0', '0');
INSERT INTO `sys_config` (`config_id`, `config_name`, `config_key`, `config_value`, `config_type`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `status`, `del_flag`) VALUES (17, 'OSS Endpoint', 'sys.storage.oss.endpoint', 'oss-cn-hangzhou.aliyuncs.com', 'Y', 'admin', '2025-02-28 16:52:10.000000', '', NULL, 'OSS Endpoint', '0', '0');
INSERT INTO `sys_config` (`config_id`, `config_name`, `config_key`, `config_value`, `config_type`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `status`, `del_flag`) VALUES (18, 'OSS AccessKey', 'sys.storage.oss.accessKey', '', 'Y', 'admin', '2025-02-28 16:52:10.000000', '', NULL, 'OSS AccessKey', '0', '0');
INSERT INTO `sys_config` (`config_id`, `config_name`, `config_key`, `config_value`, `config_type`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `status`, `del_flag`) VALUES (19, 'OSS SecretKey', 'sys.storage.oss.secretKey', '', 'Y', 'admin', '2025-02-28 16:52:10.000000', '', NULL, 'OSS SecretKey', '0', '0');
INSERT INTO `sys_config` (`config_id`, `config_name`, `config_key`, `config_value`, `config_type`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `status`, `del_flag`) VALUES (20, 'OSS Bucket', 'sys.storage.oss.bucket', 'my-bucket', 'Y', 'admin', '2025-02-28 16:52:10.000000', '', NULL, 'OSS Bucket名称', '0', '0');
INSERT INTO `sys_config` (`config_id`, `config_name`, `config_key`, `config_value`, `config_type`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `status`, `del_flag`) VALUES (21, 'SMTP 服务器', 'sys.mail.smtp', 'smtp.example.com', 'Y', 'admin', '2025-02-28 16:52:10.000000', '', NULL, 'SMTP 发信服务器地址', '0', '0');
INSERT INTO `sys_config` (`config_id`, `config_name`, `config_key`, `config_value`, `config_type`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `status`, `del_flag`) VALUES (22, '短信提供商', 'sys.sms.provider', 'aliyun', 'Y', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '短信网关提供商', '0', '0');

-- GIS 地图相关配置初始化
INSERT INTO `sys_config` (`config_id`, `config_name`, `config_key`, `config_value`, `config_type`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `status`, `del_flag`) VALUES (23, 'GIS地图来源', 'gis.map.source', 'amap', 'Y', 'admin', '2026-04-26 12:00:00.000000', '', NULL, 'GIS系统自动生成配置', '0', '0');
INSERT INTO `sys_config` (`config_id`, `config_name`, `config_key`, `config_value`, `config_type`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `status`, `del_flag`) VALUES (24, '默认坐标转换规则', 'gis.coord.transform', 'custom_proj4', 'Y', 'admin', '2026-04-26 12:00:00.000000', '', NULL, 'GIS系统自动生成配置', '0', '0');
INSERT INTO `sys_config` (`config_id`, `config_name`, `config_key`, `config_value`, `config_type`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `status`, `del_flag`) VALUES (25, '自定义Proj4投影参数', 'gis.custom.proj4', '+proj=tmerc +lat_0=0 +lon_0=117 +k=1 +x_0=39500000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs', 'Y', 'admin', '2026-04-26 12:00:00.000000', '', NULL, 'GIS系统自动生成配置', '0', '0');
INSERT INTO `sys_config` (`config_id`, `config_name`, `config_key`, `config_value`, `config_type`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `status`, `del_flag`) VALUES (26, '高德地图Key', 'gis.map.amap.key', 'f2ce1125b07fe3e22ebd5924b75ca6d1', 'Y', 'admin', '2026-04-26 12:00:00.000000', '', NULL, 'GIS系统自动生成配置', '0', '0');
INSERT INTO `sys_config` (`config_id`, `config_name`, `config_key`, `config_value`, `config_type`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `status`, `del_flag`) VALUES (27, '高德地图安全密钥', 'gis.map.amap.security', '610162c69ef7947baf638e9b445316c5', 'Y', 'admin', '2026-04-26 12:00:00.000000', '', NULL, 'GIS系统自动生成配置', '0', '0');
INSERT INTO `sys_config` (`config_id`, `config_name`, `config_key`, `config_value`, `config_type`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `status`, `del_flag`) VALUES (28, 'GIS地图主题风格', 'gis.map.style', 'amap://styles/light', 'Y', 'admin', '2026-04-26 12:00:00.000000', '', NULL, 'GIS系统自动生成配置', '0', '0');
INSERT INTO `sys_config` (`config_id`, `config_name`, `config_key`, `config_value`, `config_type`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `status`, `del_flag`) VALUES (32, 'GIS默认中心经度', 'gis.map.center.lng', '118.60', 'Y', 'admin', '2026-04-26 12:00:00.000000', '', NULL, 'GIS系统自动生成配置', '0', '0');
INSERT INTO `sys_config` (`config_id`, `config_name`, `config_key`, `config_value`, `config_type`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `status`, `del_flag`) VALUES (33, 'GIS默认中心纬度', 'gis.map.center.lat', '24.90', 'Y', 'admin', '2026-04-26 12:00:00.000000', '', NULL, 'GIS系统自动生成配置', '0', '0');
INSERT INTO `sys_config` (`config_id`, `config_name`, `config_key`, `config_value`, `config_type`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `status`, `del_flag`) VALUES (34, 'GIS默认缩放级别', 'gis.map.zoom', '12', 'Y', 'admin', '2026-04-26 12:00:00.000000', '', NULL, 'GIS系统自动生成配置', '0', '0');

-- DMA 业务相关配置初始化
INSERT INTO `sys_config` (`config_id`, `config_name`, `config_key`, `config_value`, `config_type`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `status`, `del_flag`) VALUES (29, '夜间最小流量起始时间', 'zone.night.flow.start', '02:00', 'Y', 'admin', '2026-04-26 12:00:00.000000', '', NULL, 'DMA业务自动生成配置', '0', '0');
INSERT INTO `sys_config` (`config_id`, `config_name`, `config_key`, `config_value`, `config_type`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `status`, `del_flag`) VALUES (30, '夜间最小流量结束时间', 'zone.night.flow.end', '04:00', 'Y', 'admin', '2026-04-26 12:00:00.000000', '', NULL, 'DMA业务自动生成配置', '0', '0');
INSERT INTO `sys_config` (`config_id`, `config_name`, `config_key`, `config_value`, `config_type`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `status`, `del_flag`) VALUES (31, '营收计算策略', 'revenue.calc.strategy', 'month_to_day', 'Y', 'admin', '2026-04-26 12:00:00.000000', '', NULL, 'DMA业务自动生成配置', '0', '0');

COMMIT; -- 【系统管理模块 - 配置表】

-- ----------------------------
-- Table structure for sys_dept
-- ----------------------------
DROP TABLE IF EXISTS `sys_dept`;
CREATE TABLE `sys_dept` (
  `dept_id` int NOT NULL AUTO_INCREMENT COMMENT '部门ID',
  `parent_id` int NOT NULL DEFAULT '0' COMMENT '父部门ID',
  `ancestors` varchar(50) NOT NULL DEFAULT '0' COMMENT '祖级列表',
  `dept_name` varchar(30) NOT NULL COMMENT '部门名称',
  `order_num` int NOT NULL DEFAULT '0' COMMENT '显示顺序',
  `leader` varchar(20) NOT NULL COMMENT '负责人',
  `phone` varchar(11) NOT NULL DEFAULT '' COMMENT '联系电话',
  `email` varchar(50) NOT NULL DEFAULT '' COMMENT '邮箱',
  `status` char(1) NOT NULL DEFAULT '0' COMMENT '状态',
  `del_flag` char(1) NOT NULL DEFAULT '0' COMMENT '删除标志',
  `create_by` varchar(64) NOT NULL DEFAULT '' COMMENT '创建者',
  `create_time` datetime(6) DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `update_by` varchar(64) NOT NULL DEFAULT '' COMMENT '更新者',
  `update_time` datetime(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
  `remark` varchar(500) DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`dept_id`)
) ENGINE=InnoDB AUTO_INCREMENT=200 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='【系统管理模块 - 部门表】部门表';

-- ----------------------------
-- Records of sys_dept
-- ----------------------------
BEGIN;
INSERT INTO `sys_dept` (`dept_id`, `parent_id`, `ancestors`, `dept_name`, `order_num`, `leader`, `phone`, `email`, `status`, `del_flag`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`) VALUES (100, 0, '0', 'nest-admin科技', 0, 'nest-admin', '15888888888', 'ry@qq.com', '0', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, NULL);
INSERT INTO `sys_dept` (`dept_id`, `parent_id`, `ancestors`, `dept_name`, `order_num`, `leader`, `phone`, `email`, `status`, `del_flag`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`) VALUES (101, 100, '0,100', '深圳总公司', 1, 'nest-admin', '15888888888', 'ry@qq.com', '0', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, NULL);
INSERT INTO `sys_dept` (`dept_id`, `parent_id`, `ancestors`, `dept_name`, `order_num`, `leader`, `phone`, `email`, `status`, `del_flag`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`) VALUES (102, 100, '0,100', '长沙分公司', 2, 'nest-admin', '15888888888', 'ry@qq.com', '0', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, NULL);
INSERT INTO `sys_dept` (`dept_id`, `parent_id`, `ancestors`, `dept_name`, `order_num`, `leader`, `phone`, `email`, `status`, `del_flag`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`) VALUES (103, 101, '0,100,101', '研发部门', 1, 'nest-admin', '15888888888', 'ry@qq.com', '0', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, NULL);
INSERT INTO `sys_dept` (`dept_id`, `parent_id`, `ancestors`, `dept_name`, `order_num`, `leader`, `phone`, `email`, `status`, `del_flag`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`) VALUES (104, 101, '0,100,101', '市场部门', 2, 'nest-admin', '15888888888', 'ry@qq.com', '0', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, NULL);
INSERT INTO `sys_dept` (`dept_id`, `parent_id`, `ancestors`, `dept_name`, `order_num`, `leader`, `phone`, `email`, `status`, `del_flag`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`) VALUES (105, 101, '0,100,101', '测试部门', 3, 'nest-admin', '15888888888', 'ry@qq.com', '0', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, NULL);
INSERT INTO `sys_dept` (`dept_id`, `parent_id`, `ancestors`, `dept_name`, `order_num`, `leader`, `phone`, `email`, `status`, `del_flag`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`) VALUES (106, 101, '0,100,101', '财务部门', 4, 'nest-admin', '15888888888', 'ry@qq.com', '0', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, NULL);
INSERT INTO `sys_dept` (`dept_id`, `parent_id`, `ancestors`, `dept_name`, `order_num`, `leader`, `phone`, `email`, `status`, `del_flag`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`) VALUES (107, 101, '0,100,101', '运维部门', 5, 'nest-admin', '15888888888', 'ry@qq.com', '0', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, NULL);
INSERT INTO `sys_dept` (`dept_id`, `parent_id`, `ancestors`, `dept_name`, `order_num`, `leader`, `phone`, `email`, `status`, `del_flag`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`) VALUES (108, 102, '0,100,102', '市场部门', 1, 'nest-admin', '15888888888', 'ry@qq.com', '0', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, NULL);
INSERT INTO `sys_dept` (`dept_id`, `parent_id`, `ancestors`, `dept_name`, `order_num`, `leader`, `phone`, `email`, `status`, `del_flag`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`) VALUES (109, 102, '0,100,102', '财务部门', 2, 'nest-admin', '15888888888', 'ry@qq.com', '0', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, NULL);
COMMIT; -- 【系统管理模块 - 部门表】

-- ----------------------------
-- Table structure for sys_dict_data
-- ----------------------------
DROP TABLE IF EXISTS `sys_dict_data`;
CREATE TABLE `sys_dict_data` (
  `dict_code` int NOT NULL AUTO_INCREMENT COMMENT '字典主键',
  `dict_sort` int NOT NULL DEFAULT '0' COMMENT '字典排序',
  `dict_label` varchar(100) NOT NULL COMMENT '字典标签',
  `dict_value` varchar(100) NOT NULL COMMENT '字典键值',
  `dict_type` varchar(100) NOT NULL COMMENT '字典类型',
  `css_class` varchar(100) NOT NULL DEFAULT '' COMMENT '样式属性',
  `list_class` varchar(100) NOT NULL COMMENT '表格回显样式',
  `is_default` char(1) NOT NULL DEFAULT 'N' COMMENT '是否默认',
  `status` char(1) NOT NULL DEFAULT '0' COMMENT '状态',
  `create_by` varchar(64) NOT NULL DEFAULT '' COMMENT '创建者',
  `create_time` datetime(6) DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `update_by` varchar(64) NOT NULL DEFAULT '' COMMENT '更新者',
  `update_time` datetime(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
  `remark` varchar(500) DEFAULT NULL COMMENT '备注',
  `del_flag` char(1) NOT NULL DEFAULT '0' COMMENT '删除标志',
  PRIMARY KEY (`dict_code`)
) ENGINE=InnoDB AUTO_INCREMENT=100 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='【系统管理模块 - 字典数据表】字典数据表';

-- ----------------------------
-- Records of sys_dict_data
-- ----------------------------
BEGIN;
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1, 1, '男', '0', 'sys_user_sex', '', '', 'Y', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '性别男', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (2, 2, '女', '1', 'sys_user_sex', '', '', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '性别女', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (3, 3, '未知', '2', 'sys_user_sex', '', '', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '性别未知', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (4, 1, '显示', '0', 'sys_show_hide', '', 'primary', 'Y', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '显示菜单', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (5, 2, '隐藏', '1', 'sys_show_hide', '', 'danger', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '隐藏菜单', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (6, 1, '正常', '0', 'sys_normal_disable', '', 'primary', 'Y', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '正常状态', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (7, 2, '停用', '1', 'sys_normal_disable', '', 'danger', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '停用状态', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (8, 1, '正常', '0', 'sys_job_status', '', 'primary', 'Y', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '正常状态', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (9, 2, '暂停', '1', 'sys_job_status', '', 'danger', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '停用状态', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (10, 1, '默认', 'DEFAULT', 'sys_job_group', '', '', 'Y', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '默认分组', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (11, 2, '系统', 'SYSTEM', 'sys_job_group', '', '', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '系统分组', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (12, 1, '是', 'Y', 'sys_yes_no', '', 'primary', 'Y', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '系统默认是', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (13, 2, '否', 'N', 'sys_yes_no', '', 'danger', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '系统默认否', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (14, 1, '通知', '1', 'sys_notice_type', '', 'warning', 'Y', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '通知', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (15, 2, '公告', '2', 'sys_notice_type', '', 'success', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '公告', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (16, 1, '正常', '0', 'sys_notice_status', '', 'primary', 'Y', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '正常状态', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (17, 2, '关闭', '1', 'sys_notice_status', '', 'danger', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '关闭状态', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (18, 99, '其他', '0', 'sys_oper_type', '', 'info', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '其他操作', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (19, 1, '新增', '1', 'sys_oper_type', '', 'info', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '新增操作', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (20, 2, '修改', '2', 'sys_oper_type', '', 'info', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '修改操作', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (21, 3, '删除', '3', 'sys_oper_type', '', 'danger', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '删除操作', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (22, 4, '授权', '4', 'sys_oper_type', '', 'primary', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '授权操作', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (23, 5, '导出', '5', 'sys_oper_type', '', 'warning', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '导出操作', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (24, 6, '导入', '6', 'sys_oper_type', '', 'warning', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '导入操作', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (25, 7, '强退', '7', 'sys_oper_type', '', 'danger', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '强退操作', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (26, 8, '生成代码', '8', 'sys_oper_type', '', 'warning', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '生成操作', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (27, 9, '清空数据', '9', 'sys_oper_type', '', 'danger', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '清空操作', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (28, 1, '成功', '0', 'sys_common_status', '', 'primary', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '正常状态', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (29, 2, '失败', '1', 'sys_common_status', '', 'danger', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '停用状态', '0');
-- 站点类型字典数据
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (30, 1, '水厂', '1', 'water_station_type', '', 'primary', 'Y', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '水厂站点', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (31, 2, '泵站', '2', 'water_station_type', '', 'success', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '泵站站点', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (32, 3, '二次供水', '3', 'water_station_type', '', 'info', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '水库站点', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (33, 4, '管网监测点', '4', 'water_station_type', '', 'warning', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '污水处理厂', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (34, 5, '污水处理厂', '5', 'water_station_type', '', 'danger', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '管网监测点', '0');
-- 设备类型字典数据
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (35, 1, '水泵', '1', 'water_device_type', '', 'primary', 'Y', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '水泵设备', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (36, 2, '阀门', '2', 'water_device_type', '', 'success', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '阀门设备', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (37, 3, '流量计', '3', 'water_device_type', '', 'info', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '流量计', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (38, 4, '压力计', '4', 'water_device_type', '', 'warning', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '压力计', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (39, 5, '水质分析仪', '5', 'water_device_type', '', 'danger', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '水质分析仪', '0');
-- 测点类型字典数据
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (40, 1, '流量', '1', 'water_point_type', '', 'primary', 'Y', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '流量测点', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (45, 1, '在线', '0', 'iot_device_status', '', 'success', 'Y', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '在线状态', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (46, 2, '异常', '1', 'iot_device_status', '', 'warning', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '异常状态', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (47, 3, '离线', '2', 'iot_device_status', '', 'info', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '离线状态', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (48, 4, '报警', '3', 'iot_device_status', '', 'danger', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '报警状态', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (49, 2, '累计流量', '2', 'water_point_type', '', 'primary', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '累计流量测点', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (50, 3, '瞬时流量', '3', 'water_point_type', '', 'primary', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '瞬时流量测点', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (51, 4, '进水流量', '4', 'water_point_type', '', 'primary', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '进水流量测点', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (52, 5, '出水流量', '5', 'water_point_type', '', 'primary', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '出水流量测点', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (53, 6, '原水流量', '6', 'water_point_type', '', 'primary', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '原水流量测点', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (54, 7, '清水流量', '7', 'water_point_type', '', 'primary', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '清水流量测点', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (55, 8, '压力', '8', 'water_point_type', '', 'success', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '压力测点', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (56, 9, '进水压力', '9', 'water_point_type', '', 'success', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '进水压力测点', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (57, 10, '出水压力', '10', 'water_point_type', '', 'success', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '出水压力测点', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (58, 11, '管网压力', '11', 'water_point_type', '', 'success', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '管网压力测点', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (59, 12, '泵站压力', '12', 'water_point_type', '', 'success', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '泵站压力测点', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (60, 13, '液位', '13', 'water_point_type', '', 'info', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '液位测点', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (61, 14, '水库液位', '14', 'water_point_type', '', 'info', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '水库液位测点', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (62, 15, '水池液位', '15', 'water_point_type', '', 'info', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '水池液位测点', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (63, 16, '水井液位', '16', 'water_point_type', '', 'info', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '水井液位测点', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (64, 17, '余氯', '17', 'water_point_type', '', 'warning', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '余氯测点', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (65, 18, '浊度', '18', 'water_point_type', '', 'danger', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '浊度测点', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (66, 19, 'PH值', '19', 'water_point_type', '', 'default', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, 'PH值测点', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (67, 20, '高锰酸盐指数', '20', 'water_point_type', '', 'warning', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '高锰酸盐指数测点', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (68, 21, '氨氮', '21', 'water_point_type', '', 'warning', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '氨氮测点', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (69, 22, '溶解氧', '22', 'water_point_type', '', 'info', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '溶解氧测点', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (70, 23, '温度', '23', 'water_point_type', '', 'info', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '温度测点', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (71, 24, '设备状态', '24', 'water_point_type', '', 'default', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '设备状态测点', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (72, 25, '阀门状态', '25', 'water_point_type', '', 'default', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '阀门状态测点', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (73, 26, '水泵状态', '26', 'water_point_type', '', 'default', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '水泵状态测点', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (74, 27, '风机状态', '27', 'water_point_type', '', 'default', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '风机状态测点', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (75, 28, '电量', '28', 'water_point_type', '', 'warning', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '电量测点', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (76, 29, '功率', '29', 'water_point_type', '', 'warning', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '功率测点', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (77, 30, '电流', '30', 'water_point_type', '', 'warning', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '电流测点', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (78, 31, '电压', '31', 'water_point_type', '', 'warning', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '电压测点', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (79, 32, '频率', '32', 'water_point_type', '', 'info', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '频率测点', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (80, 33, '时间', '33', 'water_point_type', '', 'info', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '时间测点', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (81, 34, '进水余氯', '34', 'water_point_type', '', 'warning', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '进水余氯测点', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (82, 35, '出水余氯', '35', 'water_point_type', '', 'warning', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '出水余氯测点', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (83, 36, '进水浊度', '36', 'water_point_type', '', 'danger', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '进水浊度测点', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (84, 37, '出水浊度', '37', 'water_point_type', '', 'danger', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '出水浊度测点', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (85, 38, '进水PH值', '38', 'water_point_type', '', 'default', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '进水PH值测点', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (86, 39, '出水PH值', '39', 'water_point_type', '', 'default', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '出水PH值测点', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (87, 40, '转速', '40', 'water_point_type', '', 'info', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '转速测点', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (88, 41, '进水高锰酸盐指数', '41', 'water_point_type', '', 'warning', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '进水高锰酸盐指数测点', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (89, 42, '出水高锰酸盐指数', '42', 'water_point_type', '', 'warning', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '出水高锰酸盐指数测点', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (90, 43, '进水氨氮', '43', 'water_point_type', '', 'warning', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '进水氨氮测点', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (91, 44, '出水氨氮', '44', 'water_point_type', '', 'warning', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '出水氨氮测点', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (92, 45, '进水溶解氧', '45', 'water_point_type', '', 'info', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '进水溶解氧测点', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (93, 46, '出水溶解氧', '46', 'water_point_type', '', 'info', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '出水溶解氧测点', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (94, 47, '进水温度', '47', 'water_point_type', '', 'info', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '进水温度测点', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (95, 48, '出水温度', '48', 'water_point_type', '', 'info', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '出水温度测点', '0');
-- 用户水卡分类字典数据
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (96, 1, '居民', 'A', 'water_card_category', '', 'primary', 'Y', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '居民', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (97, 2, '特种', 'B', 'water_card_category', '', 'danger', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '特种', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (98, 3, '其他', 'C', 'water_card_category', '', 'info', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '其他', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (99, 4, '非居民', 'D', 'water_card_category', '', 'warning', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '非居民', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (100, 5, '武荣水价', 'E', 'water_card_category', '', 'success', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '武荣水价', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (101, 6, '复核表(不计费)', 'F', 'water_card_category', '', 'default', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '复核表(不计费)', '0');
-- 用户分类字典数据
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (102, 1, '1-1民用居民有物业', 'A01', 'water_user_category', '', 'default', 'Y', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (103, 2, '1-2民用居民无物业', 'A02', 'water_user_category', '', 'default', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (104, 3, '1-3民用不收有物业', 'A03', 'water_user_category', '', 'default', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (105, 4, '1-4民用不收有物业季节', 'A04', 'water_user_category', '', 'default', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (106, 5, '1-5民用居民有物业季节', 'A05', 'water_user_category', '', 'default', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (107, 6, '1-6民用居民无物业季节', 'A06', 'water_user_category', '', 'default', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (108, 7, '1-7民用居民不收季节', 'A07', 'water_user_category', '', 'default', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (109, 8, '民用居民二阶', 'A08', 'water_user_category', '', 'default', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (110, 9, '民用居民三阶', 'A09', 'water_user_category', '', 'default', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (111, 10, '民用无污水费二阶', 'A10', 'water_user_category', '', 'default', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (112, 11, '民用无污水费三阶', 'A11', 'water_user_category', '', 'default', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (113, 12, '民用不收有物业二阶', 'A12', 'water_user_category', '', 'default', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (114, 13, '季节性价格', 'A13', 'water_user_category', '', 'default', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (115, 14, '1-14民用不收公共事业', 'A14', 'water_user_category', '', 'default', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (116, 15, '1-15民用居民商业', 'A15', 'water_user_category', '', 'default', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (117, 16, '1-20民用居民不收', 'A16', 'water_user_category', '', 'default', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (118, 17, '新建特殊', 'A20', 'water_user_category', '', 'default', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (119, 18, '民用居民机关团体或其他', 'A21', 'water_user_category', '', 'default', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (120, 19, '2-1特种非居民不收', 'B01', 'water_user_category', '', 'default', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (121, 20, '2-2特种非居民商业', 'B02', 'water_user_category', '', 'default', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (122, 21, '2-3特种非居民其他', 'B03', 'water_user_category', '', 'default', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (123, 22, '2-4特种非居民无物业', 'B04', 'water_user_category', '', 'default', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (124, 23, '特种非居民机关团体', 'B05', 'water_user_category', '', 'default', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (125, 24, '特种居民无物业', 'B06', 'water_user_category', '', 'default', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (126, 25, '特种非居民农贸市场', 'B07', 'water_user_category', '', 'default', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (127, 26, '特种居民不收', 'B08', 'water_user_category', '', 'default', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (128, 27, '特种非居民工业', 'B09', 'water_user_category', '', 'default', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (129, 28, '3-1其他非居民不收', 'C01', 'water_user_category', '', 'default', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (130, 29, '3-2其他非居民机关团体', 'C02', 'water_user_category', '', 'default', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (131, 30, '3-3其他非居民企业中其他', 'C03', 'water_user_category', '', 'default', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (132, 31, '3-4其他非居民商业', 'C04', 'water_user_category', '', 'default', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (133, 32, '3-5其他非居民工业', 'C05', 'water_user_category', '', 'default', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (134, 33, '3-6其他非居民农贸市场', 'C06', 'water_user_category', '', 'default', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (135, 34, '3-7其他不收企业中其他', 'C07', 'water_user_category', '', 'default', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (136, 35, '3-8其他不收不收', 'C08', 'water_user_category', '', 'default', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (137, 36, '3-9其他非居民有物业', 'C09', 'water_user_category', '', 'default', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (138, 37, '3-10其他不收商业', 'C10', 'water_user_category', '', 'default', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (139, 38, '3-11特殊水价', 'C11', 'water_user_category', '', 'default', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (140, 39, '其他居民无物业', 'C13', 'water_user_category', '', 'default', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (141, 40, '其他居民不收', 'C14', 'water_user_category', '', 'default', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (142, 41, '其他居民有物业', 'C15', 'water_user_category', '', 'default', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (143, 42, '其他居民机关团体', 'C16', 'water_user_category', '', 'default', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (144, 43, '1-8民用不收不收', 'D01', 'water_user_category', '', 'default', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (145, 44, '1-9民用非居民不收', 'D02', 'water_user_category', '', 'default', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (146, 45, '1-10民用非居民机关团体', 'D03', 'water_user_category', '', 'default', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (147, 46, '民用非居民不收（消防五倍）', 'D04', 'water_user_category', '', 'default', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (148, 47, '民用非居民农贸市场', 'D06', 'water_user_category', '', 'default', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (149, 48, '民用非居民工业', 'D08', 'water_user_category', '', 'default', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (150, 49, '民用非居民不收（消防单倍）', 'D09', 'water_user_category', '', 'default', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (151, 50, '民用非居民（消防五倍）不收不收', 'D10', 'water_user_category', '', 'default', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (152, 51, '武荣无污水无垃圾', 'E01', 'water_user_category', '', 'default', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (153, 52, '复核表零水费', 'F01', 'water_user_category', '', 'default', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (154, 1, '瞬时', 'instantaneous', 'water_point_agg_type', '', 'default', 'Y', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '瞬时值，聚合取平均(AVG)，插值按线性(LINEAR)', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (155, 2, '累计', 'cumulative', 'water_point_agg_type', '', 'default', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '累计值，聚合取最新(LAST)，插值继承上一条(PREV)', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (156, 3, '增长量', 'incremental', 'water_point_agg_type', '', 'default', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '增长量，聚合取总和(SUM)，插值补0(VALUE,0)', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (157, 1, '设备报警', '1', 'sys_alarm_rule_type', '', 'primary', 'Y', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '设备报警', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (158, 2, '分区报警', '2', 'sys_alarm_rule_type', '', 'success', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '分区报警', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (159, 3, '系统报警', '3', 'sys_alarm_rule_type', '', 'warning', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '系统报警', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (160, 1, '紧急', '1', 'sys_alarm_level', '', 'danger', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '紧急', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (161, 2, '重要', '2', 'sys_alarm_level', '', 'warning', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '重要', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (162, 3, '次要', '3', 'sys_alarm_level', '', 'primary', 'Y', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '次要', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (163, 4, '提示', '4', 'sys_alarm_level', '', 'info', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '提示', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (164, 1, '未处理', '0', 'sys_alarm_status', '', 'danger', 'Y', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '未处理', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (165, 2, '已处理', '1', 'sys_alarm_status', '', 'success', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '已处理', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (166, 1, '供水管', 'WATER_SUPPLY', 'water_pipe_type', '', 'primary', 'Y', '0', 'admin', NOW(), '', NULL, '供水管线', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (167, 2, '排水管', 'DRAINAGE', 'water_pipe_type', '', 'success', 'N', '0', 'admin', NOW(), '', NULL, '排水管线', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (168, 3, '污水管', 'SEWAGE', 'water_pipe_type', '', 'warning', 'N', '0', 'admin', NOW(), '', NULL, '污水管线', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (169, 4, '回用水管', 'RECLAIMED', 'water_pipe_type', '', 'info', 'N', '0', 'admin', NOW(), '', NULL, '回用水管线', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (170, 1, '未缴', '0', 'water_bill_status', '', 'danger', 'Y', '0', 'admin', NOW(), '', NULL, '未缴纳', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (171, 2, '部分缴纳', '1', 'water_bill_status', '', 'warning', 'N', '0', 'admin', NOW(), '', NULL, '部分已缴', '0');
INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (172, 3, '已缴清', '2', 'water_bill_status', '', 'success', 'N', '0', 'admin', NOW(), '', NULL, '已全部缴纳', '0');
COMMIT;



-- ----------------------------
-- Table structure for sys_dict_type
-- ----------------------------
DROP TABLE IF EXISTS `sys_dict_type`;
CREATE TABLE `sys_dict_type` (
  `dict_id` int NOT NULL AUTO_INCREMENT COMMENT '字典主键',
  `dict_name` varchar(100) NOT NULL COMMENT '字典名称',
  `dict_type` varchar(100) NOT NULL COMMENT '字典类型',
  `status` char(1) NOT NULL DEFAULT '0' COMMENT '状态',
  `create_by` varchar(64) NOT NULL DEFAULT '' COMMENT '创建者',
  `create_time` datetime(6) DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `update_by` varchar(64) NOT NULL DEFAULT '' COMMENT '更新者',
  `update_time` datetime(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
  `remark` varchar(500) DEFAULT NULL COMMENT '备注',
  `del_flag` char(1) NOT NULL DEFAULT '0' COMMENT '删除标志',
  PRIMARY KEY (`dict_id`),
  UNIQUE KEY `IDX_f4e4273658733a3bbe6a2479bf` (`dict_type`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='【系统管理模块 - 字典类型表】字典类型表';

-- ----------------------------
-- Records of sys_dict_type
-- ----------------------------
BEGIN;
INSERT INTO `sys_dict_type` (`dict_id`, `dict_name`, `dict_type`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1, '用户性别', 'sys_user_sex', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '用户性别列表', '0');
INSERT INTO `sys_dict_type` (`dict_id`, `dict_name`, `dict_type`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (2, '菜单状态', 'sys_show_hide', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '菜单状态列表', '0');
INSERT INTO `sys_dict_type` (`dict_id`, `dict_name`, `dict_type`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (3, '系统开关', 'sys_normal_disable', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '系统开关列表', '0');
INSERT INTO `sys_dict_type` (`dict_id`, `dict_name`, `dict_type`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (4, '任务状态', 'sys_job_status', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '任务状态列表', '0');
INSERT INTO `sys_dict_type` (`dict_id`, `dict_name`, `dict_type`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (5, '任务分组', 'sys_job_group', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '任务分组列表', '0');
INSERT INTO `sys_dict_type` (`dict_id`, `dict_name`, `dict_type`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (6, '系统是否', 'sys_yes_no', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '系统是否列表', '0');
INSERT INTO `sys_dict_type` (`dict_id`, `dict_name`, `dict_type`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (7, '通知类型', 'sys_notice_type', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '通知类型列表', '0');
INSERT INTO `sys_dict_type` (`dict_id`, `dict_name`, `dict_type`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (8, '通知状态', 'sys_notice_status', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '通知状态列表', '0');
INSERT INTO `sys_dict_type` (`dict_id`, `dict_name`, `dict_type`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (9, '操作类型', 'sys_oper_type', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '操作类型列表', '0');
INSERT INTO `sys_dict_type` (`dict_id`, `dict_name`, `dict_type`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (10, '系统状态', 'sys_common_status', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '登录状态列表', '0');
INSERT INTO `sys_dict_type` (`dict_id`, `dict_name`, `dict_type`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (11, '站点类型', 'water_station_type', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '智慧水务-站点类型', '0');
INSERT INTO `sys_dict_type` (`dict_id`, `dict_name`, `dict_type`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (12, '设备类型', 'water_device_type', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '智慧水务-设备类型', '0');
INSERT INTO `sys_dict_type` (`dict_id`, `dict_name`, `dict_type`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (13, '测点类型', 'water_point_type', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '智慧水务-测点类型', '0');
INSERT INTO `sys_dict_type` (`dict_id`, `dict_name`, `dict_type`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (14, '物联状态', 'iot_device_status', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '智慧水务-物联状态', '0');
INSERT INTO `sys_dict_type` (`dict_id`, `dict_name`, `dict_type`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (15, '用户水卡分类', 'water_card_category', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '用户水卡分类', '0');
INSERT INTO `sys_dict_type` (`dict_id`, `dict_name`, `dict_type`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (16, '用户分类', 'water_user_category', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '用户分类', '0');
INSERT INTO `sys_dict_type` (`dict_id`, `dict_name`, `dict_type`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (17, '测点聚合模式', 'water_point_agg_type', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '测点在流计算中使用的聚合和插值模式', '0');
INSERT INTO `sys_dict_type` (`dict_id`, `dict_name`, `dict_type`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (18, '报警规则类型', 'sys_alarm_rule_type', '0', 'admin','2025-02-28 16:52:10.000000', '', NULL, '报警规则类型列表', '0');
INSERT INTO `sys_dict_type` (`dict_id`, `dict_name`, `dict_type`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (19, '报警级别', 'sys_alarm_level', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '报警级别列表', '0');
INSERT INTO `sys_dict_type` (`dict_id`, `dict_name`, `dict_type`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (20, '报警处理状态', 'sys_alarm_status', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '报警处理状态列表', '0');
INSERT INTO `sys_dict_type` (`dict_id`, `dict_name`, `dict_type`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (21, '管线类型', 'water_pipe_type', '0', 'admin', NOW(), '', NULL, '智慧水务-管线类型', '0');
INSERT INTO `sys_dict_type` (`dict_id`, `dict_name`, `dict_type`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (22, '账单状态', 'water_bill_status', '0', 'admin', NOW(), '', NULL, '智慧水务-水费账单状态', '0');
COMMIT; -- 【系统管理模块 - 字典类型表】

-- ----------------------------
-- Table structure for sys_job
-- ----------------------------
DROP TABLE IF EXISTS `sys_job`;
CREATE TABLE `sys_job` (
  `job_id` int NOT NULL AUTO_INCREMENT COMMENT '任务ID',
  `job_name` varchar(64) NOT NULL COMMENT '任务名称',
  `job_group` varchar(64) NOT NULL DEFAULT 'DEFAULT' COMMENT '任务组名',
  `invoke_target` varchar(500) NOT NULL COMMENT '调用目标字符串',
  `cron_expression` varchar(255) DEFAULT NULL COMMENT 'cron执行表达式',
  `misfire_policy` varchar(20) DEFAULT '3' COMMENT '计划执行错误策略（1立即执行 2执行一次 3放弃执行）',
  `concurrent` char(1) DEFAULT '1' COMMENT '是否并发执行（0允许 1禁止）',
  `status` char(1) DEFAULT '0' COMMENT '状态（0正常 1暂停）',
  `del_flag` char(1) DEFAULT '0' COMMENT '删除标志',
  `create_by` varchar(64) NOT NULL DEFAULT '' COMMENT '创建者',
  `create_time` datetime(6) DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `update_by` varchar(64) NOT NULL DEFAULT '' COMMENT '更新者',
  `update_time` datetime(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
  `remark` varchar(500) DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`job_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='【系统管理模块 - 定时任务表】定时任务表';

-- ----------------------------
-- Records of sys_job
-- ----------------------------
BEGIN;
INSERT INTO `sys_job` (`job_id`, `job_name`, `job_group`, `invoke_target`, `cron_expression`, `misfire_policy`, `concurrent`, `status`, `del_flag`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`) VALUES (1, '系统默认（无参）', 'DEFAULT', 'task.noParams', '0/10 * * * * ?', '3', '1', '1', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '');
INSERT INTO `sys_job` (`job_id`, `job_name`, `job_group`, `invoke_target`, `cron_expression`, `misfire_policy`, `concurrent`, `status`, `del_flag`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`) VALUES (2, '系统默认（有参）', 'DEFAULT', 'task.params(\'ry\')', '0/15 * * * * ?', '3', '1', '1', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '');
INSERT INTO `sys_job` (`job_id`, `job_name`, `job_group`, `invoke_target`, `cron_expression`, `misfire_policy`, `concurrent`, `status`, `del_flag`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`) VALUES (3, '系统默认（多参）', 'DEFAULT', 'task.multipleParams(\'ry\', true, 2000L, 316.50D, 100)', '0/20 * * * * ?', '3', '1', '1', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '');
INSERT INTO `sys_job` (`job_id`, `job_name`, `job_group`, `invoke_target`, `cron_expression`, `misfire_policy`, `concurrent`, `status`, `del_flag`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`) VALUES (4, '自动缺失检测与回溯补全(营收数据)', 'DEFAULT', 'httpTask.post(''http://127.0.0.1:3007/ingestion/revenue/backtrack'')', '0 0 2 * * ?', '3', '1', '0', '0', 'admin', NOW(), '', NULL, '每天凌晨2点扫描过去7天是否有营收数据断点，并加入补全重试队列');
INSERT INTO `sys_job` (`job_id`, `job_name`, `job_group`, `invoke_target`, `cron_expression`, `misfire_policy`, `concurrent`, `status`, `del_flag`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`) VALUES (5, '分区售水量日聚合计算(产销差)', 'DEFAULT', 'httpTask.post(''http://127.0.0.1:3007/report/trigger-daily-agg'')', '0 0 3 * * ?', '3', '1', '0', '0', 'admin', NOW(), '', NULL, '每天凌晨3点自动触发昨日的底层分区用户售水量聚合计算');
INSERT INTO `sys_job` (`job_id`, `job_name`, `job_group`, `invoke_target`, `cron_expression`, `misfire_policy`, `concurrent`, `status`, `del_flag`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`) VALUES (6, '分区售水量月聚合计算(产销差)', 'DEFAULT', 'httpTask.post(''http://127.0.0.1:3007/report/trigger-monthly-agg'')', '0 0 4 1 * ?', '3', '1', '0', '0', 'admin', NOW(), '', NULL, '每月1号凌晨4点自动触发上一个月的底层分区售水量聚合计算');
INSERT INTO `sys_job` (`job_id`, `job_name`, `job_group`, `invoke_target`, `cron_expression`, `misfire_policy`, `concurrent`, `status`, `del_flag`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`) VALUES (7, '刷新设备状态树', 'DEFAULT', 'statusEngine.refreshAssetTree()', '0 0 * * * ?', '3', '1', '0', '0', 'admin', NOW(), '', NULL, '每小时全量刷新一次缓存中的设备状态树结构');
INSERT INTO `sys_job` (`job_id`, `job_name`, `job_group`, `invoke_target`, `cron_expression`, `misfire_policy`, `concurrent`, `status`, `del_flag`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`) VALUES (8, '设备在线状态心跳检测', 'DEFAULT', 'statusEngine.checkStatus()', '0 * * * * ?', '3', '1', '0', '0', 'admin', NOW(), '', NULL, '每分钟执行一次所有测点及设备的心跳检测与离线报警联动');
INSERT INTO `sys_job` (`job_id`, `job_name`, `job_group`, `invoke_target`, `cron_expression`, `misfire_policy`, `concurrent`, `status`, `del_flag`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`) VALUES (9, '测点脏数据聚合(5m/1h/1d)', 'DEFAULT', 'httpTask.post(''http://127.0.0.1:3007/tdengine-agg/dirty-points'')', '0 * * * * ?', '3', '1', '0', '0', 'admin', NOW(), '', NULL, '每分钟执行一次，将测点的时序脏数据自动向上聚合计算');
INSERT INTO `sys_job` (`job_id`, `job_name`, `job_group`, `invoke_target`, `cron_expression`, `misfire_policy`, `concurrent`, `status`, `del_flag`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`) VALUES (10, '分区脏数据指标聚合', 'DEFAULT', 'httpTask.post(''http://127.0.0.1:3007/tdengine-agg/dirty-zones'')', '0 */2 * * * ?', '3', '1', '0', '0', 'admin', NOW(), '', NULL, '每2分钟执行一次，对受测点聚合影响的分区指标进行重算');
INSERT INTO `sys_job` (`job_id`, `job_name`, `job_group`, `invoke_target`, `cron_expression`, `misfire_policy`, `concurrent`, `status`, `del_flag`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`) VALUES (11, 'TDengine插入死信重试', 'DEFAULT', 'httpTask.post(''http://127.0.0.1:3007/tdengine-agg/retry-inserts'')', '*/10 * * * * ?', '3', '1', '0', '0', 'admin', NOW(), '', NULL, '每10秒执行一次，重放写入失败的TDengine时序数据');

COMMIT; -- 【系统管理模块 - 任务表】

-- ----------------------------
-- Table structure for sys_job_log
-- ----------------------------
DROP TABLE IF EXISTS `sys_job_log`;
CREATE TABLE `sys_job_log` (
  `job_log_id` int NOT NULL AUTO_INCREMENT COMMENT '任务日志ID',
  `job_name` varchar(64) NOT NULL COMMENT '任务名称',
  `job_group` varchar(64) NOT NULL COMMENT '任务组名',
  `invoke_target` varchar(500) NOT NULL COMMENT '调用目标字符串',
  `job_message` varchar(500) DEFAULT NULL COMMENT '日志信息',
  `status` char(1) NOT NULL DEFAULT '0' COMMENT '执行状态（0正常 1失败）',
  `exception_info` varchar(2000) DEFAULT NULL COMMENT '异常信息',
  `create_time` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  PRIMARY KEY (`job_log_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='【系统管理模块 - 任务日志表】任务调度日志表';

-- ----------------------------
-- Records of sys_job_log
-- ----------------------------
BEGIN;
COMMIT; -- 【系统管理模块 - 任务日志表】

-- ----------------------------
-- Table structure for sys_logininfor
-- ----------------------------
DROP TABLE IF EXISTS `sys_logininfor`;
CREATE TABLE `sys_logininfor` (
  `info_id` int NOT NULL AUTO_INCREMENT COMMENT '访问ID',
  `user_name` varchar(50) NOT NULL DEFAULT '' COMMENT '用户账号',
  `ipaddr` varchar(128) NOT NULL DEFAULT '' COMMENT '登录IP地址',
  `login_location` varchar(255) NOT NULL DEFAULT '' COMMENT '登录地点',
  `browser` varchar(50) NOT NULL DEFAULT '' COMMENT '浏览器类型',
  `os` varchar(50) NOT NULL DEFAULT '' COMMENT '操作系统',
  `status` char(1) NOT NULL DEFAULT '0' COMMENT '状态',
  `msg` varchar(255) NOT NULL DEFAULT '' COMMENT '提示消息',
  `del_flag` char(1) NOT NULL DEFAULT '0' COMMENT '删除标志',
  `login_time` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '访问时间',
  PRIMARY KEY (`info_id`)
) ENGINE=InnoDB AUTO_INCREMENT=100 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='【系统监控模块 - 登录信息表】系统访问记录';

-- ----------------------------
-- Records of sys_logininfor
-- ----------------------------
BEGIN;
COMMIT; -- 【系统监控模块 - 登录信息表】

-- ----------------------------
-- Table structure for sys_menu
-- ----------------------------
DROP TABLE IF EXISTS `sys_menu`;
CREATE TABLE `sys_menu` (
  `menu_id` int NOT NULL AUTO_INCREMENT COMMENT '菜单ID',
  `menu_name` varchar(50) NOT NULL COMMENT '菜单名称',
  `parent_id` int NOT NULL COMMENT '父菜单ID',
  `order_num` int NOT NULL DEFAULT '0' COMMENT '显示顺序',
  `path` varchar(200) NOT NULL DEFAULT '' COMMENT '路由地址',
  `component` varchar(255) DEFAULT NULL COMMENT '组件路径',
  `query` varchar(255) NOT NULL DEFAULT '' COMMENT '路由参数',
  `is_frame` char(1) NOT NULL DEFAULT '1' COMMENT '是否为外链',
  `is_cache` char(1) NOT NULL DEFAULT '0' COMMENT '是否缓存',
  `menu_type` char(1) NOT NULL DEFAULT 'M' COMMENT '菜单类型',
  `visible` char(1) NOT NULL DEFAULT '0' COMMENT '是否显示',
  `status` char(1) NOT NULL DEFAULT '0' COMMENT '状态',
  `perms` varchar(100) NOT NULL DEFAULT '' COMMENT '权限标识',
  `icon` varchar(100) NOT NULL DEFAULT '' COMMENT '菜单图标',
  `create_by` varchar(64) NOT NULL DEFAULT '' COMMENT '创建者',
  `create_time` datetime(6) DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `update_by` varchar(64) NOT NULL DEFAULT '' COMMENT '更新者',
  `update_time` datetime(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
  `remark` varchar(500) DEFAULT NULL COMMENT '备注',
  `del_flag` char(1) NOT NULL DEFAULT '0' COMMENT '删除标志',
  PRIMARY KEY (`menu_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2000 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='【系统管理模块 - 菜单菜单表】菜单权限表';

-- ----------------------------
-- Table structure for sys_report (专题报告中心)
-- ----------------------------
DROP TABLE IF EXISTS `sys_report`;
CREATE TABLE `sys_report` (
  `report_id` bigint NOT NULL AUTO_INCREMENT COMMENT '报告ID',
  `title` varchar(200) NOT NULL COMMENT '报告标题',
  `report_type` varchar(50) NOT NULL COMMENT '报告类型(monthly_ops/device_ops/alarm_analysis/zone_water/revenue/custom)',
  `report_period` varchar(20) NOT NULL COMMENT '报告周期(YYYY-MM或YYYY-MM-DD)',
  `report_status` varchar(20) NOT NULL DEFAULT 'draft' COMMENT '报告状态(draft/published/archived)',
  `summary` varchar(500) DEFAULT '' COMMENT '报告摘要',
  `content` longtext COMMENT '报告内容(JSON: sections数组)',
  `cover_image` varchar(500) DEFAULT '' COMMENT '封面图片URL',
  `file_url` varchar(500) DEFAULT '' COMMENT '导出文件URL',
  `tags` varchar(300) DEFAULT '' COMMENT '报告标签(逗号分隔)',
  `view_count` int DEFAULT 0 COMMENT '浏览次数',
  `generate_time` datetime DEFAULT NULL COMMENT '生成时间',
  `create_by` varchar(64) DEFAULT '' COMMENT '创建者',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_by` varchar(64) DEFAULT '' COMMENT '更新者',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  `remark` varchar(500) DEFAULT NULL COMMENT '备注',
  `status` char(1) DEFAULT '0' COMMENT '状态(0正常 1停用)',
  `del_flag` char(1) DEFAULT '0' COMMENT '删除标志(0存在 1删除)',
  PRIMARY KEY (`report_id`),
  KEY `idx_report_type` (`report_type`),
  KEY `idx_report_period` (`report_period`),
  KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='【系统管理模块 - 专题报告中心表】';

-- ----------------------------
-- Table structure for water_energy_record (能耗记录)
-- ----------------------------
DROP TABLE IF EXISTS `water_energy_record`;
CREATE TABLE `water_energy_record` (
  `record_id` bigint NOT NULL AUTO_INCREMENT COMMENT '记录ID',
  `station_code` varchar(50) NOT NULL COMMENT '站点编码',
  `station_name` varchar(100) DEFAULT '' COMMENT '站点名称',
  `record_period` varchar(20) NOT NULL COMMENT '记录周期(YYYY-MM-DD或YYYY-MM)',
  `period_type` varchar(10) NOT NULL DEFAULT '1d' COMMENT '周期类型(1d/1mo)',
  `power_consumption` decimal(12,2) DEFAULT 0 COMMENT '耗电量(kWh)',
  `water_output` decimal(12,2) DEFAULT 0 COMMENT '供水量(m³)',
  `unit_consumption` decimal(8,4) DEFAULT 0 COMMENT '单位能耗(kWh/m³)',
  `peak_power` decimal(12,2) DEFAULT 0 COMMENT '峰段电量',
  `valley_power` decimal(12,2) DEFAULT 0 COMMENT '谷段电量',
  `record_time` datetime DEFAULT NULL COMMENT '记录时间',
  `create_by` varchar(64) DEFAULT '' COMMENT '创建者',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_by` varchar(64) DEFAULT '' COMMENT '更新者',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  `remark` varchar(500) DEFAULT NULL COMMENT '备注',
  `status` char(1) DEFAULT '0' COMMENT '状态',
  `del_flag` char(1) DEFAULT '0' COMMENT '删除标志',
  PRIMARY KEY (`record_id`),
  KEY `idx_station_code` (`station_code`),
  KEY `idx_record_period` (`record_period`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='【水务基础模块 - 能耗记录表】';

-- ----------------------------
-- 性能索引（加速新页面查询）
-- ----------------------------
-- 水质/压力/流量监测页：WHERE del_flag='0' AND type IN (...)
CREATE INDEX IF NOT EXISTS `idx_point_delflag_type` ON `water_point` (`del_flag`, `type`);
-- 泵站监控页：WHERE del_flag='0' GROUP BY iot_status
CREATE INDEX IF NOT EXISTS `idx_station_delflag_iot` ON `water_station` (`del_flag`, `iot_status`);
-- 能耗分析页：WHERE record_period=? AND period_type=? AND del_flag='0' GROUP BY station_code
CREATE INDEX IF NOT EXISTS `idx_energy_period_type` ON `water_energy_record` (`del_flag`, `period_type`, `record_period`);
-- 首页/报表中心：WHERE alarm_time BETWEEN ? AND ?  以及  GROUP BY alarm_level
CREATE INDEX IF NOT EXISTS `idx_alarm_history_time` ON `sys_alarm_history` (`alarm_time`);
-- 管网分析页：WHERE del_flag='0' GROUP BY pipe_type / material / diameter
CREATE INDEX IF NOT EXISTS `idx_pipe_delflag_type` ON `water_pipe` (`del_flag`, `pipe_type`);
CREATE INDEX IF NOT EXISTS `idx_pipe_delflag_material` ON `water_pipe` (`del_flag`, `material`);

-- ----------------------------
-- Records of sys_menu
-- ----------------------------
BEGIN;
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1, '系统管理', 0, 3, 'system', NULL, '', '1', '0', 'M', '0', '0', '', 'system', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '系统管理目录', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (2, '系统监控', 0, 4, 'monitor', NULL, '', '1', '0', 'M', '0', '0', '', 'monitor', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '系统监控目录', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (3, '系统工具', 0, 7, 'tool', NULL, '', '1', '0', 'M', '0', '0', '', 'tool', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '系统工具目录', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (100, '用户管理', 1, 1, 'user', 'system/user/index', '', '1', '0', 'C', '0', '0', 'system:user:list', 'user', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '用户管理菜单', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (101, '角色管理', 1, 2, 'role', 'system/role/index', '', '1', '0', 'C', '0', '0', 'system:role:list', 'peoples', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '角色管理菜单', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (102, '菜单管理', 1, 3, 'menu', 'system/menu/index', '', '1', '0', 'C', '0', '0', 'system:menu:list', 'tree-table', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '菜单管理菜单', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (103, '部门管理', 1, 4, 'dept', 'system/dept/index', '', '1', '0', 'C', '0', '0', 'system:dept:list', 'tree', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '部门管理菜单', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (104, '岗位管理', 1, 5, 'post', 'system/post/index', '', '1', '0', 'C', '0', '0', 'system:post:list', 'post', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '岗位管理菜单', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (105, '字典管理', 1, 6, 'dict', 'system/dict/index', '', '1', '0', 'C', '0', '0', 'system:dict:list', 'dict', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '字典管理菜单', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (106, '参数设置', 1, 7, 'config', 'system/config/index', '', '1', '0', 'C', '0', '0', 'system:config:list', 'edit', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '参数设置菜单', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (107, '通知公告', 1, 8, 'notice', 'system/notice/index', '', '1', '0', 'C', '0', '0', 'system:notice:list', 'message', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '通知公告菜单', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (108, '日志管理', 1, 9, 'log', '', '', '1', '0', 'M', '0', '0', '', 'log', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '日志管理菜单', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (109, '在线用户', 2, 1, 'online', 'monitor/online/index', '', '1', '0', 'C', '0', '0', 'monitor:online:list', 'online', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '在线用户菜单', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (110, '定时任务', 2, 2, 'job', 'monitor/job/index', '', '1', '0', 'C', '0', '0', 'monitor:job:list', 'job', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '定时任务菜单', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (111, '数据监控', 2, 3, 'druid', 'monitor/druid/index', '', '1', '0', 'C', '0', '0', 'monitor:druid:list', 'druid', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '数据监控菜单', '1');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (112, '服务监控', 2, 4, 'server', 'monitor/server/index', '', '1', '0', 'C', '0', '0', 'monitor:server:list', 'server', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '服务监控菜单', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (113, '缓存监控', 2, 5, 'cache', 'monitor/cache/index', '', '1', '0', 'C', '0', '0', 'monitor:cache:list', 'redis', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '缓存监控菜单', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (114, '缓存列表', 2, 6, 'cacheList', 'monitor/cache/list', '', '1', '0', 'C', '0', '0', 'monitor:cache:list', 'redis-list', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '缓存列表菜单', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (121, '服务状态', 2, 10, 'registry', 'monitor/registry/index', '', '1', '0', 'C', '0', '0', 'monitor:registry:list', 'server', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '微服务注册中心状态', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (115, '表单构建', 3, 1, 'build', 'tool/build/index', '', '1', '0', 'C', '0', '0', 'tool:build:list', 'build', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '表单构建菜单', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (116, '代码生成', 3, 2, 'gen', 'tool/gen/index', '', '1', '0', 'C', '0', '0', 'tool:gen:list', 'code', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '代码生成菜单', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (117, '系统接口', 3, 3, 'swagger', 'tool/swagger/index', '', '1', '0', 'C', '0', '0', 'tool:swagger:list', 'swagger', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '系统接口菜单', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (118, '备份管理', 3, 4, 'backup', 'system/backup/index', '', '1', '0', 'C', '0', '0', 'system:backup:list', 'server', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '数据库备份管理菜单', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (119, '水务基础', 0, 2, 'water-basic', NULL, '', '1', '0', 'M', '0', '0', '', 'system', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '水务基础模块顶级菜单', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (120, '分区管理', 119, 1, 'zone', 'water-basic/zone/index', '', '1', '0', 'C', '0', '0', 'water-basic:zone:list', 'tree', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '综合分区管理', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (122, '物联台账', 119, 2, 'station-device-point', 'water-basic/station-device-point/index', '', '1', '0', 'C', '0', '0', 'water-basic:station:list', 'tree-table', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '站点设备测点管理页面', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (123, '营收基础信息', 119, 3, 'revenue-user', 'water-basic/revenue-user/index', '', '1', '0', 'C', '0', '0', 'water-basic:revenue:list', 'user', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '营收基础用户信息管理', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (500, '操作日志', 108, 1, 'operlog', 'monitor/operlog/index', '', '1', '0', 'C', '0', '0', 'monitor:operlog:list', 'form', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '操作日志菜单', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (501, '登录日志', 108, 2, 'logininfor', 'monitor/logininfor/index', '', '1', '0', 'C', '0', '0', 'monitor:logininfor:list', 'logininfor', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '登录日志菜单', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1000, '用户查询', 100, 1, '', '', '', '1', '0', 'F', '0', '0', 'system:user:query', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1001, '用户新增', 100, 2, '', '', '', '1', '0', 'F', '0', '0', 'system:user:add', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1002, '用户修改', 100, 3, '', '', '', '1', '0', 'F', '0', '0', 'system:user:edit', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1003, '用户删除', 100, 4, '', '', '', '1', '0', 'F', '0', '0', 'system:user:remove', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1004, '用户导出', 100, 5, '', '', '', '1', '0', 'F', '0', '0', 'system:user:export', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1005, '用户导入', 100, 6, '', '', '', '1', '0', 'F', '0', '0', 'system:user:import', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1006, '重置密码', 100, 7, '', '', '', '1', '0', 'F', '0', '0', 'system:user:resetPwd', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1007, '角色查询', 101, 1, '', '', '', '1', '0', 'F', '0', '0', 'system:role:query', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1008, '角色新增', 101, 2, '', '', '', '1', '0', 'F', '0', '0', 'system:role:add', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1009, '角色修改', 101, 3, '', '', '', '1', '0', 'F', '0', '0', 'system:role:edit', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1010, '角色删除', 101, 4, '', '', '', '1', '0', 'F', '0', '0', 'system:role:remove', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1011, '角色导出', 101, 5, '', '', '', '1', '0', 'F', '0', '0', 'system:role:export', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1012, '菜单查询', 102, 1, '', '', '', '1', '0', 'F', '0', '0', 'system:menu:query', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1013, '菜单新增', 102, 2, '', '', '', '1', '0', 'F', '0', '0', 'system:menu:add', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1014, '菜单修改', 102, 3, '', '', '', '1', '0', 'F', '0', '0', 'system:menu:edit', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1015, '菜单删除', 102, 4, '', '', '', '1', '0', 'F', '0', '0', 'system:menu:remove', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1016, '部门查询', 103, 1, '', '', '', '1', '0', 'F', '0', '0', 'system:dept:query', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1017, '部门新增', 103, 2, '', '', '', '1', '0', 'F', '0', '0', 'system:dept:add', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1018, '部门修改', 103, 3, '', '', '', '1', '0', 'F', '0', '0', 'system:dept:edit', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1019, '部门删除', 103, 4, '', '', '', '1', '0', 'F', '0', '0', 'system:dept:remove', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1020, '岗位查询', 104, 1, '', '', '', '1', '0', 'F', '0', '0', 'system:post:query', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1021, '岗位新增', 104, 2, '', '', '', '1', '0', 'F', '0', '0', 'system:post:add', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1022, '岗位修改', 104, 3, '', '', '', '1', '0', 'F', '0', '0', 'system:post:edit', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1023, '岗位删除', 104, 4, '', '', '', '1', '0', 'F', '0', '0', 'system:post:remove', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1024, '岗位导出', 104, 5, '', '', '', '1', '0', 'F', '0', '0', 'system:post:export', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1025, '字典查询', 105, 1, '#', '', '', '1', '0', 'F', '0', '0', 'system:dict:query', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1026, '字典新增', 105, 2, '#', '', '', '1', '0', 'F', '0', '0', 'system:dict:add', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1027, '字典修改', 105, 3, '#', '', '', '1', '0', 'F', '0', '0', 'system:dict:edit', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1028, '字典删除', 105, 4, '#', '', '', '1', '0', 'F', '0', '0', 'system:dict:remove', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1029, '字典导出', 105, 5, '#', '', '', '1', '0', 'F', '0', '0', 'system:dict:export', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1030, '参数查询', 106, 1, '#', '', '', '1', '0', 'F', '0', '0', 'system:config:query', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1031, '参数新增', 106, 2, '#', '', '', '1', '0', 'F', '0', '0', 'system:config:add', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1032, '参数修改', 106, 3, '#', '', '', '1', '0', 'F', '0', '0', 'system:config:edit', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1033, '参数删除', 106, 4, '#', '', '', '1', '0', 'F', '0', '0', 'system:config:remove', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1034, '参数导出', 106, 5, '#', '', '', '1', '0', 'F', '0', '0', 'system:config:export', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1035, '公告查询', 107, 1, '#', '', '', '1', '0', 'F', '0', '0', 'system:notice:query', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1036, '公告新增', 107, 2, '#', '', '', '1', '0', 'F', '0', '0', 'system:notice:add', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1037, '公告修改', 107, 3, '#', '', '', '1', '0', 'F', '0', '0', 'system:notice:edit', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1038, '公告删除', 107, 4, '#', '', '', '1', '0', 'F', '0', '0', 'system:notice:remove', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1039, '操作查询', 500, 1, '#', '', '', '1', '0', 'F', '0', '0', 'monitor:operlog:query', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1040, '操作删除', 500, 2, '#', '', '', '1', '0', 'F', '0', '0', 'monitor:operlog:remove', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1041, '日志导出', 500, 3, '#', '', '', '1', '0', 'F', '0', '0', 'monitor:operlog:export', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1042, '登录查询', 501, 1, '#', '', '', '1', '0', 'F', '0', '0', 'monitor:logininfor:query', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1043, '登录删除', 501, 2, '#', '', '', '1', '0', 'F', '0', '0', 'monitor:logininfor:remove', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1044, '日志导出', 501, 3, '#', '', '', '1', '0', 'F', '0', '0', 'monitor:logininfor:export', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1045, '账户解锁', 501, 4, '#', '', '', '1', '0', 'F', '0', '0', 'monitor:logininfor:unlock', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1046, '在线查询', 109, 1, '#', '', '', '1', '0', 'F', '0', '0', 'monitor:online:query', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1047, '批量强退', 109, 2, '#', '', '', '1', '0', 'F', '0', '0', 'monitor:online:batchLogout', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1048, '单条强退', 109, 3, '#', '', '', '1', '0', 'F', '0', '0', 'monitor:online:forceLogout', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1049, '任务查询', 110, 1, '#', '', '', '1', '0', 'F', '0', '0', 'monitor:job:query', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1050, '任务新增', 110, 2, '#', '', '', '1', '0', 'F', '0', '0', 'monitor:job:add', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1051, '任务修改', 110, 3, '#', '', '', '1', '0', 'F', '0', '0', 'monitor:job:edit', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1052, '任务删除', 110, 4, '#', '', '', '1', '0', 'F', '0', '0', 'monitor:job:remove', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1053, '状态修改', 110, 5, '#', '', '', '1', '0', 'F', '0', '0', 'monitor:job:changestatus', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1054, '任务导出', 110, 6, '#', '', '', '1', '0', 'F', '0', '0', 'monitor:job:export', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1055, '生成查询', 116, 1, '#', '', '', '1', '0', 'F', '0', '0', 'tool:gen:query', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1056, '生成修改', 116, 2, '#', '', '', '1', '0', 'F', '0', '0', 'tool:gen:edit', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1057, '生成删除', 116, 3, '#', '', '', '1', '0', 'F', '0', '0', 'tool:gen:remove', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1058, '导入代码', 116, 4, '#', '', '', '1', '0', 'F', '0', '0', 'tool:gen:import', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1059, '预览代码', 116, 5, '#', '', '', '1', '0', 'F', '0', '0', 'tool:gen:preview', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1060, '生成代码', 116, 6, '#', '', '', '1', '0', 'F', '0', '0', 'tool:gen:code', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1061, '创建备份', 118, 1, '', '', '', '1', '0', 'F', '0', '0', 'system:backup:create', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1062, '恢复备份', 118, 2, '', '', '', '1', '0', 'F', '0', '0', 'system:backup:restore', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1063, '删除备份', 118, 3, '', '', '', '1', '0', 'F', '0', '0', 'system:backup:remove', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1064, '分区查询', 120, 1, '', '', '', '1', '0', 'F', '0', '0', 'water-basic:zone:query', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1065, '分区新增', 120, 2, '', '', '', '1', '0', 'F', '0', '0', 'water-basic:zone:add', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1066, '分区修改', 120, 3, '', '', '', '1', '0', 'F', '0', '0', 'water-basic:zone:edit', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1067, '分区删除', 120, 4, '', '', '', '1', '0', 'F', '0', '0', 'water-basic:zone:remove', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1068, '分区导出', 120, 5, '', '', '', '1', '0', 'F', '0', '0', 'water-basic:zone:export', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1069, '分区导入', 120, 6, '', '', '', '1', '0', 'F', '0', '0', 'water-basic:zone:import', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
-- 物联台账权限
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1070, '站点查询', 122, 1, '', '', '', '1', '0', 'F', '0', '0', 'water-basic:station:query', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1071, '站点新增', 122, 2, '', '', '', '1', '0', 'F', '0', '0', 'water-basic:station:add', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1072, '站点修改', 122, 3, '', '', '', '1', '0', 'F', '0', '0', 'water-basic:station:edit', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1073, '站点删除', 122, 4, '', '', '', '1', '0', 'F', '0', '0', 'water-basic:station:remove', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1074, '站点导出', 122, 5, '', '', '', '1', '0', 'F', '0', '0', 'water-basic:station:export', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1075, '站点导入', 122, 6, '', '', '', '1', '0', 'F', '0', '0', 'water-basic:station:import', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1076, '设备查询', 122, 7, '', '', '', '1', '0', 'F', '0', '0', 'water-basic:device:query', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1077, '设备新增', 122, 8, '', '', '', '1', '0', 'F', '0', '0', 'water-basic:device:add', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1078, '设备修改', 122, 9, '', '', '', '1', '0', 'F', '0', '0', 'water-basic:device:edit', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1079, '设备删除', 122, 10, '', '', '', '1', '0', 'F', '0', '0', 'water-basic:device:remove', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1080, '设备导出', 122, 11, '', '', '', '1', '0', 'F', '0', '0', 'water-basic:device:export', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1081, '设备导入', 122, 12, '', '', '', '1', '0', 'F', '0', '0', 'water-basic:device:import', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1082, '测点查询', 122, 13, '', '', '', '1', '0', 'F', '0', '0', 'water-basic:point:query', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1083, '测点新增', 122, 14, '', '', '', '1', '0', 'F', '0', '0', 'water-basic:point:add', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1084, '测点修改', 122, 15, '', '', '', '1', '0', 'F', '0', '0', 'water-basic:point:edit', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1085, '测点删除', 122, 16, '', '', '', '1', '0', 'F', '0', '0', 'water-basic:point:remove', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1086, '测点导出', 122, 17, '', '', '', '1', '0', 'F', '0', '0', 'water-basic:point:export', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1087, '测点导入', 122, 18, '', '', '', '1', '0', 'F', '0', '0', 'water-basic:point:import', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
-- 营收用户权限
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1088, '营收用户查询', 123, 1, '', '', '', '1', '0', 'F', '0', '0', 'water-basic:revenue:query', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1089, '营收用户新增', 123, 2, '', '', '', '1', '0', 'F', '0', '0', 'water-basic:revenue:add', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1090, '营收用户修改', 123, 3, '', '', '', '1', '0', 'F', '0', '0', 'water-basic:revenue:edit', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1091, '营收用户删除', 123, 4, '', '', '', '1', '0', 'F', '0', '0', 'water-basic:revenue:remove', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1092, '营收用户导出', 123, 5, '', '', '', '1', '0', 'F', '0', '0', 'water-basic:revenue:export', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1093, '营收用户导入', 123, 6, '', '', '', '1', '0', 'F', '0', '0', 'water-basic:revenue:import', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
-- 插入主菜单：实时数据接入（顶级菜单 parent_id = 0）
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1094, '实时数据接入', 0, 2, 'data-integration', 'Layout', '', '1', '0', 'M', '0', '0', '', 'monitor', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '实时数据接入管理', '0');
-- 插入子菜单：数据源
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1095, '数据源配置', 1094, 1, 'source', 'data-integration/source/index', '', '1', '0', 'C', '0', '0', 'data-integration:source:list', 'redis', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1096, '数据源查询', 1095, 1, '', '', '', '1', '0', 'F', '0', '0', 'data-integration:source:query', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1097, '数据源新增', 1095, 2, '', '', '', '1', '0', 'F', '0', '0', 'data-integration:source:add', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1098, '数据源修改', 1095, 3, '', '', '', '1', '0', 'F', '0', '0', 'data-integration:source:edit', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1099, '数据源删除', 1095, 4, '', '', '', '1', '0', 'F', '0', '0', 'data-integration:source:remove', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');

-- 插入子菜单：接入任务管理
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1100, '接入任务管理', 1094, 2, 'task', 'data-integration/task/index', '', '1', '0', 'C', '0', '0', 'data-integration:task:list', 'job', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1101, '任务查询', 1100, 1, '', '', '', '1', '0', 'F', '0', '0', 'data-integration:task:query', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1102, '任务新增', 1100, 2, '', '', '', '1', '0', 'F', '0', '0', 'data-integration:task:add', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1103, '任务修改', 1100, 3, '', '', '', '1', '0', 'F', '0', '0', 'data-integration:task:edit', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1104, '任务删除', 1100, 4, '', '', '', '1', '0', 'F', '0', '0', 'data-integration:task:remove', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1105, '字段映射配置', 1100, 5, '', '', '', '1', '0', 'F', '0', '0', 'data-integration:task:mapping', '#', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
-- 插入子菜单：数据模拟测试
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1106, '数据模拟测试', 1094, 3, 'mock', 'data-integration/mock/index', '', '1', '0', 'C', '0', '0', 'data-integration:mock:generate', 'bug', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
-- 插入主菜单：DMA 业务
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1108, 'DMA业务', 0, 1, 'dma', 'Layout', '', '1', '0', 'M', '0', '0', '', 'chart', 'admin', '2026-04-24 10:00:00.000000', '', NULL, 'DMA业务管理', '0');
-- 插入子菜单：夜间最小流量 (移至 DMA 业务)
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1107, '夜间最小流量', 1108, 1, 'night-flow', 'data-integration/night-flow/index', '', '1', '0', 'C', '0', '0', 'data-integration:night-flow:list', 'chart', 'admin', '2026-04-24 10:00:00.000000', '', NULL, '夜间最小流量分析页面', '0');
-- 插入日报表和月报表的菜单
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1109, '产销差日报表', 1108, 1, 'daily', 'dma/report/daily', '', '1', '0', 'C', '0', '0', 'dma:report:daily', 'date', 'admin', '2026-04-24 10:00:00.000000', '', NULL, '分区产销差日报表', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1110, '产销差月报表', 1108, 2, 'monthly', 'dma/report/monthly', '', '1', '0', 'C', '0', '0', 'dma:report:monthly', 'chart', 'admin', '2026-04-24 10:00:00.000000', '', NULL, '分区产销差月报表', '0');
-- 报警中心菜单
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1111, '报警中心', 0, 5, 'alarm', NULL, '', '1', '0', 'M', '0', '0', '', 'monitor', 'admin', '2026-04-24 10:00:00.000000', '', NULL, '报警中心目录', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1112, '报警规则', 1111, 1, 'rule', 'alarm/rule/index', '', '1', '0', 'C', '0', '0', 'alarm:rule:list', 'tool', 'admin', '2026-04-24 10:00:00.000000', '', NULL, '报警规则菜单', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1113, '报警历史', 1111, 2, 'history', 'alarm/history/index', '', '1', '0', 'C', '0', '0', 'alarm:history:list', 'message', 'admin', '2026-04-24 10:00:00.000000', '', NULL, '报警历史菜单', '0');
-- 报警规则按钮权限
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1114, '规则查询', 1112, 1, '', '', '', '1', '0', 'F', '0', '0', 'alarm:rule:query', '#', 'admin', '2026-04-24 10:00:00.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1115, '规则新增', 1112, 2, '', '', '', '1', '0', 'F', '0', '0', 'alarm:rule:add', '#', 'admin', '2026-04-24 10:00:00.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1116, '规则修改', 1112, 3, '', '', '', '1', '0', 'F', '0', '0', 'alarm:rule:edit', '#', 'admin', '2026-04-24 10:00:00.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1117, '规则删除', 1112, 4, '', '', '', '1', '0', 'F', '0', '0', 'alarm:rule:remove', '#', 'admin', '2026-04-24 10:00:00.000000', '', NULL, '', '0');
-- 报警历史按钮权限
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1118, '历史查询', 1113, 1, '', '', '', '1', '0', 'F', '0', '0', 'alarm:history:query', '#', 'admin', '2026-04-24 10:00:00.000000', '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1119, '报警处理', 1113, 2, '', '', '', '1', '0', 'F', '0', '0', 'alarm:history:resolve', '#', 'admin', '2026-04-24 10:00:00.000000', '', NULL, '', '0');
-- 综合水务GIS大屏监控
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1120, 'GIS大屏监控', 0, 6, 'gis/screen', 'gis/screen/index', '', '1', '0', 'C', '0', '0', 'gis:screen:view', 'monitor', 'admin', '2026-04-26 10:00:00.000000', '', NULL, '全屏GIS大屏监控', '0');
-- 水费账单管理菜单
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1121, '水费账单', 119, 4, 'billing', 'water-basic/billing/index', '', '1', '0', 'C', '0', '0', 'water-basic:billing:list', 'money', 'admin', NOW(), '', NULL, '水费账单管理', '0');
-- 水费账单按钮权限
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1122, '账单查询', 1121, 1, '', '', '', '1', '0', 'F', '0', '0', 'water-basic:billing:query', '#', 'admin', NOW(), '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1123, '账单新增', 1121, 2, '', '', '', '1', '0', 'F', '0', '0', 'water-basic:billing:add', '#', 'admin', NOW(), '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1124, '账单修改', 1121, 3, '', '', '', '1', '0', 'F', '0', '0', 'water-basic:billing:edit', '#', 'admin', NOW(), '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1125, '账单删除', 1121, 4, '', '', '', '1', '0', 'F', '0', '0', 'water-basic:billing:remove', '#', 'admin', NOW(), '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1126, '账单导出', 1121, 5, '', '', '', '1', '0', 'F', '0', '0', 'water-basic:billing:export', '#', 'admin', NOW(), '', NULL, '', '0');
-- 管网管线按钮权限（挂在物联台账 122 下）
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1127, '管线查询', 122, 19, '', '', '', '1', '0', 'F', '0', '0', 'water-basic:pipe:query', '#', 'admin', NOW(), '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1128, '管线新增', 122, 20, '', '', '', '1', '0', 'F', '0', '0', 'water-basic:pipe:add', '#', 'admin', NOW(), '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1129, '管线修改', 122, 21, '', '', '', '1', '0', 'F', '0', '0', 'water-basic:pipe:edit', '#', 'admin', NOW(), '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1130, '管线删除', 122, 22, '', '', '', '1', '0', 'F', '0', '0', 'water-basic:pipe:remove', '#', 'admin', NOW(), '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1131, '管线导出', 122, 23, '', '', '', '1', '0', 'F', '0', '0', 'water-basic:pipe:export', '#', 'admin', NOW(), '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1132, '管线导入', 122, 24, '', '', '', '1', '0', 'F', '0', '0', 'water-basic:pipe:import', '#', 'admin', NOW(), '', NULL, '', '0');

-- 水务基础新增模块（水质/压力/泵站/流量/能耗/管析/SCADA）
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1133, '水质监测', 119, 5, 'water-quality', 'water-basic/water-quality/index', '', '1', '0', 'C', '0', '0', 'water-basic:water-quality:list', 'monitor', 'admin', NOW(), '', NULL, '水质在线监测页面', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1134, '压力监测', 119, 6, 'pressure', 'water-basic/pressure/index', '', '1', '0', 'C', '0', '0', 'water-basic:pressure:list', 'dashboard', 'admin', NOW(), '', NULL, '压力实时监测页面', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1135, '泵站监控', 119, 7, 'pump-station', 'water-basic/pump-station/index', '', '1', '0', 'C', '0', '0', 'water-basic:pump-station:list', 'monitor', 'admin', NOW(), '', NULL, '泵站运行监控页面', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1136, '流量监测', 119, 8, 'flow-monitor', 'water-basic/flow-monitor/index', '', '1', '0', 'C', '0', '0', 'water-basic:flow-monitor:list', 'chart', 'admin', NOW(), '', NULL, '流量实时监测页面', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1137, '能耗分析', 119, 9, 'energy', 'water-basic/energy/index', '', '1', '0', 'C', '0', '0', 'water-basic:energy:list', 'chart', 'admin', NOW(), '', NULL, '能耗统计分析页面', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1138, '管网分析', 119, 10, 'pipe-analysis', 'water-basic/pipe-analysis/index', '', '1', '0', 'C', '0', '0', 'water-basic:pipe-analysis:list', 'chart', 'admin', NOW(), '', NULL, '管网统计分析页面', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1139, 'SCADA监控', 119, 11, 'scada', 'scada/monitor/index', '', '1', '0', 'C', '0', '0', 'water-basic:scada:list', 'monitor', 'admin', NOW(), '', NULL, 'SCADA实时监控大屏', '0');
-- 系统管理新增专题报告
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1140, '专题报告', 1, 10, 'report', 'system/report/index', '', '1', '0', 'C', '0', '0', 'system:report:list', 'documentation', 'admin', NOW(), '', NULL, '专题报告中心', '0');
-- 爆管分析菜单
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1141, '爆管分析', 119, 12, 'burst-analysis', 'water-basic/burst-analysis/index', '', '1', '0', 'C', '0', '0', 'water-basic:burst:list', 'warning', 'admin', NOW(), '', NULL, '爆管预警分析页面', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1142, '爆管查询', 1141, 1, '', '', '', '1', '0', 'F', '0', '0', 'water-basic:burst:query', '#', 'admin', NOW(), '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1143, '执行分析', 1141, 2, '', '', '', '1', '0', 'F', '0', '0', 'water-basic:burst:analyze', '#', 'admin', NOW(), '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1144, '事件确认', 1141, 3, '', '', '', '1', '0', 'F', '0', '0', 'water-basic:burst:confirm', '#', 'admin', NOW(), '', NULL, '', '0');
INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1145, '事件修复', 1141, 4, '', '', '', '1', '0', 'F', '0', '0', 'water-basic:burst:fix', '#', 'admin', NOW(), '', NULL, '', '0');


COMMIT; -- 【系统管理模块 - 菜单表】

-- ----------------------------
-- Table structure for sys_notice
-- ----------------------------
DROP TABLE IF EXISTS `sys_notice`;
CREATE TABLE `sys_notice` (
  `notice_id` int NOT NULL AUTO_INCREMENT COMMENT '公告ID',
  `notice_title` varchar(50) NOT NULL DEFAULT '' COMMENT '公告标题',
  `notice_type` char(1) NOT NULL COMMENT '公告类型',
  `notice_content` longtext COMMENT '公告内容',
  `status` char(1) NOT NULL DEFAULT '0' COMMENT '状态',
  `create_by` varchar(64) NOT NULL DEFAULT '' COMMENT '创建者',
  `create_time` datetime(6) DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `update_by` varchar(64) NOT NULL DEFAULT '' COMMENT '更新者',
  `update_time` datetime(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
  `del_flag` char(1) NOT NULL DEFAULT '0' COMMENT '删除标志',
  `remark` varchar(500) DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`notice_id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='【系统管理模块 - 通知表】通知公告表';

-- ----------------------------
-- Records of sys_notice
-- ----------------------------
BEGIN;
INSERT INTO `sys_notice` (`notice_id`, `notice_title`, `notice_type`, `notice_content`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `del_flag`, `remark`) VALUES (1, '温馨提醒：2018-07-01 nest-admin新版本发布啦', '2', '新版本内容', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '0', NULL);
INSERT INTO `sys_notice` (`notice_id`, `notice_title`, `notice_type`, `notice_content`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `del_flag`, `remark`) VALUES (2, '维护通知：2018-07-01 nest-admin系统凌晨维护', '1', '维护内容', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '0', NULL);
COMMIT; -- 【系统管理模块 - 通知表】

-- ----------------------------
-- Table structure for sys_oper_log
-- ----------------------------
DROP TABLE IF EXISTS `sys_oper_log`;
CREATE TABLE `sys_oper_log` (
  `title` varchar(50) NOT NULL DEFAULT '' COMMENT '模块标题',
  `business_type` int NOT NULL DEFAULT '0' COMMENT '业务类型',
  `request_method` varchar(10) NOT NULL DEFAULT '' COMMENT '请求方式',
  `operator_type` int NOT NULL DEFAULT '0' COMMENT '操作类别',
  `oper_name` varchar(50) NOT NULL DEFAULT '' COMMENT '操作人员',
  `dept_name` varchar(50) NOT NULL DEFAULT '' COMMENT '部门名称',
  `oper_url` varchar(255) NOT NULL DEFAULT '' COMMENT '请求URL',
  `oper_location` varchar(255) NOT NULL DEFAULT '' COMMENT '操作地点',
  `oper_param` varchar(2000) NOT NULL DEFAULT '' COMMENT '请求参数',
  `json_result` varchar(2000) NOT NULL DEFAULT '' COMMENT '返回参数',
  `error_msg` varchar(2000) NOT NULL DEFAULT '' COMMENT '错误消息',
  `oper_id` int NOT NULL AUTO_INCREMENT COMMENT '日志主键',
  `method` varchar(100) NOT NULL DEFAULT '' COMMENT '方法名称',
  `oper_ip` varchar(255) NOT NULL DEFAULT '' COMMENT '主机地址',
  `oper_time` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '操作时间',
  `status` char(1) NOT NULL DEFAULT '0' COMMENT '登录状态',
  `cost_time` int NOT NULL DEFAULT '0' COMMENT '消耗时间',
  PRIMARY KEY (`oper_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='【系统监控模块 - 操作日志表】操作日志记录';

-- ----------------------------
-- Records of sys_oper_log
-- ----------------------------
BEGIN;
COMMIT; -- 【系统监控模块 - 操作日志表】

-- ----------------------------
-- Table structure for sys_post
-- ----------------------------
DROP TABLE IF EXISTS `sys_post`;
CREATE TABLE `sys_post` (
  `post_id` int NOT NULL AUTO_INCREMENT COMMENT '岗位ID',
  `post_code` varchar(64) NOT NULL COMMENT '岗位编码',
  `post_name` varchar(50) NOT NULL COMMENT '岗位名称',
  `post_sort` int NOT NULL DEFAULT '0' COMMENT '显示顺序',
  `status` char(1) NOT NULL DEFAULT '0' COMMENT '状态',
  `create_by` varchar(64) NOT NULL DEFAULT '' COMMENT '创建者',
  `create_time` datetime(6) DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `update_by` varchar(64) NOT NULL DEFAULT '' COMMENT '更新者',
  `update_time` datetime(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
  `remark` varchar(500) DEFAULT NULL COMMENT '备注',
  `del_flag` char(1) NOT NULL DEFAULT '0' COMMENT '删除标志',
  PRIMARY KEY (`post_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='【系统管理模块 - 岗位表】岗位表';

-- ----------------------------
-- Records of sys_post
-- ----------------------------
BEGIN;
INSERT INTO `sys_post` (`post_id`, `post_code`, `post_name`, `post_sort`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (1, 'ceo', '董事长', 1, '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_post` (`post_id`, `post_code`, `post_name`, `post_sort`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (2, 'se', '项目经理', 2, '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_post` (`post_id`, `post_code`, `post_name`, `post_sort`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (3, 'hr', '人力资源', 3, '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
INSERT INTO `sys_post` (`post_id`, `post_code`, `post_name`, `post_sort`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (4, 'user', '普通员工', 4, '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '', '0');
COMMIT; -- 【系统管理模块 - 岗位表】

-- ----------------------------
-- Table structure for sys_role
-- ----------------------------
DROP TABLE IF EXISTS `sys_role`;
CREATE TABLE `sys_role` (
  `role_id` int NOT NULL AUTO_INCREMENT COMMENT '角色ID',
  `role_name` varchar(30) NOT NULL COMMENT '角色名称',
  `role_key` varchar(100) NOT NULL COMMENT '角色权限字符串',
  `role_sort` int NOT NULL DEFAULT '0' COMMENT '显示顺序',
  `data_scope` char(1) NOT NULL DEFAULT '1' COMMENT '数据范围',
  `menu_check_strictly` tinyint NOT NULL DEFAULT '0' COMMENT '菜单树选择项是否关联显示',
  `dept_check_strictly` tinyint NOT NULL DEFAULT '0' COMMENT '部门树选择项是否关联显示',
  `status` char(1) NOT NULL DEFAULT '0' COMMENT '状态',
  `del_flag` char(1) NOT NULL DEFAULT '0' COMMENT '删除标志',
  `create_by` varchar(64) NOT NULL DEFAULT '' COMMENT '创建者',
  `create_time` datetime(6) DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `update_by` varchar(64) NOT NULL DEFAULT '' COMMENT '更新者',
  `update_time` datetime(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
  `remark` varchar(500) DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`role_id`)
) ENGINE=InnoDB AUTO_INCREMENT=100 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='【系统管理模块 - 角色表】角色表';

-- ----------------------------
-- Records of sys_role
-- ----------------------------
BEGIN;
INSERT INTO `sys_role` (`role_id`, `role_name`, `role_key`, `role_sort`, `data_scope`, `menu_check_strictly`, `dept_check_strictly`, `status`, `del_flag`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`) VALUES (1, '超级管理员', 'admin', 1, '1', 1, 1, '0', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '超级管理员');
INSERT INTO `sys_role` (`role_id`, `role_name`, `role_key`, `role_sort`, `data_scope`, `menu_check_strictly`, `dept_check_strictly`, `status`, `del_flag`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`) VALUES (2, '普通角色', 'common', 2, '2', 1, 1, '0', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '普通角色');
COMMIT; -- 【系统管理模块 - 角色表】

-- ----------------------------
-- Table structure for sys_role_dept
-- ----------------------------
DROP TABLE IF EXISTS `sys_role_dept`;
CREATE TABLE `sys_role_dept` (
  `role_id` int NOT NULL DEFAULT '0' COMMENT '角色ID',
  `dept_id` int NOT NULL DEFAULT '0' COMMENT '部门ID',
  PRIMARY KEY (`role_id`,`dept_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='【系统管理模块 - 角色部门表】角色和部门关联表';

-- ----------------------------
-- Records of sys_role_dept
-- ----------------------------
BEGIN;
INSERT INTO `sys_role_dept` (`role_id`, `dept_id`) VALUES (2, 100);
INSERT INTO `sys_role_dept` (`role_id`, `dept_id`) VALUES (2, 101);
INSERT INTO `sys_role_dept` (`role_id`, `dept_id`) VALUES (2, 105);
COMMIT; -- 【系统管理模块 - 角色部门表】

-- ----------------------------
-- Table structure for sys_role_menu
-- ----------------------------
DROP TABLE IF EXISTS `sys_role_menu`;
CREATE TABLE `sys_role_menu` (
  `role_id` int NOT NULL DEFAULT '0' COMMENT '角色ID',
  `menu_id` int NOT NULL DEFAULT '0' COMMENT '菜单ID',
  PRIMARY KEY (`role_id`,`menu_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='【系统管理模块 - 角色菜单表】角色和菜单关联表';

-- ----------------------------
-- Records of sys_role_menu
-- ----------------------------
BEGIN;
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (1, 119);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (1, 120);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (1, 1064);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (1, 1065);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (1, 1066);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (1, 1067);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (1, 1068);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (1, 1069);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (1, 121);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (1, 122);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (1, 1070);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (1, 1071);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (1, 1072);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (1, 1073);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (1, 1074);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (1, 1075);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (1, 1076);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (1, 1077);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (1, 1078);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (1, 1079);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (1, 1080);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (1, 1081);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (1, 1082);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (1, 1083);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (1, 1084);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (1, 1085);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (1, 1086);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (1, 1087);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (1, 123);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (1, 1088);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (1, 1089);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (1, 1090);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (1, 1091);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (1, 1092);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (1, 1093);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 1);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 2);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 3);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 4);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 100);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 101);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 102);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 103);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 104);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 105);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 106);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 107);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 108);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 109);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 110);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 111);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 112);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 113);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 114);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 115);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 116);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 117);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 500);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 501);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 1000);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 1001);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 1002);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 1003);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 1004);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 1005);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 1006);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 1007);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 1008);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 1009);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 1010);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 1011);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 1012);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 1013);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 1014);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 1015);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 1016);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 1017);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 1018);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 1019);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 1020);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 1021);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 1022);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 1023);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 1024);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 1025);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 1026);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 1027);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 1028);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 1029);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 1030);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 1031);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 1032);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 1033);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 1034);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 1035);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 1036);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 1037);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 1038);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 1039);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 1040);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 1041);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 1042);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 1043);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 1044);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 1045);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 1046);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 1047);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 1048);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 1049);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 1050);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 1051);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 1052);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 1053);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 1054);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 1055);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 1056);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 1057);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 1058);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 1059);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (2, 1060);
COMMIT; -- 【系统管理模块 - 角色菜单表】

-- ----------------------------
-- Table structure for sys_upload
-- ----------------------------
DROP TABLE IF EXISTS `sys_upload`;
CREATE TABLE `sys_upload` (
  `status` char(1) NOT NULL DEFAULT '0' COMMENT '状态',
  `del_flag` char(1) NOT NULL DEFAULT '0' COMMENT '删除标志',
  `create_by` varchar(64) NOT NULL DEFAULT '' COMMENT '创建者',
  `create_time` datetime(6) DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `update_by` varchar(64) NOT NULL DEFAULT '' COMMENT '更新者',
  `update_time` datetime(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
  `remark` varchar(500) DEFAULT NULL COMMENT '备注',
  `upload_id` varchar(255) NOT NULL COMMENT '任务Id',
  `size` int NOT NULL COMMENT '文件大小',
  `file_name` varchar(255) NOT NULL COMMENT '文件路径',
  `new_file_name` varchar(255) NOT NULL COMMENT '文件名',
  `url` varchar(255) NOT NULL COMMENT '文件地址',
  `ext` varchar(255) DEFAULT NULL COMMENT '拓展名',
  PRIMARY KEY (`upload_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='【系统工具模块 - 上传表】文件上传记录';

-- ----------------------------
-- Records of sys_upload
-- ----------------------------
BEGIN;
COMMIT; -- 【系统工具模块 - 上传表】

-- ----------------------------
-- Table structure for sys_user
-- ----------------------------
DROP TABLE IF EXISTS `sys_user`;
CREATE TABLE `sys_user` (
  `user_id` int NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `dept_id` int DEFAULT NULL COMMENT '部门ID',
  `user_name` varchar(30) NOT NULL COMMENT '用户账号',
  `nick_name` varchar(30) NOT NULL COMMENT '用户昵称',
  `user_type` varchar(2) NOT NULL DEFAULT '00' COMMENT '用户类型',
  `email` varchar(50) NOT NULL DEFAULT '' COMMENT '邮箱',
  `phonenumber` varchar(11) NOT NULL DEFAULT '' COMMENT '手机号码',
  `sex` char(1) NOT NULL DEFAULT '0' COMMENT '性别',
  `password` varchar(200) NOT NULL DEFAULT '' COMMENT '用户登录密码',
  `status` char(1) NOT NULL DEFAULT '0' COMMENT '状态',
  `del_flag` char(1) NOT NULL DEFAULT '0' COMMENT '删除标志',
  `login_ip` varchar(128) NOT NULL DEFAULT '' COMMENT '最后登录IP',
  `create_by` varchar(64) NOT NULL DEFAULT '' COMMENT '创建者',
  `create_time` datetime(6) DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `update_by` varchar(64) NOT NULL DEFAULT '' COMMENT '更新者',
  `update_time` datetime(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
  `remark` varchar(500) DEFAULT NULL COMMENT '备注',
  `avatar` varchar(255) NOT NULL DEFAULT '' COMMENT '头像地址',
  `login_date` timestamp NULL DEFAULT NULL COMMENT '最后登录时间',
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=100 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='【系统管理模块 - 用户表】用户表';

-- ----------------------------
-- Records of sys_user
-- ----------------------------
BEGIN;
INSERT INTO `sys_user` (`user_id`, `dept_id`, `user_name`, `nick_name`, `user_type`, `email`, `phonenumber`, `sex`, `password`, `status`, `del_flag`, `login_ip`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `avatar`, `login_date`) VALUES (1, 103, 'admin', 'nest-admin', '00', 'ry@163.com', '15888888888', '1', '$2b$10$d4Z9Iq.v9J4pjX55I9mzRuPHsOMKLupOqxlb/UfbD9oYsYxd5ezeS', '0', '0', '127.0.0.1', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '管理员', '', NULL);
INSERT INTO `sys_user` (`user_id`, `dept_id`, `user_name`, `nick_name`, `user_type`, `email`, `phonenumber`, `sex`, `password`, `status`, `del_flag`, `login_ip`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `avatar`, `login_date`) VALUES (2, 105, 'ry', 'nest-admin', '00', 'ry@qq.com', '15666666666', '1', '$2b$10$d4Z9Iq.v9J4pjX55I9mzRuPHsOMKLupOqxlb/UfbD9oYsYxd5ezeS', '0', '0', '127.0.0.1', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '测试员', '', NULL);
COMMIT; -- 【系统管理模块 - 用户表】

-- ----------------------------
-- Table structure for sys_user_post
-- ----------------------------
DROP TABLE IF EXISTS `sys_user_post`;
CREATE TABLE `sys_user_post` (
  `user_id` int NOT NULL COMMENT '用户ID',
  `post_id` int NOT NULL COMMENT '岗位ID',
  PRIMARY KEY (`user_id`,`post_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='【系统管理模块 - 用户岗位关联表】用户与岗位关联表';

-- ----------------------------
-- Records of sys_user_post
-- ----------------------------
BEGIN;
INSERT INTO `sys_user_post` (`user_id`, `post_id`) VALUES (1, 1);
INSERT INTO `sys_user_post` (`user_id`, `post_id`) VALUES (2, 2);
COMMIT; -- 【系统管理模块 - 用户岗位关联表】

-- ----------------------------
-- Table structure for sys_user_role
-- ----------------------------
DROP TABLE IF EXISTS `sys_user_role`;
CREATE TABLE `sys_user_role` (
  `user_id` int NOT NULL COMMENT '用户ID',
  `role_id` int NOT NULL COMMENT '角色ID',
  PRIMARY KEY (`user_id`,`role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='【系统管理模块 - 用户角色关联表】用户和角色关联表';

-- ----------------------------
-- Records of sys_user_role
-- ----------------------------
BEGIN;
INSERT INTO `sys_user_role` (`user_id`, `role_id`) VALUES (1, 1);
INSERT INTO `sys_user_role` (`user_id`, `role_id`) VALUES (2, 2);
COMMIT; -- 【系统管理模块 - 用户角色关联表】

-- ----------------------------
-- Table structure for water_zone
-- ----------------------------
CREATE TABLE IF NOT EXISTS `water_zone` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键',
  `parent_id` bigint(20) DEFAULT 0 COMMENT '父级分区ID',
  `ancestors` varchar(255) DEFAULT '' COMMENT '祖级列表',
  `type` char(1) NOT NULL DEFAULT '1' COMMENT '分区维度（1:行政营业, 2:DMA漏损, 3:控压高程, 4:供水调度）',
  `level` int(11) DEFAULT 1 COMMENT '分区级别',
  `name` varchar(100) NOT NULL COMMENT '分区名称',
  `code` varchar(50) DEFAULT '' COMMENT '分区编码',
  `area` decimal(10,2) DEFAULT 0.00 COMMENT '覆盖面积(平方公里)',
  `population` int(11) DEFAULT 0 COMMENT '服务人口',
  `address` varchar(255) DEFAULT '' COMMENT '位置描述',
  `dept_id` int(11) DEFAULT NULL COMMENT '所属部门ID',
  `user_id` int(11) DEFAULT NULL COMMENT '负责人ID',
  `manager_name` varchar(50) DEFAULT '' COMMENT '负责人姓名',
  `manager_phone` varchar(20) DEFAULT '' COMMENT '负责人电话',
  `longitude` varchar(30) DEFAULT '' COMMENT '中心经度',
  `latitude` varchar(30) DEFAULT '' COMMENT '中心纬度',
  `boundary` longtext COMMENT '地理边界信息(GeoJSON)',
  `sort` int(11) DEFAULT 0 COMMENT '排序号',
  `status` char(1) DEFAULT '0' COMMENT '状态（0正常 1停用）',
  `iot_status` char(1) DEFAULT '0' COMMENT '物联状态（0在线 1异常 2离线 3报警）',
  `del_flag` char(1) DEFAULT '0' COMMENT '删除标志（0代表存在 1代表删除）',
  `create_by` varchar(64) DEFAULT '' COMMENT '创建者',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_by` varchar(64) DEFAULT '' COMMENT '更新者',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  `remark` varchar(500) DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='【综合水务分区表】综合综合水务分区表综合水务分区表';
COMMIT; -- 【水务基础模块 - 水务分区表】

-- ----------------------------
-- Table structure for water_zone_metric_calc
-- ----------------------------
CREATE TABLE IF NOT EXISTS `water_zone_metric_calc` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '规则ID',
  `zone_code` varchar(50) NOT NULL COMMENT '分区编码',
  `metric_type` varchar(50) NOT NULL COMMENT '指标类型(如 supply:供水量, min_flow:夜间最小流量)',
  `point_code` varchar(50) NOT NULL COMMENT '测点编码',
  `calc_sign` int(11) NOT NULL DEFAULT 1 COMMENT '计算符号(1加法 -1减法)',
  `del_flag` char(1) DEFAULT '0' COMMENT '删除标志（0代表存在 1代表删除）',
  `status` char(1) DEFAULT '0' COMMENT '状态',
  `create_by` varchar(64) DEFAULT '' COMMENT '创建者',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_by` varchar(64) DEFAULT '' COMMENT '更新者',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  `remark` varchar(500) DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`id`),
  KEY `idx_zone_code` (`zone_code`),
  KEY `idx_metric_type` (`metric_type`),
  KEY `idx_point_code` (`point_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='【水务基础模块 - 分区指标计算规则表】';
COMMIT; -- 【水务基础模块 - 分区指标计算规则表】

-- ----------------------------
-- Table structure for water_station
-- ----------------------------
CREATE TABLE IF NOT EXISTS `water_station` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '站点ID',
  `name` varchar(100) NOT NULL COMMENT '站点名称',
  `code` varchar(50) NOT NULL COMMENT '站点编码',
  `type` varchar(20) DEFAULT 'OTHER' COMMENT '站点类型',
  `zone_code` varchar(50) DEFAULT NULL COMMENT '所属分区编码',
  `manager_name` varchar(50) DEFAULT NULL COMMENT '负责人',
  `manager_phone` varchar(20) DEFAULT NULL COMMENT '负责人电话',
  `longitude` varchar(30) DEFAULT NULL COMMENT '经度',
  `latitude` varchar(30) DEFAULT NULL COMMENT '纬度',
  `address` varchar(255) DEFAULT NULL COMMENT '详细地址',
  `construction_unit` varchar(100) DEFAULT NULL COMMENT '建设单位',
  `commissioning_date` datetime DEFAULT NULL COMMENT '投运日期',
  `design_capacity` decimal(10,2) DEFAULT NULL COMMENT '设计能力',
  `sort` int DEFAULT 0 COMMENT '排序',
  `status` char(1) DEFAULT '0' COMMENT '状态（0正常 1停用）',
  `iot_status` char(1) DEFAULT '0' COMMENT '物联状态（0在线 1异常 2离线 3报警）',
  `del_flag` char(1) DEFAULT '0' COMMENT '删除标志（0代表存在 1代表删除）',
  `dept_id` bigint(20) DEFAULT NULL COMMENT '部门ID',
  `user_id` bigint(20) DEFAULT NULL COMMENT '用户ID',
  `create_by` varchar(64) DEFAULT '' COMMENT '创建者',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_by` varchar(64) DEFAULT '' COMMENT '更新者',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  `remark` varchar(500) DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='【水务基础模块 - 站点表】站点信息表';
COMMIT; -- 【水务基础模块 - 站点信息表】

-- ----------------------------
-- Table structure for water_device
-- ----------------------------
CREATE TABLE IF NOT EXISTS `water_device` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '设备ID',
  `name` varchar(100) NOT NULL COMMENT '设备名称',
  `code` varchar(50) NOT NULL COMMENT '设备编码',
  `station_code` varchar(50) DEFAULT NULL COMMENT '所属站点编码',
  `zone_code` varchar(50) DEFAULT NULL COMMENT '所属分区编码',
  `type` varchar(20) DEFAULT 'OTHER' COMMENT '设备类型',
  `expected_cycle` int NULL COMMENT '预期数据周期(分钟)',
  `model` varchar(100) DEFAULT NULL COMMENT '设备型号',
  `manufacturer` varchar(100) DEFAULT NULL COMMENT '生产厂家',
  `install_date` datetime DEFAULT NULL COMMENT '安装日期',
  `lifespan` int DEFAULT NULL COMMENT '设计寿命(年)',
  `power` varchar(50) DEFAULT NULL COMMENT '额定功率(kW)',
  `manager_name` varchar(50) DEFAULT NULL COMMENT '负责人',
  `manager_phone` varchar(20) DEFAULT NULL COMMENT '负责人电话',
  `sort` int DEFAULT 0 COMMENT '排序',
  `status` char(1) DEFAULT '0' COMMENT '状态',
  `iot_status` char(1) DEFAULT '0' COMMENT '物联状态（0在线 1异常 2离线 3报警）',
  `del_flag` char(1) DEFAULT '0' COMMENT '删除标志',
  `dept_id` bigint(20) DEFAULT NULL COMMENT '部门ID',
  `user_id` bigint(20) DEFAULT NULL COMMENT '用户ID',
  `create_by` varchar(64) DEFAULT '' COMMENT '创建者',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_by` varchar(64) DEFAULT '' COMMENT '更新者',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  `remark` varchar(500) DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='【水务基础模块 - 设备表】设备信息表';
COMMIT; -- 【水务基础模块 - 设备信息表】

-- ----------------------------
-- Table structure for water_point
-- ----------------------------
CREATE TABLE IF NOT EXISTS `water_point` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '测点ID',
  `name` varchar(100) NOT NULL COMMENT '测点名称',
  `code` varchar(50) NOT NULL COMMENT '测点编码(设备通信唯一标识)',
  `device_code` varchar(50) DEFAULT NULL COMMENT '所属设备编码',
  `type` varchar(20) DEFAULT 'OTHER' COMMENT '测点类型',
  `aggType` varchar(32) DEFAULT 'instantaneous' COMMENT '聚合模式',
  `expected_cycle` int NULL COMMENT '预期数据周期(分钟)',
  `range_max` decimal(10,2) DEFAULT NULL COMMENT '量程上限',
  `range_min` decimal(10,2) DEFAULT NULL COMMENT '量程下限',
  `alarm_max` decimal(10,2) DEFAULT NULL COMMENT '报警上限',
  `alarm_min` decimal(10,2) DEFAULT NULL COMMENT '报警下限',
  `unit` varchar(20) DEFAULT NULL COMMENT '计量单位(m³/h, MPa, m, mg/L等)',
  `data_type` varchar(20) DEFAULT 'float' COMMENT '数据类型',
  `rw_attr` varchar(10) DEFAULT 'R' COMMENT '读写属性',
  `sort` int DEFAULT 0 COMMENT '排序',
  `status` char(1) DEFAULT '0' COMMENT '状态',
  `iot_status` char(1) DEFAULT '0' COMMENT '物联状态（0在线 1异常 2离线 3报警）',
  `del_flag` char(1) DEFAULT '0' COMMENT '删除标志',
  `dept_id` bigint(20) DEFAULT NULL COMMENT '部门ID',
  `user_id` bigint(20) DEFAULT NULL COMMENT '用户ID',
  `create_by` varchar(64) DEFAULT '' COMMENT '创建者',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_by` varchar(64) DEFAULT '' COMMENT '更新者',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  `remark` varchar(500) DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='【水务基础模块 - 测点表】测点信息表';
COMMIT; -- 【水务基础模块 - 测点信息表】

-- ----------------------------
-- Table structure for water_pipe
-- ----------------------------
CREATE TABLE IF NOT EXISTS `water_pipe` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '管线ID',
  `name` varchar(100) NOT NULL COMMENT '管线名称',
  `code` varchar(50) NOT NULL COMMENT '管线编码',
  `pipe_type` varchar(20) DEFAULT 'WATER_SUPPLY' COMMENT '管线类型(供水/排水/污水等)',
  `material` varchar(20) DEFAULT NULL COMMENT '管材(PVC/PE/铸铁/钢管等)',
  `diameter` decimal(10,2) DEFAULT NULL COMMENT '管径(mm)',
  `length` decimal(10,2) DEFAULT NULL COMMENT '管线长度(m)',
  `start_node` varchar(100) DEFAULT NULL COMMENT '起点节点名称',
  `end_node` varchar(100) DEFAULT NULL COMMENT '终点节点名称',
  `burial_depth` decimal(5,2) DEFAULT NULL COMMENT '埋深(m)',
  `install_date` datetime DEFAULT NULL COMMENT '铺设日期',
  `coordinates` text DEFAULT NULL COMMENT '管线路径坐标(JSON数组)',
  `zone_code` varchar(50) DEFAULT NULL COMMENT '所属分区编码',
  `construction_unit` varchar(100) DEFAULT NULL COMMENT '施工单位',
  `sort` int DEFAULT 0 COMMENT '排序',
  `status` char(1) DEFAULT '0' COMMENT '状态（0正常 1停用）',
  `del_flag` char(1) DEFAULT '0' COMMENT '删除标志（0代表存在 1代表删除）',
  `dept_id` bigint(20) DEFAULT NULL COMMENT '部门ID',
  `user_id` bigint(20) DEFAULT NULL COMMENT '用户ID',
  `create_by` varchar(64) DEFAULT '' COMMENT '创建者',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_by` varchar(64) DEFAULT '' COMMENT '更新者',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  `remark` varchar(500) DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='【水务基础模块 - 管网管线表】管网管线信息表';
COMMIT; -- 【水务基础模块 - 管网管线表】

-- ----------------------------
-- Table structure for water_bill
-- ----------------------------
CREATE TABLE IF NOT EXISTS `water_bill` (
  `bill_id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '账单ID',
  `user_no` varchar(50) NOT NULL COMMENT '用户编号',
  `zone_code` varchar(50) DEFAULT NULL COMMENT '所属分区编码',
  `bill_period` varchar(7) NOT NULL COMMENT '账单周期(YYYY-MM)',
  `water_usage` decimal(12,3) DEFAULT 0 COMMENT '用水量(m³)',
  `unit_price` decimal(10,4) DEFAULT 0 COMMENT '单价(元/m³)',
  `total_amount` decimal(12,2) DEFAULT 0 COMMENT '账单总金额(元)',
  `paid_amount` decimal(12,2) DEFAULT 0 COMMENT '已缴金额(元)',
  `unpaid_amount` decimal(12,2) DEFAULT 0 COMMENT '未缴金额(元)',
  `status` char(1) DEFAULT '0' COMMENT '状态（0正常 1停用）',
  `bill_status` char(1) DEFAULT '0' COMMENT '账单状态（0未缴 1部分 2已缴）',
  `generate_time` datetime DEFAULT NULL COMMENT '账单生成时间',
  `pay_time` datetime DEFAULT NULL COMMENT '最后缴费时间',
  `del_flag` char(1) DEFAULT '0' COMMENT '删除标志',
  `dept_id` bigint(20) DEFAULT NULL COMMENT '部门ID',
  `create_by` varchar(64) DEFAULT '' COMMENT '创建者',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_by` varchar(64) DEFAULT '' COMMENT '更新者',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  `remark` varchar(500) DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`bill_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='【水务基础模块 - 水费账单表】水费账单信息表';
COMMIT; -- 【水务基础模块 - 水费账单表】

-- ----------------------------
-- Table structure for scada_revenue_user
-- ----------------------------
CREATE TABLE IF NOT EXISTS `scada_revenue_user` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `user_no` varchar(50) NOT NULL COMMENT '用户编号',
  `user_name` varchar(100) DEFAULT NULL COMMENT '用户名称',
  `contract_no` varchar(50) DEFAULT NULL COMMENT '合同编号',
  `id_card` varchar(50) DEFAULT NULL COMMENT '证件号码/统一社会信用代码',
  `user_type` varchar(50) DEFAULT NULL COMMENT '用户类型(字典)',
  `zone_code` varchar(50) DEFAULT NULL COMMENT '所属分区编码',
  `phone` varchar(50) DEFAULT NULL COMMENT '手机号',
  `address` varchar(255) DEFAULT NULL COMMENT '地址',
  `meter_no` varchar(50) DEFAULT NULL COMMENT '水表编号',
  `book_no` varchar(50) DEFAULT NULL COMMENT '表册编号',
  `charge_type` varchar(50) DEFAULT NULL COMMENT '收费类型',
  `caliber` varchar(20) DEFAULT NULL COMMENT '口径',
  `card_category` varchar(50) DEFAULT NULL COMMENT '用户水卡分类(字典)',
  `user_category` varchar(50) DEFAULT NULL COMMENT '用户分类(字典)',
  `status` char(1) DEFAULT '0' COMMENT '用户状态(0正常 1停用)',
  `install_date` datetime DEFAULT NULL COMMENT '立户日期/安装日期',
  `arrears_amount` decimal(10,2) DEFAULT '0.00' COMMENT '欠费金额',
  `balance` decimal(10,2) DEFAULT '0.00' COMMENT '账户余额',
  `associated_user_id` bigint(20) DEFAULT NULL COMMENT '关联系统用户ID',
  `dept_id` bigint(20) DEFAULT NULL COMMENT '部门ID',
  `remark` varchar(500) DEFAULT NULL COMMENT '备注',
  `create_by` varchar(64) DEFAULT '' COMMENT '创建者',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_by` varchar(64) DEFAULT '' COMMENT '更新者',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  `del_flag` char(1) DEFAULT '0' COMMENT '删除标志(0代表存在 2代表删除)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_no` (`user_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='【营收基础模块 - 营收用户表】营收用户信息表';
COMMIT; -- 【营收模块 - 营收用户表】

-- ----------------------------
-- Table structure for water_data_source
-- ----------------------------
CREATE TABLE IF NOT EXISTS `water_data_source` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '数据源ID',
  `name` VARCHAR(100) NOT NULL COMMENT '数据源名称',
  `type` VARCHAR(50) NOT NULL COMMENT '数据源类型',
  `connection_str` VARCHAR(500) NULL COMMENT '连接字符串或路径',
  `username` VARCHAR(100) NULL COMMENT '用户名/认证信息',
  `password` VARCHAR(100) NULL COMMENT '密码/凭证',
  `status` CHAR(1) NOT NULL DEFAULT '0' COMMENT '状态',
  `del_flag` CHAR(1) NOT NULL DEFAULT '0' COMMENT '删除标志',
  `create_by` VARCHAR(64) NOT NULL DEFAULT '' COMMENT '创建者',
  `create_time` DATETIME NULL COMMENT '创建时间',
  `update_by` VARCHAR(64) NOT NULL DEFAULT '' COMMENT '更新者',
  `update_time` DATETIME NULL COMMENT '更新时间',
  `remark` VARCHAR(500) NULL COMMENT '备注',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='【数据接入模块 - 数据源表】数据源配置表';
COMMIT; -- 【数据接入模块 - 数据源配置表】

-- ----------------------------
-- Table structure for water_data_task
-- ----------------------------
CREATE TABLE IF NOT EXISTS `water_data_task` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '任务ID',
  `name` VARCHAR(100) NOT NULL COMMENT '任务名称',
  `source_id` BIGINT NOT NULL COMMENT '绑定的数据源ID',
  `cron_expression` VARCHAR(100) NULL COMMENT '执行频率 (Cron表达式)',
  `batch_size` INT DEFAULT 0 COMMENT '单次拉取批次大小(0为不限制)',
  `query_sql_or_topic` TEXT NULL COMMENT '提取指令 (SQL/Topic/FilePath)',
  `auto_backfill` TINYINT NOT NULL DEFAULT 0 COMMENT '是否自动触发历史补录 (0-否 1-是)',
  `interpolation` VARCHAR(32) NULL COMMENT '插值策略',
  `target_entity` VARCHAR(100) NULL COMMENT '目标实体表名或类别(如 sys_zone, sys_device, tdengine)',
  `status` CHAR(1) NOT NULL DEFAULT '0' COMMENT '任务状态 (0正常 1停用)',
  `last_run_time` DATETIME NULL COMMENT '最后执行时间',
  `last_run_status` CHAR(1) NULL COMMENT '最后执行状态 (0-成功 1-失败)',
  `last_run_msg` TEXT NULL COMMENT '最后执行日志信息',
  `del_flag` CHAR(1) NOT NULL DEFAULT '0' COMMENT '删除标志',
  `create_by` VARCHAR(64) NOT NULL DEFAULT '' COMMENT '创建者',
  `create_time` DATETIME NULL COMMENT '创建时间',
  `update_by` VARCHAR(64) NOT NULL DEFAULT '' COMMENT '更新者',
  `update_time` DATETIME NULL COMMENT '更新时间',
  `remark` VARCHAR(500) NULL COMMENT '备注',
  PRIMARY KEY (`id`),
  KEY `idx_water_data_task_source_id` (`source_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='【数据接入模块 - 数据接入任务表】数据接入任务配置表';
COMMIT; -- 【数据接入模块 - 数据接入任务配置表】

-- ----------------------------
-- Table structure for water_data_mapping
-- ----------------------------
CREATE TABLE IF NOT EXISTS `water_data_mapping` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '映射ID',
  `task_id` BIGINT NOT NULL COMMENT '所属任务ID',
  `source_field` VARCHAR(100) NOT NULL COMMENT '源数据字段名',
  `target_field` VARCHAR(50) NOT NULL COMMENT '目标TDengine字段',
  `is_update_key` TINYINT NOT NULL DEFAULT 0 COMMENT '是否作为更新依据(0否 1是)',
  `transform_rule` VARCHAR(500) NULL COMMENT '字典转换规则(A=1,B=0)',
  `status` CHAR(1) NOT NULL DEFAULT '0' COMMENT '状态',
  `del_flag` CHAR(1) NOT NULL DEFAULT '0' COMMENT '删除标志',
  `create_by` VARCHAR(64) NOT NULL DEFAULT '' COMMENT '创建者',
  `create_time` DATETIME NULL COMMENT '创建时间',
  `update_by` VARCHAR(64) NOT NULL DEFAULT '' COMMENT '更新者',
  `update_time` DATETIME NULL COMMENT '更新时间',
  `remark` VARCHAR(500) NULL COMMENT '备注',
  PRIMARY KEY (`id`),
  KEY `idx_water_data_mapping_task_id` (`task_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='【数据接入模块 - 字段映射规则表】字段映射规则表';
COMMIT; -- 【数据接入模块 - 字段映射规则表】

-- ----------------------------
-- Alarm Module Tables
-- ----------------------------

-- 报警规则配置表
CREATE TABLE IF NOT EXISTS `sys_alarm_rule` (
  `rule_id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '规则ID',
  `rule_name` varchar(100) NOT NULL COMMENT '规则名称',
  `rule_type` varchar(2) DEFAULT '1' COMMENT '规则类型(1-设备 2-分区 3-系统)',
  `scope_type` varchar(20) DEFAULT 'device' COMMENT '作用域类型: device/zone/all_devices/all_zones/device_group',
  `scope_value` text DEFAULT NULL COMMENT '作用域值: 设备/分区编码列表(逗号分隔) 或 组名',
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
CREATE TABLE IF NOT EXISTS `sys_alarm_history` (
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
SET FOREIGN_KEY_CHECKS = 1; -- 【报警模块 - 报警历史记录表】

-- 【迁移脚本】为已有 sys_alarm_rule 表增加作用域字段（适用于存量数据库升级）
-- ALTER TABLE `sys_alarm_rule` ADD COLUMN IF NOT EXISTS `scope_type` varchar(20) DEFAULT 'device' COMMENT '作用域类型' AFTER `rule_type`;
-- ALTER TABLE `sys_alarm_rule` ADD COLUMN IF NOT EXISTS `scope_value` text DEFAULT NULL COMMENT '作用域值' AFTER `scope_type`;