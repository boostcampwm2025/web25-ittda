import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';

import { Post } from './post.entity';

@Entity('trash')
export class Trash {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Post, { onDelete: 'CASCADE' })
  @JoinColumn()
  post: Post;

  @Column({ type: 'timestamp' })
  expiredAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
