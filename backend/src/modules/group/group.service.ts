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
        userId, // 객체 대신 문자열 ID 직접 사용
        groupId,
      },
      relations: ['group', 'user'],
    });
  }

  /** 멤버 초대 (ADMIN만 가능하도록 Controller/Guard에서 제한) */
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

  /** 권한 변경 (본인 권한 변경 불가 로직 추가) */
  async updateMemberRole(
    requesterId: string, // 요청자 ID 추가
    groupId: string,
    userId: string,
    role: GroupRoleEnum,
  ) {
    // 1. 본인 여부 확인
    if (requesterId === userId) {
      throw new BadRequestException('자신의 권한은 직접 수정할 수 없습니다.');
    }

    try {
      const member = await this.groupMemberRepo.findOneOrFail({
        where: {
          group: { id: groupId },
          user: { id: userId },
        },
      });

      // 2. 관리자 권한 유지 로직 (선택 사항: 그룹에 관리자가 최소 한 명은 있어야 함)
      // 만약 마지막 남은 ADMIN이 자신의 권한을 낮추는 것을 방지해야 한다면 추가 검증이 필요합니다.

      member.role = role;
      return await this.groupMemberRepo.save(member);
    } catch (error) {
      if (error instanceof BadRequestException) throw error;

      throw new InternalServerErrorException(
        '권한 변경 중 오류가 발생했습니다.',
      );
    }
  }

  /** 그룹 삭제 (방장만 가능) */
  async deleteGroup(userId: string, groupId: string): Promise<void> {
    const group = await this.groupRepo.findOne({
      where: { id: groupId },
      relations: ['owner'],
    });

    if (!group) {
      throw new BadRequestException('존재하지 않는 그룹입니다.');
    }

    // 방장인지 확인
    if (group.owner.id !== userId) {
      throw new BadRequestException('그룹을 삭제할 권한이 없습니다.');
    }

    // 그룹 삭제 (Cascade 설정으로 멤버들도 자동 삭제됨)
    await this.groupRepo.remove(group);
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
