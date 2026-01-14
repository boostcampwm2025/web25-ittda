import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  Index,
  JoinColumn,
} from 'typeorm';
import { User } from '@/modules/user/user.entity';

@Entity('media_assets')
@Index(['ownerUserId'])
export class MediaAsset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'NO ACTION' }) // CASCADE 비추
  @JoinColumn({ name: 'owner_user_id' })
  ownerUser: User;

  @Column({ name: 'owner_user_id', type: 'uuid' })
  ownerUserId: string;

  @Column({ name: 'storage_key', type: 'varchar', length: 512 })
  storageKey: string; // S3 key

  @Column({ type: 'varchar', length: 1024, nullable: true })
  url?: string; // CDN URL cache (optional)

  @Column({ name: 'mime_type', type: 'varchar', length: 100, nullable: true })
  mimeType?: string;

  @Column({ type: 'int', nullable: true })
  size?: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz' })
  deletedAt?: Date;
}
