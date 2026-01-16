import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Group } from './group.entity';
import { GroupRoleEnum } from '@/enums/group-role.enum';

@Entity('group_invites')
export class GroupInvite {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column({ name: 'group_id', type: 'uuid' })
  groupId: string;

  @ManyToOne(() => Group, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group: Group;

  @Column({
    type: 'enum',
    enum: GroupRoleEnum,
    default: GroupRoleEnum.VIEWER,
  })
  permission: GroupRoleEnum;

  @Column()
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
