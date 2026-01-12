import {
  Entity,
  Column,
  ManyToOne,
  PrimaryColumn,
  CreateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { Post } from './post.entity';
import { User } from '@/modules/user/user.entity';

export enum PostContributorRole {
  AUTHOR = 'AUTHOR',
  EDITOR = 'EDITOR',
  VIEWER = 'VIEWER',
}

@Entity('post_contributors')
@Index(['post', 'user'], { unique: true })
export class PostContributor {
  @PrimaryColumn({ name: 'post_id', type: 'uuid' })
  postId: string;

  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => Post, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @ManyToOne(() => User, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'enum', enum: PostContributorRole })
  role: PostContributorRole;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
