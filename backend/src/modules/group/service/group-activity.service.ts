import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository, SelectQueryBuilder, Brackets } from 'typeorm';

import { GroupActivityLog } from '../entity/group-activity-log.entity';
import { GroupActivityActor } from '../entity/group-activity-actor.entity';
import { GroupActivityType } from '@/enums/group-activity-type.enum';
import { GroupMember } from '../entity/group_member.entity';
import { Group } from '../entity/group.entity';
import {
  GroupActivityActorDto,
  GroupActivityItemDto,
  PaginatedGroupActivityResponseDto,
} from '../dto/group-activity.dto';
import { NotificationService } from '@/modules/notification/notification.service';
import { MediaService } from '@/modules/media/media.service';

type RecordActivityInput = {
  groupId: string;
  type: GroupActivityType;
  actorIds?: string[];
  refId?: string | null;
  meta?: Record<string, unknown> | null;
};

// 알림 본문 — 카카오톡 그룹 알림처럼 "발신자 이름" 줄 + "내용" 줄 2줄
// 구성(\n으로 구분). 행위자를 지목하지 않는 유형(멤버 내보내기·그룹 이름
// 변경)은 이름 줄 없이 내용 한 줄만 — 기존에도 "누가 했는지" 문구에서
// 드러내지 않던 것과 같은 이유(관리자 행위를 굳이 노출하지 않음).
function buildActivityBody(
  type: GroupActivityType,
  meta: Record<string, unknown> | null | undefined,
  actorDisplayName: string | null,
): string | null {
  const postTitle = ((meta?.title ?? meta?.afterTitle ?? '') as string) || '';
  const titlePart = postTitle ? ` "${postTitle}"` : '';
  const withName = (content: string) =>
    actorDisplayName ? `${actorDisplayName}\n${content}` : content;

  switch (type) {
    case GroupActivityType.POST_CREATE:
      return withName(`새 기록${titlePart}이 작성되었습니다.`);
    case GroupActivityType.POST_COLLAB_COMPLETE:
    case GroupActivityType.POST_EDIT_COMPLETE:
    case GroupActivityType.POST_UPDATE:
      return withName(`기록${titlePart}이 수정되었습니다.`);
    case GroupActivityType.POST_DELETE:
      return withName(`기록${titlePart}이 삭제되었습니다.`);
    case GroupActivityType.MEMBER_JOIN:
      return withName('그룹에 참여했습니다.');
    case GroupActivityType.MEMBER_LEAVE:
      return withName('그룹에서 나갔습니다.');
    case GroupActivityType.MEMBER_REMOVE:
      return '그룹에서 멤버가 내보내졌습니다.';
    case GroupActivityType.GROUP_NAME_UPDATE:
      return `그룹 이름이 "${(meta?.afterName as string) ?? '알 수 없음'}"(으)로 변경되었습니다.`;
    default:
      return null;
  }
}

// 알림에 "누구"를 드러낼지 결정하는 기준(이름 줄 + 아이콘 사진 둘 다).
// 본문에 특정 인물을 지목하던(기존에 "OO님이"가 들어가던) 유형만 행위자
// 이름·프로필을 쓰고, 그룹 차원 이벤트(멤버 내보내기·그룹 이름 변경)는
// 실행자가 있어도 — 기존 문구가 이미 그랬듯 — 누가 했는지 드러내지 않고
// 그룹 이름/사진만 쓴다.
const ACTOR_ATTRIBUTED_TYPES = new Set<GroupActivityType>([
  GroupActivityType.POST_CREATE,
  GroupActivityType.POST_COLLAB_COMPLETE,
  GroupActivityType.POST_EDIT_COMPLETE,
  GroupActivityType.POST_UPDATE,
  GroupActivityType.POST_DELETE,
  GroupActivityType.MEMBER_JOIN,
  GroupActivityType.MEMBER_LEAVE,
]);

// dispatchNotification의 조기 종료(recipients/group 조회 전 return)를 위한
// "알림을 만드는 활동 타입" 집합 — buildActivityBody의 switch와 반드시
// 같은 목록을 유지해야 한다(default: null인 나머지는 여기 없음).
const NOTIFYING_TYPES = new Set<GroupActivityType>([
  GroupActivityType.POST_CREATE,
  GroupActivityType.POST_COLLAB_COMPLETE,
  GroupActivityType.POST_EDIT_COMPLETE,
  GroupActivityType.POST_UPDATE,
  GroupActivityType.POST_DELETE,
  GroupActivityType.MEMBER_JOIN,
  GroupActivityType.MEMBER_LEAVE,
  GroupActivityType.MEMBER_REMOVE,
  GroupActivityType.GROUP_NAME_UPDATE,
]);

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
    @InjectRepository(Group)
    private readonly groupRepo: Repository<Group>,
    private readonly notificationService: NotificationService,
    private readonly mediaService: MediaService,
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
    if (!NOTIFYING_TYPES.has(input.type)) return;

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

    const group = await this.groupRepo.findOne({
      where: { id: input.groupId },
      select: ['id', 'name', 'coverMediaId'],
    });
    if (!group) return;

    // title 자리에 "그룹 이름"을 노출 — 카카오톡이 채팅방 이름을 제목으로
    // 쓰는 것과 같은 방식. 이름 줄 + 아이콘 사진 모두 이 actorMembers로
    // 결정한다.
    const actorMembers =
      actorIds.length > 0
        ? await this.groupMemberRepo.find({
            where: { groupId: input.groupId, userId: In(actorIds) },
            relations: { user: true },
          })
        : [];
    const first = actorMembers[0];
    const attributeActor = ACTOR_ATTRIBUTED_TYPES.has(input.type);

    const actorDisplayName = attributeActor
      ? (() => {
          const baseName =
            first?.nicknameInGroup ?? first?.user?.nickname ?? '멤버';
          const extraCount = actorIds.length - 1;
          return extraCount > 0 ? `${baseName} 외 ${extraCount}명` : baseName;
        })()
      : null;

    const body = buildActivityBody(input.type, input.meta, actorDisplayName);
    if (!body) return;

    const iconMediaId = attributeActor
      ? (first?.profileMediaId ?? first?.user?.profileImageId ?? null)
      : null;
    const imageUrl = await this.resolveIconUrl(
      iconMediaId ?? group.coverMediaId ?? null,
    );

    const hasPost = input.refId && input.type !== GroupActivityType.POST_DELETE;

    await this.notificationService.sendToUsers(recipientIds, group.name, body, {
      groupId: input.groupId,
      ...(hasPost ? { postId: input.refId as string } : {}),
      ...(imageUrl ? { imageUrl } : {}),
    });
  }

  // 프로필/그룹 사진을 FCM 알림 아이콘용 URL로 변환. presigned URL은
  // 발송 직후(SW가 showNotification을 호출하는 시점) 바로 쓰이므로
  // 5분 TTL로도 충분하다 — 표시 시점에 다시 fetch하지 않고 브라우저가
  // 그 시점에 한 번 렌더링해 캐시하기 때문.
  private async resolveIconUrl(mediaId: string | null): Promise<string | null> {
    if (!mediaId) return null;
    try {
      const result = await this.mediaService.resolveUrlPublic(mediaId);
      return result.ok ? result.url : null;
    } catch (e) {
      this.logger.warn(`알림 아이콘 URL 조회 실패 (mediaId=${mediaId})`, e);
      return null;
    }
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
