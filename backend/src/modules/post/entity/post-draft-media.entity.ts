import {
  Entity,
  Column,
  ManyToOne,
  PrimaryGeneratedColumn,
  Index,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { PostDraft } from './post-draft.entity';
import { MediaAsset } from '@/modules/media/entity/media-asset.entity';

@Entity('post_draft_media')
@Index(['draftId', 'mediaId'], { unique: true })
export class PostDraftMedia {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => PostDraft, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'draft_id' })
  draft: PostDraft;

  @Column({ name: 'draft_id', type: 'uuid' })
  draftId: string;

  @ManyToOne(() => MediaAsset, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'media_id' })
  media: MediaAsset;

  @Column({ name: 'media_id', type: 'uuid' })
  mediaId: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
