import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { MediaAsset } from '@/modules/media/entity/media-asset.entity';

@Entity('user_month_covers')
@Unique(['userId', 'year', 'month']) // 유저는 연/월당 하나의 커버만 가짐
export class UserMonthCover {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'int' })
  year: number;

  @Column({ type: 'int' })
  month: number;

  @ManyToOne(() => MediaAsset, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'cover_media_asset_id' })
  coverAsset: MediaAsset;

  @Column({ name: 'cover_media_asset_id', type: 'uuid', nullable: true })
  coverAssetId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
