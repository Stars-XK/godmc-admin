const fs = require('fs');
const path = require('path');

const initSqlPath = path.join(__dirname, 'server/db/init.sql');
let content = fs.readFileSync(initSqlPath, 'utf8');

// 1. Add dict type
const dictTypeInsert = "INSERT INTO `sys_dict_type` (`dict_id`, `dict_name`, `dict_type`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (14, '物联状态', 'iot_device_status', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '智慧水务-物联状态', '0');\n";
content = content.replace(
  "INSERT INTO `sys_dict_type` (`dict_id`, `dict_name`, `dict_type`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (13, '测点类型', 'water_point_type', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '智慧水务-测点类型', '0');\n",
  "INSERT INTO `sys_dict_type` (`dict_id`, `dict_name`, `dict_type`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (13, '测点类型', 'water_point_type', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '智慧水务-测点类型', '0');\n" + dictTypeInsert
);

// 2. Add dict data
const dictDataInsert = `INSERT INTO \`sys_dict_data\` (\`dict_code\`, \`dict_sort\`, \`dict_label\`, \`dict_value\`, \`dict_type\`, \`css_class\`, \`list_class\`, \`is_default\`, \`status\`, \`create_by\`, \`create_time\`, \`update_by\`, \`update_time\`, \`remark\`, \`del_flag\`) VALUES (45, 1, '在线', '0', 'iot_device_status', '', 'success', 'Y', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '在线状态', '0');
INSERT INTO \`sys_dict_data\` (\`dict_code\`, \`dict_sort\`, \`dict_label\`, \`dict_value\`, \`dict_type\`, \`css_class\`, \`list_class\`, \`is_default\`, \`status\`, \`create_by\`, \`create_time\`, \`update_by\`, \`update_time\`, \`remark\`, \`del_flag\`) VALUES (46, 2, '异常', '1', 'iot_device_status', '', 'warning', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '异常状态', '0');
INSERT INTO \`sys_dict_data\` (\`dict_code\`, \`dict_sort\`, \`dict_label\`, \`dict_value\`, \`dict_type\`, \`css_class\`, \`list_class\`, \`is_default\`, \`status\`, \`create_by\`, \`create_time\`, \`update_by\`, \`update_time\`, \`remark\`, \`del_flag\`) VALUES (47, 3, '离线', '2', 'iot_device_status', '', 'info', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '离线状态', '0');
INSERT INTO \`sys_dict_data\` (\`dict_code\`, \`dict_sort\`, \`dict_label\`, \`dict_value\`, \`dict_type\`, \`css_class\`, \`list_class\`, \`is_default\`, \`status\`, \`create_by\`, \`create_time\`, \`update_by\`, \`update_time\`, \`remark\`, \`del_flag\`) VALUES (48, 4, '报警', '3', 'iot_device_status', '', 'danger', 'N', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '报警状态', '0');\n`;

content = content.replace(
  "INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (40, 1, '流量', 'FLOW', 'water_point_type', '', 'primary', 'Y', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '流量测点', '0');\n",
  "INSERT INTO `sys_dict_data` (`dict_code`, `dict_sort`, `dict_label`, `dict_value`, `dict_type`, `css_class`, `list_class`, `is_default`, `status`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`, `del_flag`) VALUES (40, 1, '流量', 'FLOW', 'water_point_type', '', 'primary', 'Y', '0', 'admin', '2025-02-28 16:52:10.000000', '', NULL, '流量测点', '0');\n" + dictDataInsert
);

// 3. Add iot_status column to tables
content = content.replace(
  "`status` char(1) DEFAULT '0' COMMENT '状态（0正常 1停用）',\n  `del_flag` char(1) DEFAULT '0' COMMENT '删除标志（0代表存在 1代表删除）',",
  "`status` char(1) DEFAULT '0' COMMENT '状态（0正常 1停用）',\n  `iot_status` char(1) DEFAULT '0' COMMENT '物联状态（0在线 1异常 2离线 3报警）',\n  `del_flag` char(1) DEFAULT '0' COMMENT '删除标志（0代表存在 1代表删除）',"
);

content = content.replace(
  "`status` char(1) DEFAULT '0' COMMENT '状态',\n  `del_flag` char(1) DEFAULT '0' COMMENT '删除标志',",
  "`status` char(1) DEFAULT '0' COMMENT '状态',\n  `iot_status` char(1) DEFAULT '0' COMMENT '物联状态（0在线 1异常 2离线 3报警）',\n  `del_flag` char(1) DEFAULT '0' COMMENT '删除标志',"
);

// Second replacement for device/point table since there are two occurrences
content = content.replace(
  "`status` char(1) DEFAULT '0' COMMENT '状态',\n  `del_flag` char(1) DEFAULT '0' COMMENT '删除标志',",
  "`status` char(1) DEFAULT '0' COMMENT '状态',\n  `iot_status` char(1) DEFAULT '0' COMMENT '物联状态（0在线 1异常 2离线 3报警）',\n  `del_flag` char(1) DEFAULT '0' COMMENT '删除标志',"
);


fs.writeFileSync(initSqlPath, content, 'utf8');
console.log('init.sql updated successfully.');