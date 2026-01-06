import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getTypeOrmConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  migrations: [__dirname + '/../../migrations/*{.ts,.js}'], // migration production용
  url: configService.get<string>('DATABASE_URL'),
  entities: [__dirname + '/../**/*.entity{.ts,.js}'], // typeorm entity
  synchronize: false,
  migrationsRun: false,
  logging:
    configService.get<string>('NODE_ENV') === 'production'
      ? ['error', 'warn']
      : ['error', 'warn', 'migration', 'query'],
});
