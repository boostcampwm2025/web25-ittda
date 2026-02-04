import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';

export const getTypeOrmConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const nodeEnv = configService.get<string>('NODE_ENV');
  return {
    type: 'postgres',
    url: configService.get<string>('DATABASE_URL'),
    entities: [join(__dirname, '../../**/*.entity.{ts,js}')],
    migrations: [join(__dirname, '../../../migrations/*.{ts,js}')],
    synchronize: false,
    migrationsRun: false,
    logging:
      nodeEnv === 'production'
        ? ['error', 'warn']
        : ['error', 'warn', 'migration', 'info', 'log'],
  };
};
