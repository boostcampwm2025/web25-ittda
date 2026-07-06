import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export type FcmPlatform = 'web' | 'android';

@Entity('fcm_tokens')
@Index(['userId', 'platform'])
export class FcmToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'token', type: 'text' })
  token: string;

  @Column({ name: 'platform', type: 'varchar', length: 10 })
  platform: FcmPlatform;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
