import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  UpdateDateColumn,
  DeleteDateColumn,
  JoinColumn,
} from 'typeorm';

import type { Point } from 'geojson';
import { User } from '@/modules/user/user.entity';
import { Group } from '@/modules/group/entity/group.entity';
import { PostScope } from '@/enums/post-scope.enum';
import { PostMood } from '@/enums/post-mood.enum';

@Entity('posts')
@Index('IDX_posts_location_gist', ['location'], { spatial: true })
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: PostScope })
  scope: PostScope;

  @Index()
  @Column({ name: 'owner_user_id' })
  ownerUserId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_user_id' })
  ownerUser: User;

  @Index()
  @Column({ name: 'group_id', type: 'uuid', nullable: true })
  groupId?: string | null;

  @ManyToOne(() => Group, { nullable: true })
  @JoinColumn({ name: 'group_id' })
  group?: Group | null;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({
    type: 'geometry',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  location?: Point;

  @Column({ type: 'text', array: true, nullable: true })
  tags?: string[] | null;

  @Column({ type: 'varchar', length: 5, array: true, nullable: true })
  emotion?: PostMood[] | null;

  @Column({ type: 'real', nullable: true })
  rating?: number | null;

  @Index()
  @Column({ name: 'event_at', type: 'timestamptz', nullable: true })
  eventAt?: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz' })
  deletedAt?: Date | null;
}
