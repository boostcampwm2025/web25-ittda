// import { Injectable } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';

// import { Group } from './entity/group.entity';
// import { GroupMember } from './entity/group_member.entity';
// import { GroupRole } from '@/enums/group-role.enum';
// import { User } from '../user/user.entity';

// @Injectable()
// export class GroupService {
//   constructor(
//     @InjectRepository(Group)
//     private readonly groupRepo: Repository<Group>,

//     @InjectRepository(GroupMember)
//     private readonly groupMemberRepo: Repository<GroupMember>,
//   ) {}

//   /** 그룹 생성 + OWNER 등록 */
//   async createGroup(owner: User, name: string): Promise<Group> {
//     const group = this.groupRepo.create({
//       name,
//       owner,
//     });

//     await this.groupRepo.save(group);

//     const ownerMember = this.groupMemberRepo.create({
//       group,
//       user: owner,
//       role: 'OWNER',
//     });

//     await this.groupMemberRepo.save(ownerMember);

//     return group;
//   }

//   /** 그룹 멤버 조회 (Guard 핵심) */
//   async findMember(
//     userId: string,
//     groupId: string,
//   ): Promise<GroupMember | null> {
//     return this.groupMemberRepo.findOne({
//       where: {
//         user: { id: userId },
//         group: { id: groupId },
//       },
//       relations: ['group', 'user'],
//     });
//   }

//   /** 멤버 초대 (OWNER만 가능하도록 Controller/Guard에서 제한) */
//   async addMember(
//     groupId: string,
//     user: User,
//     role: GroupRole,
//   ): Promise<GroupMember> {
//     const group = await this.groupRepo.findOneByOrFail({ id: groupId });

//     const member = this.groupMemberRepo.create({
//       group,
//       user,
//       role,
//     });

//     return this.groupMemberRepo.save(member);
//   }

//   /** 권한 변경 */
//   async updateMemberRole(groupId: string, userId: string, role: GroupRole) {
//     const member = await this.groupMemberRepo.findOneOrFail({
//       where: {
//         group: { id: groupId },
//         user: { id: userId },
//       },
//     });

//     member.role = role;
//     return this.groupMemberRepo.save(member);
//   }
// }
