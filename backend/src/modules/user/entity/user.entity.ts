import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Unique,
} from 'typeorm';

import type { OAuthProvider } from '../../auth/auth.type';

// User 엔티티 정의
@Entity('users')
@Unique(['provider', 'providerId']) // 동일 플랫폼 내 중복 가입 방지
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true }) // email은 카카오에서 optional
  email: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  nickname: string;

  @Column({ type: 'varchar' })
  provider: OAuthProvider;

  @Column()
  providerId: string;

  @Column({ name: 'profile_image_url', nullable: true })
  profileImageUrl?: string;

  @Column({ type: 'jsonb', default: {} })
  settings: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}
