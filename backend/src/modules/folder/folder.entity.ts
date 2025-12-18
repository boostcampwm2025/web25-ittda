import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';

import { TemplateType } from '@/enums/template-type.enum';
import { User } from '@/modules/user/user.entity';
import { Group } from '@/modules/group/entity/group.entity';

@Entity('folders')
export class Folder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: TemplateType })
  templateType: TemplateType;

  @Column({ default: false })
  isDefault: boolean;

  @ManyToOne(() => User, { nullable: true })
  owner?: User;

  @ManyToOne(() => Group, { nullable: true })
  group?: Group;

  @CreateDateColumn()
  createdAt: Date;

  //   @DeleteDateColumn()
  //   deletedAt?: Date;
}
