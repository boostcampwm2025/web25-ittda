import {
  Entity,
  Column,
  ManyToOne,
  PrimaryGeneratedColumn,
  Index,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Post } from './post.entity';
import { PostBlock } from './post-block.entity';
import { MediaAsset } from '@/modules/media/entity/media-asset.entity';

export enum PostMediaKind {
  THUMBNAIL = 'THUMBNAIL',
  BLOCK = 'BLOCK',
}

@Entity('post_media')
@Index(['post', 'kind'])
@Index(['block', 'sortOrder'])
export class PostMedia {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Post, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @Column({ name: 'post_id', type: 'uuid' })
  postId: string;

  @Column({ name: 'media_id', type: 'uuid' })
  mediaId: string;

  @ManyToOne(() => MediaAsset, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'media_id' })
  media: MediaAsset;

  @Column({ type: 'enum', enum: PostMediaKind })
  kind: PostMediaKind;

  @ManyToOne(() => PostBlock, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'block_id' })
  block?: PostBlock;

  @Column({ name: 'block_id', type: 'uuid', nullable: true })
  blockId?: string;

  @Column({ name: 'sort_order', type: 'int', nullable: true })
  sortOrder?: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
