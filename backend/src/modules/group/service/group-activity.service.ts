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
        profileImageId:
          groupMember?.profileMediaId ?? actor.user?.profileImageId ?? null,
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
