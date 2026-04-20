import { readFileSync } from 'fs';
import * as yaml from 'js-yaml';
import { join } from 'path';

const configFileNameObj = {
  development: 'dev',
  test: 'test',
  production: 'prod',
};

const env = process.env.NODE_ENV || 'development';

export default () => {
  const configFileName = configFileNameObj[env] || configFileNameObj.development;
  const configPath = join(process.cwd(), 'libs/shared/src/config', `${configFileName}.yml`);
  const config = yaml.load(readFileSync(configPath, 'utf8')) as Record<string, any>;
  
  if (process.env.MYSQL_HOST) config.db.mysql.host = process.env.MYSQL_HOST;
  if (process.env.MYSQL_PASSWORD) config.db.mysql.password = process.env.MYSQL_PASSWORD;
  if (process.env.MYSQL_DATABASE) config.db.mysql.database = process.env.MYSQL_DATABASE;
  
  if (process.env.REDIS_HOST) config.redis.host = process.env.REDIS_HOST;
  if (process.env.REDIS_PASSWORD) config.redis.password = process.env.REDIS_PASSWORD;
  
  return config;
};
