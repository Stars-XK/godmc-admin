import { readFileSync, existsSync } from 'fs';
import * as yaml from 'js-yaml';
import { join } from 'path';

const configFileNameObj = {
  development: 'dev',
  test: 'test',
  production: 'prod',
};

const env = process.env.NODE_ENV || 'development';

/**
 * 递归解析对象中的所有 ${VAR} / ${VAR:-default} 占位符
 */
function resolveEnvVars(obj: any): any {
  if (typeof obj === 'string') {
    return obj.replace(/\$\{(\w+)(?::-([^}]*))?\}/g, (_match, varName, defaultValue) => {
      return process.env[varName] !== undefined ? process.env[varName] : (defaultValue || '');
    });
  }
  if (Array.isArray(obj)) {
    return obj.map(item => resolveEnvVars(item));
  }
  if (obj !== null && typeof obj === 'object') {
    const resolved: Record<string, any> = {};
    for (const key of Object.keys(obj)) {
      resolved[key] = resolveEnvVars(obj[key]);
    }
    return resolved;
  }
  return obj;
}

export default () => {
  const configFileName = configFileNameObj[env] || configFileNameObj.development;
  const configPath = join(process.cwd(), 'libs/shared/src/config', `${configFileName}.yml`);
  const raw = yaml.load(readFileSync(configPath, 'utf8')) as Record<string, any>;

  // 解析所有 ${VAR:-default} 占位符
  const config = resolveEnvVars(raw);

  return config;
};
