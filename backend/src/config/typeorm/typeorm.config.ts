import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import type { LogLevel } from 'typeorm';

export const getTypeOrmConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const nodeEnv = configService.get<string>('NODE_ENV');
  const logLevel = configService.get<string>('LOG_LEVEL');
  const isDebugLog = logLevel === 'debug';

  const nonProdLogging: LogLevel[] = isDebugLog
    ? ['error', 'warn', 'migration', 'info', 'log']
    : ['error', 'warn', 'migration'];

  return {
    type: 'postgres',
    url: configService.get<string>('DATABASE_URL'),
    entities: [join(__dirname, '../../**/*.entity.{ts,js}')],
    migrations: [join(__dirname, '../../../migrations/*.{ts,js}')],
    synchronize: false,
    migrationsRun: false,
    logging: nodeEnv === 'production' ? ['error', 'warn'] : nonProdLogging,
    ...(nodeEnv === 'test' ? { retryAttempts: 0, retryDelay: 0 } : {}),
  };
};
