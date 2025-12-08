import { DataSource, DataSourceOptions } from 'typeorm';
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

const baseConfig: DataSourceOptions = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  type: process.env.PG_DATABASE_TYPE,
  host: process.env.PG_DATABASE_HOST,
  port: parseInt(process.env.PG_DATABASE_PORT),
  username: process.env.PG_DATABASE_USERNAME,
  password: process.env.PG_DATABASE_PASSWORD,
  database: process.env.PG_DATABASE_DB,
  synchronize: false,
};

export const pgOrmConfig: DataSourceOptions = {
  ...baseConfig,
};
