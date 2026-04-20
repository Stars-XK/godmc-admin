-- 1.1.2-system-config-keys.sql
-- System Web Config
INSERT IGNORE INTO sys_config (config_name, config_key, config_value, config_type, remark, create_time) VALUES
('网站Logo', 'sys.web.logo', 'https://example.com/logo.png', 'Y', '网站Logo URL地址', NOW()),
('网站名称', 'sys.web.siteName', 'Nest Admin', 'Y', '网站显示的全局名称', NOW()),
('网站标题', 'sys.web.title', 'Nest Admin 后台管理系统', 'Y', '浏览器标签页标题', NOW()),
('网站描述', 'sys.web.description', '一款基于 NestJS + Vue3 的后台管理系统', 'Y', '网站SEO描述信息', NOW()),
('系统主色调', 'sys.web.primaryColor', '#111827', 'Y', '系统全局主色调', NOW());

-- Storage Config
INSERT IGNORE INTO sys_config (config_name, config_key, config_value, config_type, remark, create_time) VALUES
('存储方式', 'sys.storage.type', 'local', 'Y', '存储方式 (local/oss)', NOW()),
('本地存储路径', 'sys.storage.local.path', '/upload/files', 'Y', '本地存储目录', NOW()),
('OSS Endpoint', 'sys.storage.oss.endpoint', 'oss-cn-hangzhou.aliyuncs.com', 'Y', 'OSS Endpoint', NOW()),
('OSS AccessKey', 'sys.storage.oss.accessKey', '', 'Y', 'OSS AccessKey', NOW()),
('OSS SecretKey', 'sys.storage.oss.secretKey', '', 'Y', 'OSS SecretKey', NOW()),
('OSS Bucket', 'sys.storage.oss.bucket', 'my-bucket', 'Y', 'OSS Bucket名称', NOW());

-- Mail / SMS Placeholders
INSERT IGNORE INTO sys_config (config_name, config_key, config_value, config_type, remark, create_time) VALUES
('SMTP 服务器', 'sys.mail.smtp', 'smtp.example.com', 'Y', 'SMTP 发信服务器地址', NOW()),
('短信提供商', 'sys.sms.provider', 'aliyun', 'Y', '短信网关提供商', NOW());
