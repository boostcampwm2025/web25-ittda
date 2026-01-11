import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

import type { Point } from 'typeorm';
import { User } from '@/modules/user/user.entity';
import { TemplateType } from '@/enums/template-type.enum';
import { Group } from '@/modules/group/entity/group.entity';

@Entity('posts')
@Index(['location'], { spatial: true })
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  author: User;

  @ManyToOne(() => Group, { nullable: true })
  group?: Group;

  @Column({ type: 'enum', enum: TemplateType })
  templateType: TemplateType;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({
    type: 'geometry',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  location?: Point;

  @Column({ type: 'timestamp', nullable: true })
  visitedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
