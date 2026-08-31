import type { Repository } from 'typeorm';
import { GroupActivityService } from './group-activity.service';
import { GroupActivityLog } from '../entity/group-activity-log.entity';
import { GroupActivityActor } from '../entity/group-activity-actor.entity';
import { GroupMember } from '../entity/group_member.entity';
import { Group } from '../entity/group.entity';
import { GroupActivityType } from '@/enums/group-activity-type.enum';
import { NotificationService } from '@/modules/notification/notification.service';
import { MediaService } from '@/modules/media/media.service';

function emptyFindRepo() {
  return { find: jest.fn().mockResolvedValue([]) };
}

describe('GroupActivityService.dispatchNotification', () => {
  let groupMemberRepo: { find: jest.Mock };
  let groupRepo: { findOne: jest.Mock };
  let notificationService: { sendToUsers: jest.Mock };
  let mediaService: { resolveUrlPublic: jest.Mock };
  let service: GroupActivityService;

  type DispatchInput = {
    groupId: string;
    type: GroupActivityType;
    refId?: string | null;
    meta?: Record<string, unknown> | null;
  };

  // dispatchNotification은 private + recordActivity에서 fire-and-forget으로
  // 호출된다. 트랜잭션/로그 저장까지 왕복하지 않고 알림 빌드 로직 자체를
  // 직접 검증하기 위해 private 메서드를 그대로 호출한다.
  const callDispatch = (input: DispatchInput, actorIds: string[]) =>
    (
      service as unknown as {
        dispatchNotification: (
          input: DispatchInput,
          actorIds: string[],
        ) => Promise<void>;
      }
    ).dispatchNotification(input, actorIds);

  beforeEach(() => {
    groupMemberRepo = { find: jest.fn().mockResolvedValue([]) };
    groupRepo = { findOne: jest.fn() };
    notificationService = {
      sendToUsers: jest.fn().mockResolvedValue(undefined),
    };
    mediaService = { resolveUrlPublic: jest.fn() };

    service = new GroupActivityService(
      emptyFindRepo() as unknown as Repository<GroupActivityLog>,
      emptyFindRepo() as unknown as Repository<GroupActivityActor>,
      groupMemberRepo as unknown as Repository<GroupMember>,
      groupRepo as unknown as Repository<Group>,
      notificationService as unknown as NotificationService,
      mediaService as unknown as MediaService,
    );
  });

  it('알림을 만들지 않는 활동 타입은 그룹/수신자 조회 없이 아무것도 보내지 않는다', async () => {
    await callDispatch(
      { groupId: 'group-1', type: GroupActivityType.MEMBER_ROLE_CHANGE },
      ['actor-1'],
    );

    expect(groupMemberRepo.find).not.toHaveBeenCalled();
    expect(notificationService.sendToUsers).not.toHaveBeenCalled();
  });

  it('알림 받을 멤버가 없으면 그룹 조회 없이 발송하지 않는다', async () => {
    groupMemberRepo.find.mockResolvedValueOnce([]); // recipients

    await callDispatch(
      { groupId: 'group-1', type: GroupActivityType.POST_CREATE },
      ['actor-1'],
    );

    expect(groupRepo.findOne).not.toHaveBeenCalled();
    expect(notificationService.sendToUsers).not.toHaveBeenCalled();
  });

  it('title은 그룹 이름, body는 카카오톡처럼 "작성자 이름\\n내용" 2줄로 구성된다 (POST_CREATE)', async () => {
    groupMemberRepo.find
      .mockResolvedValueOnce([{ userId: 'recipient-1' }]) // recipients
      .mockResolvedValueOnce([
        {
          userId: 'actor-1',
          nicknameInGroup: '작성자',
          profileMediaId: 'actor-photo',
          user: { profileImageId: null },
        },
      ]); // actorMembers
    groupRepo.findOne.mockResolvedValue({
      id: 'group-1',
      name: '이다 프론트',
      coverMediaId: 'group-cover',
    });
    mediaService.resolveUrlPublic.mockResolvedValue({
      ok: true,
      url: 'https://example.com/actor-photo.png',
    });

    await callDispatch(
      {
        groupId: 'group-1',
        type: GroupActivityType.POST_CREATE,
        refId: 'post-1',
        meta: { title: '제목' },
      },
      ['actor-1'],
    );

    expect(notificationService.sendToUsers).toHaveBeenCalledWith(
      ['recipient-1'],
      '이다 프론트',
      '작성자\n새 기록 "제목"이 작성되었습니다.',
      {
        groupId: 'group-1',
        postId: 'post-1',
        imageUrl: 'https://example.com/actor-photo.png',
      },
    );
    // 행위자가 있는 유형이므로 그룹 커버가 아니라 행위자 프로필을 조회해야 한다.
    expect(mediaService.resolveUrlPublic).toHaveBeenCalledWith('actor-photo');
  });

  it('행위자가 2명 이상이면 이름 줄에 "OO 외 N명"으로 표시한다', async () => {
    groupMemberRepo.find
      .mockResolvedValueOnce([{ userId: 'recipient-1' }])
      .mockResolvedValueOnce([
        { userId: 'actor-1', nicknameInGroup: '작성자', user: {} },
        { userId: 'actor-2', nicknameInGroup: '다른작성자', user: {} },
      ]);
    groupRepo.findOne.mockResolvedValue({
      id: 'group-1',
      name: '이다 프론트',
      coverMediaId: null,
    });

    await callDispatch(
      { groupId: 'group-1', type: GroupActivityType.MEMBER_JOIN },
      ['actor-1', 'actor-2'],
    );

    expect(notificationService.sendToUsers).toHaveBeenCalledWith(
      ['recipient-1'],
      '이다 프론트',
      '작성자 외 1명\n그룹에 참여했습니다.',
      { groupId: 'group-1' },
    );
  });

  it('행위자가 있어도 MEMBER_REMOVE/GROUP_NAME_UPDATE는 그룹 사진을 아이콘으로 쓴다', async () => {
    groupMemberRepo.find
      .mockResolvedValueOnce([{ userId: 'recipient-1' }])
      .mockResolvedValueOnce([
        { userId: 'admin-1', profileMediaId: 'admin-photo', user: {} },
      ]);
    groupRepo.findOne.mockResolvedValue({
      id: 'group-1',
      name: '이다 프론트',
      coverMediaId: 'group-cover',
    });
    mediaService.resolveUrlPublic.mockResolvedValue({
      ok: true,
      url: 'https://example.com/group-cover.png',
    });

    await callDispatch(
      {
        groupId: 'group-1',
        type: GroupActivityType.MEMBER_REMOVE,
        meta: { targetUserId: 'removed-1' },
      },
      ['admin-1'],
    );

    // 관리자(admin-1)의 사진이 아니라 그룹 커버(group-cover)를 조회해야 한다 —
    // 본문에도 관리자 이름이 안 드러나는 것과 같은 이유.
    expect(mediaService.resolveUrlPublic).toHaveBeenCalledWith('group-cover');
    expect(notificationService.sendToUsers).toHaveBeenCalledWith(
      ['recipient-1'],
      '이다 프론트',
      '그룹에서 멤버가 내보내졌습니다.',
      { groupId: 'group-1', imageUrl: 'https://example.com/group-cover.png' },
    );
  });

  it('행위자에게 프로필 사진이 없으면 그룹 사진으로 폴백한다', async () => {
    groupMemberRepo.find
      .mockResolvedValueOnce([{ userId: 'recipient-1' }])
      .mockResolvedValueOnce([
        {
          userId: 'actor-1',
          profileMediaId: null,
          user: { profileImageId: null },
        },
      ]);
    groupRepo.findOne.mockResolvedValue({
      id: 'group-1',
      name: '이다 프론트',
      coverMediaId: 'group-cover',
    });
    mediaService.resolveUrlPublic.mockResolvedValue({
      ok: true,
      url: 'https://x/y.png',
    });

    await callDispatch(
      { groupId: 'group-1', type: GroupActivityType.MEMBER_JOIN },
      ['actor-1'],
    );

    expect(mediaService.resolveUrlPublic).toHaveBeenCalledWith('group-cover');
  });

  it('그룹에 커버도 행위자 사진도 없으면 imageUrl 없이 발송한다(이름 줄은 유지)', async () => {
    groupMemberRepo.find
      .mockResolvedValueOnce([{ userId: 'recipient-1' }])
      .mockResolvedValueOnce([
        {
          userId: 'actor-1',
          nicknameInGroup: '탈퇴자',
          profileMediaId: null,
          user: { profileImageId: null },
        },
      ]);
    groupRepo.findOne.mockResolvedValue({
      id: 'group-1',
      name: '이다 프론트',
      coverMediaId: null,
    });

    await callDispatch(
      { groupId: 'group-1', type: GroupActivityType.MEMBER_LEAVE },
      ['actor-1'],
    );

    expect(mediaService.resolveUrlPublic).not.toHaveBeenCalled();
    expect(notificationService.sendToUsers).toHaveBeenCalledWith(
      ['recipient-1'],
      '이다 프론트',
      '탈퇴자\n그룹에서 나갔습니다.',
      { groupId: 'group-1' },
    );
  });

  it('미디어 URL 조회가 실패해도 발송 자체는 imageUrl 없이 계속된다', async () => {
    groupMemberRepo.find
      .mockResolvedValueOnce([{ userId: 'recipient-1' }])
      .mockResolvedValueOnce([
        {
          userId: 'actor-1',
          nicknameInGroup: '삭제자',
          profileMediaId: 'actor-photo',
          user: {},
        },
      ]);
    groupRepo.findOne.mockResolvedValue({
      id: 'group-1',
      name: '이다 프론트',
      coverMediaId: 'group-cover',
    });
    mediaService.resolveUrlPublic.mockRejectedValue(new Error('s3 down'));

    await callDispatch(
      {
        groupId: 'group-1',
        type: GroupActivityType.POST_DELETE,
        refId: 'post-1',
      },
      ['actor-1'],
    );

    expect(notificationService.sendToUsers).toHaveBeenCalledWith(
      ['recipient-1'],
      '이다 프론트',
      '삭제자\n기록이 삭제되었습니다.',
      { groupId: 'group-1' },
    );
  });

  it('행위자를 지목하지 않는 유형(MEMBER_REMOVE)은 이름 줄 없이 내용 한 줄만 보낸다', async () => {
    groupMemberRepo.find
      .mockResolvedValueOnce([{ userId: 'recipient-1' }])
      .mockResolvedValueOnce([
        { userId: 'admin-1', nicknameInGroup: '관리자', user: {} },
      ]);
    groupRepo.findOne.mockResolvedValue({
      id: 'group-1',
      name: '이다 프론트',
      coverMediaId: null,
    });

    await callDispatch(
      { groupId: 'group-1', type: GroupActivityType.MEMBER_REMOVE },
      ['admin-1'],
    );

    expect(notificationService.sendToUsers).toHaveBeenCalledWith(
      ['recipient-1'],
      '이다 프론트',
      '그룹에서 멤버가 내보내졌습니다.',
      { groupId: 'group-1' },
    );
  });
});
