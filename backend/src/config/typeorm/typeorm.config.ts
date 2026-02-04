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
  synchronize: false,
  migrationsRun: false,
  logging:
    configService.get<string>('NODE_ENV') === 'production'
      ? ['error', 'warn']
      : ['error', 'warn', 'migration', 'info', 'log'],
  // cache: { // typeorm QueryBuilder.cache() 결과를 redis에 캐싱
  //   type: 'redis',
  //   options: {
  //     host: process.env.REDIS_HOST || 'localhost',
  //     port: 6379,
  //   },
  //   duration: 10000, // 10초 (ms 단위)
  // }, // cache 옵션을 넣지 않으면 QueryBuilder.cache() 호출 시 에러가 납니다.
});
