import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Group } from '@/modules/group/entity/group.entity';

@Entity('post_drafts')
export class PostDraft {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'group_id', type: 'uuid' })
  groupId: string;

  @ManyToOne(() => Group, { onDelete: 'CASCADE', onUpdate: 'NO ACTION' })
  @JoinColumn({ name: 'group_id' })
  group: Group;

  @Column({ name: 'owner_actor_id', type: 'uuid' })
  ownerActorId: string;

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  snapshot: Record<string, unknown>;

  @Column({ type: 'int', default: 0 })
  version: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
