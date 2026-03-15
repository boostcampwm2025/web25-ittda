import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, SelectQueryBuilder, Brackets } from 'typeorm';

import { GroupActivityLog } from '../entity/group-activity-log.entity';
import { GroupActivityActor } from '../entity/group-activity-actor.entity';
import { GroupActivityType } from '@/enums/group-activity-type.enum';
import { GroupMember } from '../entity/group_member.entity';
import {
  GroupActivityActorDto,
  GroupActivityItemDto,
  PaginatedGroupActivityResponseDto,
} from '../dto/group-activity.dto';

type RecordActivityInput = {
  groupId: string;
  type: GroupActivityType;
  actorIds?: string[];
  refId?: string | null;
  meta?: Record<string, unknown> | null;
};

type GroupMemberProfile = {
  nicknameInGroup: string | null;
  profileMediaId: string | null;
};

type ActivityLogPage = {
  items: GroupActivityLog[];
  hasNextPage: boolean;
};

const DEFAULT_ACTIVITY_PAGE_LIMIT = 20;
const MAX_ACTIVITY_PAGE_LIMIT = 50;
const MIN_ACTIVITY_PAGE_LIMIT = 1;

@Injectable()
export class GroupActivityService {
  constructor(
    @InjectRepository(GroupActivityLog)
    private readonly logRepo: Repository<GroupActivityLog>,
    @InjectRepository(GroupActivityActor)
    private readonly actorRepo: Repository<GroupActivityActor>,
    @InjectRepository(GroupMember)
    private readonly groupMemberRepo: Repository<GroupMember>,
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
  }

  async getGroupActivities(
    groupId: string,
    cursor?: string,
    limit: number = DEFAULT_ACTIVITY_PAGE_LIMIT,
  ): Promise<PaginatedGroupActivityResponseDto> {
    const normalizedLimit = this.normalizeLimit(limit);
    const { items, hasNextPage } = await this.findLogPage(
      groupId,
      cursor,
      normalizedLimit,
    );
    const logIds = items.map((log) => log.id);
    const actorRows = await this.findActorsByLogIds(logIds);
    const memberByUserId = await this.findGroupMemberProfiles(
      groupId,
      actorRows,
    );
    const actorsByLogId = this.buildActorsByLogId(actorRows, memberByUserId);
    const resultItems = this.toActivityItems(items, actorsByLogId);
    const nextCursor = this.buildNextCursor(items, hasNextPage);

    return { items: resultItems, nextCursor };
  }

  /**
   * 그룹 활동 로그를 커서 기반으로 조회하고, 다음 페이지 존재 여부를 함께 반환한다.
   * @param groupId 조회 대상 그룹 ID
   * @param cursor 이전 페이지의 마지막 아이템을 가리키는 커서
   * @param limit 페이지 크기
   * @returns 현재 페이지 아이템과 다음 페이지 존재 여부
   */
  private async findLogPage(
    groupId: string,
    cursor: string | undefined,
    limit: number,
  ): Promise<ActivityLogPage> {
    const query = this.logRepo
      .createQueryBuilder('log')
      .where('log.groupId = :groupId', { groupId });

    this.applyCursor(query, cursor);
    query.orderBy('log.createdAt', 'DESC').addOrderBy('log.id', 'DESC');
    query.take(limit + 1);

    const logs = await query.getMany();
    return {
      hasNextPage: logs.length > limit,
      items: logs.slice(0, limit),
    };
  }

  /**
   * 주어진 로그 ID 목록에 연결된 actor와 사용자 최소 프로필 정보를 조회한다.
   * @param logIds actor를 조회할 로그 ID 목록
   * @returns 로그 ID에 연결된 actor 행 목록
   */
  private async findActorsByLogIds(
    logIds: string[],
  ): Promise<GroupActivityActor[]> {
    if (logIds.length === 0) return [];

    return this.actorRepo.find({
      where: { logId: In(logIds) },
      select: {
        id: true,
        logId: true,
        userId: true,
        createdAt: true,
        user: {
          id: true,
          nickname: true,
          profileImageId: true,
        },
      },
      relations: { user: true },
    });
  }

  /**
   * actor 목록의 userId를 기준으로 그룹 내 닉네임/프로필 정보를 맵으로 구성한다.
   * @param groupId 그룹 멤버 프로필을 조회할 그룹 ID
   * @param actorRows actor 조회 결과
   * @returns key=userId, value=그룹 내 닉네임/프로필 정보 맵
   */
  private async findGroupMemberProfiles(
    groupId: string,
    actorRows: GroupActivityActor[],
  ): Promise<Map<string, GroupMemberProfile>> {
    const actorUserIds = Array.from(
      new Set(
        actorRows.map((actor) => actor.userId).filter(Boolean) as string[],
      ),
    );
    if (actorUserIds.length === 0) return new Map();

    const groupMembers = await this.groupMemberRepo.find({
      where: { groupId, userId: In(actorUserIds) },
      select: ['userId', 'nicknameInGroup', 'profileMediaId'],
    });

    return new Map(
      groupMembers.map((member) => [
        member.userId,
        {
          nicknameInGroup: member.nicknameInGroup ?? null,
          profileMediaId: member.profileMediaId ?? null,
        },
      ]),
    );
  }

  /**
   * actor 행을 로그 ID별 DTO 배열로 묶고 그룹 프로필 정보를 병합한다.
   * @param actorRows actor 조회 결과
   * @param memberByUserId 그룹 멤버 프로필 맵
   * @returns key=logId, value=해당 로그의 actor DTO 배열
   */
  private buildActorsByLogId(
    actorRows: GroupActivityActor[],
    memberByUserId: Map<string, GroupMemberProfile>,
  ): Map<string, GroupActivityActorDto[]> {
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
    return actorsByLogId;
  }

  /**
   * 로그 엔티티 목록을 API 응답 아이템 형태로 변환한다.
   * @param logs 페이지에 포함된 그룹 활동 로그
   * @param actorsByLogId 로그별 actor DTO 맵
   * @returns API 응답용 활동 아이템 배열
   */
  private toActivityItems(
    logs: GroupActivityLog[],
    actorsByLogId: Map<string, GroupActivityActorDto[]>,
  ): GroupActivityItemDto[] {
    // TODO: If UI caps displayed actors (e.g. first 3), cap actor payload here too.
    return logs.map((log) => ({
      id: log.id,
      type: log.type,
      refId: log.refId ?? null,
      meta: log.meta ?? null,
      createdAt: log.createdAt,
      actors: actorsByLogId.get(log.id) ?? [],
    }));
  }

  /**
   * 다음 페이지가 있을 때 마지막 아이템 기준 커서를 생성한다.
   * @param items 현재 페이지 로그 아이템
   * @param hasNextPage 다음 페이지 존재 여부
   * @returns 다음 페이지 커서(없으면 undefined)
   */
  private buildNextCursor(
    items: GroupActivityLog[],
    hasNextPage: boolean,
  ): string | undefined {
    if (!hasNextPage) return undefined;
    const lastItem = items[items.length - 1];
    return this.encodeCursor(lastItem.createdAt, lastItem.id);
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

  private normalizeLimit(limit: number): number {
    if (!Number.isFinite(limit)) return DEFAULT_ACTIVITY_PAGE_LIMIT;

    const integerLimit = Math.trunc(limit);
    if (integerLimit < MIN_ACTIVITY_PAGE_LIMIT) {
      return MIN_ACTIVITY_PAGE_LIMIT;
    }
    return Math.min(integerLimit, MAX_ACTIVITY_PAGE_LIMIT);
  }
}
