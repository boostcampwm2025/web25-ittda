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
import {
  POST_DRAFT_KIND_VALUES,
  type PostDraftKind,
} from '@/enums/post-draft-kind.enum';

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

  @Column({
    name: 'kind',
    type: 'enum',
    enum: POST_DRAFT_KIND_VALUES,
    default: POST_DRAFT_KIND_VALUES[0],
  })
  kind: PostDraftKind;

  @Column({ name: 'target_post_id', type: 'uuid', nullable: true })
  targetPostId: string | null;

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
