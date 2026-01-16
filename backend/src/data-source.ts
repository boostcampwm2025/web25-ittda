// backend/src/data-source.ts
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as path from 'path';
import * as dotenv from 'dotenv';

const nodeEnv = process.env.NODE_ENV ?? 'local';
dotenv.config({ path: path.resolve(__dirname, `../.env.${nodeEnv}`) });

if (!process.env.DATABASE_URL) {
  throw new Error(`DATABASE_URL is missing. (loaded from .env.${nodeEnv})`);
}

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,

  // 엔티티 위치(프로젝트에 맞게 유지)
  entities: [path.join(__dirname, '/**/*.entity{.ts,.js}')],

  // migration 위치
  migrations: [path.join(__dirname, '/../migrations/*{.ts,.js}')],

  synchronize: false,
  migrationsRun: false,

  logging:
    nodeEnv === 'production'
      ? ['error', 'warn']
      : ['error', 'warn', 'migration', 'info', 'log'],
});
