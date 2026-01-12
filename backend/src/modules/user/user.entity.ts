import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

import type { OAuthProvider } from '../auth/auth.type';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true }) // email은 카카오에서 optional
  email: string;

  @Column()
  nickname: string;

  @Column()
  provider: OAuthProvider;

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
