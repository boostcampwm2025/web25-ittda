import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getTypeOrmConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get('DB_HOST'),
  port: configService.get<number>('DB_PORT') || 5432,
  username: configService.get('DB_USERNAME'),
  password: configService.get('DB_PASSWORD'),
  database: configService.get('DB_DATABASE'),
  entities: [__dirname + '/../../**/*.entity{.ts,.js}'], // typeorm entity
  migrations: [__dirname + '/../../migrations/*{.ts,.js}'], // migration production용
  synchronize: configService.get('NODE_ENV') === 'development',
  migrationsRun: configService.get('NODE_ENV') === 'production', // 프로덕션에서 자동 실행
  logging: true,
});
