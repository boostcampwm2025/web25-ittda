import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository, SelectQueryBuilder, Brackets } from 'typeorm';

import { GroupActivityLog } from '../entity/group-activity-log.entity';
import { GroupActivityActor } from '../entity/group-activity-actor.entity';
import { GroupActivityType } from '@/enums/group-activity-type.enum';
import { GroupMember } from '../entity/group_member.entity';
import {
  GroupActivityActorDto,
  GroupActivityItemDto,
  PaginatedGroupActivityResponseDto,
} from '../dto/group-activity.dto';
import { NotificationService } from '@/modules/notification/notification.service';

type RecordActivityInput = {
  groupId: string;
  type: GroupActivityType;
  actorIds?: string[];
  refId?: string | null;
  meta?: Record<string, unknown> | null;
};

function buildActivityNotification(
  actorName: string,
  type: GroupActivityType,
  meta?: Record<string, unknown> | null,
): { title: string; body: string } | null {
  const postTitle = ((meta?.title ?? meta?.afterTitle ?? '') as string) || '';
  const titlePart = postTitle ? ` "${postTitle}"` : '';

  switch (type) {
    case GroupActivityType.POST_CREATE:
      return {
        title: '새 기록',
        body: `${actorName}님이 새 기록${titlePart}을(를) 작성했습니다.`,
      };
    case GroupActivityType.POST_COLLAB_COMPLETE:
    case GroupActivityType.POST_EDIT_COMPLETE:
    case GroupActivityType.POST_UPDATE:
      return {
        title: '기록 수정',
        body: `${actorName}님이${titlePart} 기록을 수정했습니다.`,
      };
    case GroupActivityType.POST_DELETE:
      return {
        title: '기록 삭제',
        body: `${actorName}님이${titlePart} 기록을 삭제했습니다.`,
      };
    case GroupActivityType.MEMBER_JOIN:
      return {
        title: '새 멤버',
        body: `${actorName}님이 그룹에 참여했습니다.`,
      };
    case GroupActivityType.MEMBER_LEAVE:
      return {
        title: '멤버 탈퇴',
        body: `${actorName}님이 그룹에서 나갔습니다.`,
      };
    case GroupActivityType.MEMBER_REMOVE:
      return {
        title: '멤버 내보내기',
        body: '그룹에서 멤버가 내보내졌습니다.',
      };
    case GroupActivityType.GROUP_NAME_UPDATE:
      return {
        title: '그룹 이름 변경',
        body: `그룹 이름이 "${(meta?.afterName as string) ?? '알 수 없음'}"(으)로 변경되었습니다.`,
      };
    default:
      return null;
  }
}

@Injectable()
export class GroupActivityService {
  private readonly logger = new Logger(GroupActivityService.name);

  constructor(
    @InjectRepository(GroupActivityLog)
    private readonly logRepo: Repository<GroupActivityLog>,
    @InjectRepository(GroupActivityActor)
    private readonly actorRepo: Repository<GroupActivityActor>,
    @InjectRepository(GroupMember)
    private readonly groupMemberRepo: Repository<GroupMember>,
    private readonly notificationService: NotificationService,
  ) {}

  async recordActivity(input: RecordActivityInput): Promise<void> {
    const actorIds = Array.from(
      new Set((input.actorIds ?? []).filter(Boolean)),
    );

    await this.logRepo.manager.transaction(async (manager) => {
      const logRepo = manager.getRepository(GroupActivityLog);
      const actorRepo = manager.getRepository(GroupActivityActor);

      const log = logRepo.create({
        groupId: input.groupId,
        type: input.type,
        refId: input.refId ?? null,
        meta: input.meta ?? null,
      });
      const saved = await logRepo.save(log);

      if (actorIds.length > 0) {
        const actors = actorIds.map((userId) =>
          actorRepo.create({
            logId: saved.id,
            userId,
          }),
        );
        await actorRepo.save(actors);
      }
    });

    void this.dispatchNotification(input, actorIds).catch((e) =>
      this.logger.warn('푸시 알림 전송 실패', e),
    );
  }

  private async dispatchNotification(
    input: RecordActivityInput,
    actorIds: string[],
  ): Promise<void> {
    const actorMembers =
      actorIds.length > 0
        ? await this.groupMemberRepo.find({
            where: { groupId: input.groupId, userId: In(actorIds) },
            relations: { user: true },
          })
        : [];

    const first = actorMembers[0];
    const baseName = first?.nicknameInGroup ?? first?.user?.nickname ?? '멤버';
    const extraCount = actorIds.length - 1;
    const actorDisplayName =
      extraCount > 0 ? `${baseName} 외 ${extraCount}명` : baseName;

    const notification = buildActivityNotification(
      actorDisplayName,
      input.type,
      input.meta,
    );
    if (!notification) return;

    const recipients = await this.groupMemberRepo.find({
      where:
        actorIds.length > 0
          ? {
              groupId: input.groupId,
              userId: Not(In(actorIds)),
              notificationMuted: false,
            }
          : { groupId: input.groupId, notificationMuted: false },
      select: ['userId'],
    });

    const recipientIds = recipients.map((m) => m.userId);
    if (recipientIds.length === 0) return;

    const hasPost = input.refId && input.type !== GroupActivityType.POST_DELETE;

    await this.notificationService.sendToUsers(
      recipientIds,
      notification.title,
      notification.body,
      {
        groupId: input.groupId,
        ...(hasPost ? { postId: input.refId as string } : {}),
      },
    );
  }

  async getGroupActivities(
    groupId: string,
    cursor?: string,
    limit: number = 20,
  ): Promise<PaginatedGroupActivityResponseDto> {
    const query = this.logRepo
      .createQueryBuilder('log')
      .where('log.groupId = :groupId', { groupId });

    this.applyCursor(query, cursor);

    query.orderBy('log.createdAt', 'DESC').addOrderBy('log.id', 'DESC');
    query.take(limit + 1);

    const logs = await query.getMany();
    const hasNextPage = logs.length > limit;
    const items = logs.slice(0, limit);

    const logIds = items.map((log) => log.id);
    const actorRows =
      logIds.length > 0
        ? await this.actorRepo.find({
            where: { logId: In(logIds) },
            order: { createdAt: 'ASC' },
            relations: { user: true },
          })
        : [];

    const actorUserIds = Array.from(
      new Set(
        actorRows.map((actor) => actor.userId).filter(Boolean) as string[],
      ),
    );
    const groupMembers =
      actorUserIds.length > 0
        ? await this.groupMemberRepo.find({
            where: { groupId, userId: In(actorUserIds) },
            select: ['userId', 'nicknameInGroup', 'profileMediaId'],
          })
        : [];

    const memberByUserId = new Map(
      groupMembers.map((member) => [
        member.userId,
        {
          nicknameInGroup: member.nicknameInGroup ?? null,
          profileMediaId: member.profileMediaId ?? null,
        },
      ]),
    );

    const actorsByLogId = new Map<string, GroupActivityActorDto[]>();
    actorRows.forEach((actor) => {
      const userId = actor.userId ?? null;
      const groupMember = userId ? memberByUserId.get(userId) : undefined;
      const dto: GroupActivityActorDto = {
        userId,
        nickname: actor.user?.nickname ?? null,
        groupNickname: groupMember?.nicknameInGroup ?? null,
        profileImageId: groupMember?.profileMediaId ?? null,
      };
      const list = actorsByLogId.get(actor.logId) ?? [];
      list.push(dto);
      actorsByLogId.set(actor.logId, list);
    });

    const resultItems: GroupActivityItemDto[] = items.map((log) => ({
      id: log.id,
      type: log.type,
      refId: log.refId ?? null,
      meta: log.meta ?? null,
      createdAt: log.createdAt,
      actors: actorsByLogId.get(log.id) ?? [],
    }));

    let nextCursor: string | undefined;
    if (hasNextPage) {
      const lastItem = items[items.length - 1];
      nextCursor = this.encodeCursor(lastItem.createdAt, lastItem.id);
    }

    return { items: resultItems, nextCursor };
  }

  private applyCursor(
    query: SelectQueryBuilder<GroupActivityLog>,
    cursor?: string,
  ) {
    if (!cursor) return;
    try {
      const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
      const [createdAtStr, id] = decoded.split('|');
      const createdAt = new Date(createdAtStr);
      query.andWhere(
        new Brackets((qb) => {
          qb.where('log.createdAt < :createdAt', { createdAt }).orWhere(
            'log.createdAt = :createdAt AND log.id < :id',
            { createdAt, id },
          );
        }),
      );
    } catch {
      // ignore invalid cursor
    }
  }

  private encodeCursor(createdAt: Date, id: string): string {
    const value = `${createdAt.toISOString()}|${id}`;
    return Buffer.from(value).toString('base64');
  }
}
