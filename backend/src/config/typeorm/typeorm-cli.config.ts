import { DataSource } from 'typeorm';
import { config } from 'dotenv';

// .env 파일 로드
config();
// migration CLI용 TypeORM 설정
export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../../migrations/*{.ts,.js}'],
  synchronize: false, // CLI에서는 항상 false
  logging: true,
});
