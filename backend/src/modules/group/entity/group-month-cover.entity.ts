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
import { Group } from './group.entity';
import { MediaAsset } from '@/modules/media/entity/media-asset.entity';

@Entity('group_month_covers')
@Unique(['groupId', 'year', 'month']) // 그룹은 연/월당 하나의 커버만 가짐
export class GroupMonthCover {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'group_id', type: 'uuid' })
  groupId: string;

  @ManyToOne(() => Group, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group: Group;

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
