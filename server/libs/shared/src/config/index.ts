import { readFileSync } from 'fs';
import * as yaml from 'js-yaml';
import { join } from 'path';

const configFileNameObj = {
  development: 'dev',
  test: 'test',
  production: 'prod',
};

const env = process.env.NODE_ENV;

console.log(env);

export default () => {
  const config = yaml.load(readFileSync(join(__dirname, `./${configFileNameObj[env]}.yml`), 'utf8')) as Record<string, any>;
  
  if (process.env.MYSQL_HOST) config.db.mysql.host = process.env.MYSQL_HOST;
  if (process.env.MYSQL_PASSWORD) config.db.mysql.password = process.env.MYSQL_PASSWORD;
  if (process.env.MYSQL_DATABASE) config.db.mysql.database = process.env.MYSQL_DATABASE;
  
  if (process.env.REDIS_HOST) config.redis.host = process.env.REDIS_HOST;
  if (process.env.REDIS_PASSWORD) config.redis.password = process.env.REDIS_PASSWORD;
  
  if (process.env.MICRO_AUTH_HOST) config.microservices.auth.host = process.env.MICRO_AUTH_HOST;
  if (process.env.MICRO_AUTH_PORT) config.microservices.auth.port = parseInt(process.env.MICRO_AUTH_PORT, 10);
  
  if (process.env.MICRO_SYSTEM_HOST) config.microservices.system.host = process.env.MICRO_SYSTEM_HOST;
  if (process.env.MICRO_SYSTEM_PORT) config.microservices.system.port = parseInt(process.env.MICRO_SYSTEM_PORT, 10);
  
  if (process.env.MICRO_MONITOR_HOST) config.microservices.monitor.host = process.env.MICRO_MONITOR_HOST;
  if (process.env.MICRO_MONITOR_PORT) config.microservices.monitor.port = parseInt(process.env.MICRO_MONITOR_PORT, 10);
  
  if (process.env.MICRO_UPLOAD_HOST) config.microservices.upload.host = process.env.MICRO_UPLOAD_HOST;
  if (process.env.MICRO_UPLOAD_PORT) config.microservices.upload.port = parseInt(process.env.MICRO_UPLOAD_PORT, 10);
  
  if (process.env.MICRO_TOOLS_HOST) config.microservices.tools.host = process.env.MICRO_TOOLS_HOST;
  if (process.env.MICRO_TOOLS_PORT) config.microservices.tools.port = parseInt(process.env.MICRO_TOOLS_PORT, 10);

  return config;
};
