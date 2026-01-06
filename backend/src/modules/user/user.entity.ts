import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export type OAuthProvider = 'google' | 'kakao';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  // sql 변환 예시: "id" UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  // PostgreSQL에서 uuid_generate_v4() 함수를 사용하려면
  // PostgreSQL의 uuid-ossp 확장 프로그램이 활성화되어 있어야 합니다.
  // CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  // SQL 명령을 사용하여 활성화할 수 있습니다.

  @Column({ nullable: true }) // email은 카카오에서 optional
  email: string;

  @Column()
  nickname: string;

  @Column()
  provider: string;

  @Column()
  providerId: string;

  @CreateDateColumn()
  createdAt: Date;

  //   @DeleteDateColumn()
  //   deletedAt?: Date;

  // @DeleteDateColumn()은 소프트 삭제용으로 필요합니다.
  // deletedAt 컬럼을 만들어서 삭제된 시각을 기록합니다.
  // repository.softRemove() 또는 repository.softDelete() 같은 메서드를 호출하면 실제로 DELETE 쿼리를 날리지 않고, 이 컬럼에 현재 시간이 저장됩니다.
  // 이후 쿼리 시 기본적으로 deletedAt IS NULL인 데이터만 조회됩니다. 즉, "삭제된 것처럼" 보이지만 DB에는 남아 있는 상태가 됩니다.
}
