import { readFileSync } from 'fs';
import * as yaml from 'js-yaml';
import { join } from 'path';

const configFileNameObj = {
  development: 'dev',
  test: 'test',
  production: 'prod',
};

const env = process.env.NODE_ENV;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

console.log(env);

export default () => {
  const config = yaml.load(
    readFileSync(join(__dirname, `./${configFileNameObj[env]}.yml`), 'utf8'),
  ) as Record<string, any>;

  config.db.mysql.password = requireEnv('DB_PASSWORD');
  config.db.mysql.multipleStatements = false;
  config.redis.password = requireEnv('REDIS_PASSWORD');
  config.jwt.secretkey = requireEnv('JWT_SECRET');
  config.user.initialPassword = requireEnv('INITIAL_USER_PASSWORD');

  return config;
};
