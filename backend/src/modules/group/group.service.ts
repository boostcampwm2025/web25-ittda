import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

import { Group } from './entity/group.entity';
import { GroupMember } from './entity/group_member.entity';
import { GroupRoleEnum } from '@/enums/group-role.enum';
import { User } from '../user/user.entity';

@Injectable()
export class GroupService {
  constructor(
    @InjectRepository(Group)
    private readonly groupRepo: Repository<Group>,

    @InjectRepository(GroupMember)
    private readonly groupMemberRepo: Repository<GroupMember>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    private readonly dataSource: DataSource,
  ) {}

  /** 그룹 생성 + ADMIN 등록 (트랜잭션 적용) */
  async createGroup(ownerId: string, name: string): Promise<Group> {
    // 1. 트랜잭션 시작
    return await this.dataSource.transaction(async (manager) => {
      try {
        // 2. 그룹 엔티티 생성 및 저장 (manager 사용 필수)
        const group = manager.create(Group, {
          name,
          owner: { id: ownerId } as User, // ID만 가진 객체로 캐스팅,
        });
        const savedGroup = await manager.save(group);

        // 3. 방장을 멤버 테이블에 ADMIN로 등록 (manager 사용 필수)
        const ownerMember = manager.create(GroupMember, {
          group: savedGroup,
          user: { id: ownerId } as User,
          role: GroupRoleEnum.ADMIN,
        });
        await manager.save(ownerMember);

        // 모든 과정이 성공하면 자동 Commit
        return savedGroup;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        // 에러 발생 시 자동 Rollback
        throw new InternalServerErrorException(
          '그룹 생성 중 오류가 발생했습니다.',
        );
      }
    });
  }

  /** 그룹 멤버 조회 (Guard 핵심) */
  async findMember(
    userId: string,
    groupId: string,
  ): Promise<GroupMember | null> {
    return this.groupMemberRepo.findOne({
      where: {
        user: { id: userId },
        group: { id: groupId },
      },
      relations: ['group', 'user'],
    });
  }

  /** 멤버 초대 (ADMIN/EDITOR만 가능하도록 Controller/Guard에서 제한) */
  async addMember(
    groupId: string,
    userId: string,
    role: GroupRoleEnum,
  ): Promise<GroupMember> {
    try {
      const group = await this.groupRepo.findOneByOrFail({ id: groupId });

      const user = await this.userRepo.findOneByOrFail({ id: userId });

      const member = this.groupMemberRepo.create({
        group,
        user,
        role,
      });

      return this.groupMemberRepo.save(member);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new BadRequestException('중복된 멤버이거나 잘못된 요청입니다.');
    }
  }

  /** 권한 변경 */
  async updateMemberRole(groupId: string, userId: string, role: GroupRoleEnum) {
    try {
      const member = await this.groupMemberRepo.findOneOrFail({
        where: {
          group: { id: groupId },
          user: { id: userId },
        },
      });

      if (!member) {
        throw new BadRequestException('멤버를 찾을 수 없습니다.');
      }

      member.role = role;
      return this.groupMemberRepo.save(member);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new InternalServerErrorException(
        '권한 변경 중 오류가 발생했습니다.',
      );
    }
  }
}

/*
 const owner = await manager.findOneOrFail(User, {
    where: { id: ownerId },
}); // 이런 실제 owner 엔티티를 사용하지 않는 이유

TypeORM은 엔티티 객체를 저장할 때, 
관계가 맺어진 객체(owner) 전체를 검사하는 것이 아니라 
그 객체의 Primary Key 속성만 확인하여 외래 키를 할당합니다. 
따라서 { id: ownerId }와 같이 ID값만 포함된 가짜(Partial) 객체를 넘겨도
DB에는 정확한 owner_id가 저장됩니다.
*/
