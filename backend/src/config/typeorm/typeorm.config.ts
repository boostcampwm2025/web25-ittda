import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';

export const getTypeOrmConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  url: configService.get<string>('DATABASE_URL'),
  entities: [join(__dirname, '../../**/*.entity.{ts,js}')],
  migrations: [join(__dirname, '../../../migrations/*.{ts,js}')],
  synchronize: process.env.NODE_ENV === 'test',
  migrationsRun: false,
  logging:
    configService.get<string>('NODE_ENV') === 'production'
      ? ['error', 'warn']
      : ['error', 'warn', 'migration', 'query', 'info', 'log'],
});
