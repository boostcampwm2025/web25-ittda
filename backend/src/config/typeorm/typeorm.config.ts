import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getTypeOrmConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  url: configService.get<string>('DATABASE_URL'),
  entities: [__dirname + '/../**/*.entity{.ts,.js}'], // typeorm entity
  migrations: [__dirname + '/../../migrations/*{.ts,.js}'],
  synchronize: false,
  migrationsRun: configService.get<string>('NODE_ENV') === 'production',
  logging:
    configService.get<string>('NODE_ENV') === 'production'
      ? ['error', 'warn']
      : ['error', 'warn', 'migration', 'query'],
});
