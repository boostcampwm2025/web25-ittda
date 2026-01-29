import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TemplateScope } from '@/enums/template-scope.enum';
import { User } from '@/modules/user/entity/user.entity';
import { Group } from '@/modules/group/entity/group.entity';

@Entity('templates')
export class Template {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'enum', enum: TemplateScope })
  @Index()
  scope: TemplateScope;

  @Column({ name: 'owner_user_id', type: 'uuid', nullable: true })
  @Index()
  ownerUserId?: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_user_id' })
  ownerUser?: User | null;

  @Column({ name: 'group_id', type: 'uuid', nullable: true })
  @Index()
  groupId?: string | null;

  @ManyToOne(() => Group, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group?: Group | null;

  @Column({ type: 'jsonb' })
  blocks: any[]; // { type: 'date', layout: { row: 1, col: 1, span: 2 } } []

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt?: Date | null;
}
