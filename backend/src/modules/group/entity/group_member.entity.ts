import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Unique,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';

import { User } from '../../../modules/user/user.entity';
import { Group } from './group.entity';

import { GroupRoleEnum } from '@/enums/group-role.enum';

@Entity('group_members')
@Unique(['group', 'user']) // 중복 가입 방지
export class GroupMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Group, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group: Group;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: GroupRoleEnum,
  })
  role: GroupRoleEnum; // 권한 변경은 row update로 해결

  @CreateDateColumn()
  joinedAt: Date;
}
// Guard에서 groupId + userId로 조회 가능
