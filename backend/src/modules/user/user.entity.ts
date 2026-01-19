import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import type { OAuthProvider } from '../auth/auth.type';
import { MediaAsset } from '@/modules/media/entity/media-asset.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true }) // email은 카카오에서 optional
  email: string;

  @Column()
  nickname: string;

  @Column({ type: 'varchar' })
  provider: OAuthProvider;

  @Column()
  providerId: string;

  @Column({ name: 'profile_image_id', type: 'uuid', nullable: true })
  profileImageId?: string | null;

  @ManyToOne(() => MediaAsset, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'profile_image_id' })
  profileImage?: MediaAsset | null;

  @Column({ type: 'jsonb', default: {} })
  settings: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}
