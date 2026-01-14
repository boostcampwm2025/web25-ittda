import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { Post } from './post.entity';
import { PostBlockType } from '@/enums/post-block-type.enum';
import { BlockValueMap } from '@/modules/post/types/post-block.types';

@Entity('post_blocks')
@Index(['post', 'layoutRow', 'layoutCol'], { unique: true }) // DEFERRABLE은 migration에서 처리
export class PostBlock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'post_id', type: 'uuid' })
  postId: string;

  @ManyToOne(() => Post, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @Column({ type: 'enum', enum: PostBlockType })
  type: PostBlockType;

  @Column({ type: 'jsonb' })
  value: BlockValueMap[PostBlockType];

  @Column({ name: 'layout_row', type: 'int' })
  layoutRow: number;

  @Column({ name: 'layout_col', type: 'int' })
  layoutCol: number;

  @Column({ name: 'layout_span', type: 'int', default: 1 })
  layoutSpan: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
