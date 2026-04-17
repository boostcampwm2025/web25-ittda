import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import type { OAuthProvider } from '../../auth/auth.type';
import { MediaAsset } from '@/modules/media/entity/media-asset.entity';

// User 엔티티 정의
@Entity('users')
@Index('IDX_users_provider_provider_id_active', ['provider', 'providerId'], {
  unique: true,
  where: '"deleted_at" IS NULL',
})
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'email', nullable: true }) // email은 카카오에서 optional
  email: string;

  @Column({ name: 'nickname', type: 'varchar', length: 50, nullable: true })
  nickname: string;

  @Column({ name: 'provider', type: 'varchar' })
  provider: OAuthProvider;

  @Column({ name: 'provider_id' })
  providerId: string;

  @Column({ name: 'profile_image_id', type: 'uuid', nullable: true })
  profileImageId?: string | null;

  @ManyToOne(() => MediaAsset, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'profile_image_id' })
  profileImage?: MediaAsset | null;

  @Column({ name: 'settings', type: 'jsonb', default: {} })
  settings: Record<string, any>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}
