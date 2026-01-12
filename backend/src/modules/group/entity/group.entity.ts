import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { User } from '../../../modules/user/user.entity';

@Entity('groups')
export class Group {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_id' }) // 실제 테이블에 owner_id라는 컬럼을 만들어서 User.id를 참조하도록 함
  owner: User;

  @CreateDateColumn()
  createdAt: Date;

  //   @DeleteDateColumn()
  //   deletedAt?: Date;
}
