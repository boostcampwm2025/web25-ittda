import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  OneToMany,
  Index,
  JoinColumn,
} from 'typeorm';
import { Group } from './group.entity';
import { GroupActivityType } from '@/enums/group-activity-type.enum';
import { GroupActivityActor } from './group-activity-actor.entity';

@Entity('group_activity_logs')
@Index(['groupId', 'createdAt', 'id'])
export class GroupActivityLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'group_id', type: 'uuid' })
  groupId: string;

  @ManyToOne(() => Group, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group: Group;

  @Column({ type: 'enum', enum: GroupActivityType })
  type: GroupActivityType;

  @Column({ name: 'ref_id', type: 'uuid', nullable: true })
  refId?: string | null;

  @Column({ type: 'jsonb', nullable: true })
  meta?: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @OneToMany(() => GroupActivityActor, (actor) => actor.log, {
    cascade: true,
  })
  actors?: GroupActivityActor[];
}
