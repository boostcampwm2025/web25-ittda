import { GroupActivityItem } from '@/lib/types/group';
import { getActorText } from '../_utils/activityHelper';

interface ActivityMeta {
  title?: string;
  beforeTitle?: string;
  afterTitle?: string;
  afterName?: string;
  beforeNickname?: string;
  afterNickname?: string;
}

const Highlight = ({ children }: { children: React.ReactNode }) => (
  <span className="font-semibold text-gray-900 dark:text-gray-100">
    {children}
  </span>
);

const TitleText = ({ text }: { text?: string }) =>
  text ? (
    <span className="font-bold text-itta-black dark:text-white mx-0.5">
      &quot;{text}&quot;
    </span>
  ) : null;

export function ActivityMessage({ activity }: { activity: GroupActivityItem }) {
  const actorText = getActorText(activity.actors);
  const meta = (activity.meta as ActivityMeta) || {};
  const { title, beforeTitle, afterTitle } = meta || {};

  switch (activity.type) {
    case 'POST_CREATE':
      return (
        <>
          <Highlight>{actorText}</Highlight>님이 새 기록{' '}
          <TitleText text={title} />
          을(를) 작성했습니다.
        </>
      );
    case 'POST_COLLAB_START':
      return (
        <>
          <Highlight>{actorText}</Highlight>님이 공동 작성을 시작했습니다.
        </>
      );
    case 'POST_COLLAB_COMPLETE':
      return (
        <>
          <Highlight>{actorText}</Highlight>님이 <TitleText text={title} /> 기록
          작성을 완료했습니다.
        </>
      );
    case 'POST_EDIT_START':
      return (
        <>
          <Highlight>{actorText}</Highlight>님이 <TitleText text={title} />{' '}
          기록을 수정 중입니다.
        </>
      );
    case 'POST_EDIT_COMPLETE':
    case 'POST_UPDATE':
      if (beforeTitle && afterTitle && beforeTitle !== afterTitle) {
        return (
          <>
            <Highlight>{actorText}</Highlight>님이{' '}
            <span className="line-through text-gray-400 text-sm">
              {beforeTitle}
            </span>{' '}
            → <TitleText text={afterTitle} /> (으)로 수정했습니다.
          </>
        );
      }
      return (
        <>
          <Highlight>{actorText}</Highlight>님이{' '}
          <TitleText text={afterTitle || title} /> 기록을 수정했습니다.
        </>
      );
    case 'POST_DELETE':
      return (
        <>
          <Highlight>{actorText}</Highlight>님이 <TitleText text={title} />{' '}
          기록을 삭제했습니다.
        </>
      );
    case 'MEMBER_JOIN':
      return (
        <>
          <Highlight>{actorText}</Highlight>님이 그룹에 참여했습니다.
        </>
      );
    case 'MEMBER_LEAVE':
      return (
        <>
          <Highlight>{actorText}</Highlight>님이 그룹에서 나갔습니다.
        </>
      );
    case 'MEMBER_REMOVE':
      return (
        <>
          <Highlight>{actorText}</Highlight>님이 그룹에서 내보내졌습니다.
        </>
      );
    case 'MEMBER_ROLE_CHANGE':
      return (
        <>
          <Highlight>{actorText}</Highlight>님의 역할이 변경되었습니다.
        </>
      );
    case 'GROUP_NAME_UPDATE':
      return (
        <>
          그룹 이름이 <TitleText text={activity.meta?.afterName as string} />{' '}
          (으)로 변경되었습니다.
        </>
      );
    default:
      return (
        <>
          <Highlight>{actorText}</Highlight>님의 새로운 활동이 있습니다.
        </>
      );
  }
}
