import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { User } from '../../../modules/user/user.entity';
import { MediaAsset } from '@/modules/media/entity/media-asset.entity';
import { Post } from '@/modules/post/entity/post.entity';

@Entity('groups')
export class Group {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'name' })
  name: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_id' }) // 실제 테이블에 owner_id라는 컬럼을 만들어서 User.id를 참조하도록 함
  owner: User;

  @Column({ name: 'cover_media_id', type: 'uuid', nullable: true })
  coverMediaId?: string | null;

  @ManyToOne(() => MediaAsset, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'cover_media_id' })
  coverMedia?: MediaAsset | null;

  @Column({ name: 'cover_source_post_id', type: 'uuid', nullable: true })
  coverSourcePostId?: string | null;

  @ManyToOne(() => Post, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'cover_source_post_id' })
  coverSourcePost?: Post | null;

  @Column({ name: 'last_activity_at', type: 'timestamptz', nullable: true })
  lastActivityAt?: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  //   @DeleteDateColumn()
  //   deletedAt?: Date;
}
