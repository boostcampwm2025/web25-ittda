import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
  Index,
  DeleteDateColumn,
} from 'typeorm';

import { Post } from './post.entity';
import { Group } from '@/modules/group/entity/group.entity';
import { User } from '@/modules/user/entity/user.entity';

@Entity('post_group_shares')
@Index(['postId', 'groupId'], {
  unique: true,
  where: '"deleted_at" IS NULL',
})
export class PostGroupShare {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'post_id', type: 'uuid' })
  postId: string;

  @Index()
  @Column({ name: 'group_id', type: 'uuid' })
  groupId: string;

  @Column({ name: 'shared_by_user_id', type: 'uuid' })
  sharedByUserId: string;

  @ManyToOne(() => Post, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @ManyToOne(() => Group, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group: Group;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shared_by_user_id' })
  sharedByUser: User;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz' })
  deletedAt?: Date | null;
}
