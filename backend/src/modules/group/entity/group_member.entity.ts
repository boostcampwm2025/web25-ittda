import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Unique,
  CreateDateColumn,
  JoinColumn,
  Index,
} from 'typeorm';

import { User } from '../../user/entity/user.entity';
import { Group } from './group.entity';
import { MediaAsset } from '@/modules/media/entity/media-asset.entity';

import { GroupRoleEnum } from '@/enums/group-role.enum';

@Entity('group_members')
@Unique(['groupId', 'userId']) // 외래 키 필드명을 직접 지정
@Index(['userId', 'joinedAt']) // 유저별 그룹 목록 조회 최적화
export class GroupMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 1. 명시적 외래 키 ID 컬럼 (성능 최적화용)
  @Index()
  @Column({ name: 'group_id', type: 'uuid' })
  groupId: string;

  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  // 2. 관계 정의 (Relation mapping)
  @ManyToOne(() => Group, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' }) // 위에서 정의한 group_id와 매핑
  group: Group;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' }) // 위에서 정의한 user_id와 매핑
  user: User;

  @Column({
    type: 'enum',
    enum: GroupRoleEnum,
  })
  role: GroupRoleEnum;

  @Column({
    name: 'nickname_in_group',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  nicknameInGroup?: string | null;

  @Column({ name: 'profile_media_id', type: 'uuid', nullable: true })
  profileMediaId?: string | null;

  @ManyToOne(() => MediaAsset, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'profile_media_id' })
  profileMedia?: MediaAsset | null;

  @Column({ name: 'last_read_at', type: 'timestamptz', nullable: true })
  lastReadAt?: Date | null;

  @CreateDateColumn({ name: 'joined_at', type: 'timestamptz' })
  joinedAt: Date;
}
