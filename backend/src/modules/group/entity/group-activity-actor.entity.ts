import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { GroupActivityLog } from './group-activity-log.entity';
import { User } from '@/modules/user/entity/user.entity';

@Entity('group_activity_log_actors')
@Index(['logId', 'userId'], { unique: true })
@Index(['logId'])
@Index(['userId'])
export class GroupActivityActor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'log_id', type: 'uuid' })
  logId: string;

  @ManyToOne(() => GroupActivityLog, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'log_id' })
  log: GroupActivityLog;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId?: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: User | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
