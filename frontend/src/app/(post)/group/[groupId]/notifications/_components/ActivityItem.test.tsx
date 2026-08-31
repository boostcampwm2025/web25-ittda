import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ActivityItem } from './ActivityItem';
import type { GroupActivityItem } from '@/lib/types/group';

const mockRouter = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

function buildActivity(
  overrides: Partial<GroupActivityItem>,
): GroupActivityItem {
  return {
    id: 'activity-1',
    type: 'POST_SHARE',
    refId: 'post-1',
    meta: { title: '제목' },
    createdAt: new Date().toISOString(),
    actors: [],
    ...overrides,
  };
}

describe('ActivityItem', () => {
  it('POST_SHARE 클릭 시 groupId를 함께 넘겨 이동한다', async () => {
    const user = userEvent.setup();
    render(
      <ActivityItem
        activity={buildActivity({ type: 'POST_SHARE' })}
        groupId="group-1"
      />,
    );

    await user.click(screen.getByRole('button'));

    expect(mockRouter.push).toHaveBeenCalledWith(
      '/record/post-1?groupId=group-1',
    );
  });

  it('키보드로 포커스 후 Enter를 눌러도 이동한다', async () => {
    const user = userEvent.setup();
    render(
      <ActivityItem
        activity={buildActivity({ type: 'POST_SHARE' })}
        groupId="group-1"
      />,
    );

    const button = screen.getByRole('button');
    button.focus();
    await user.keyboard('{Enter}');

    expect(mockRouter.push).toHaveBeenCalledWith(
      '/record/post-1?groupId=group-1',
    );
  });

  it('POST_CREATE는 기존대로 groupId 없이 이동한다', async () => {
    const user = userEvent.setup();
    render(
      <ActivityItem
        activity={buildActivity({ type: 'POST_CREATE' })}
        groupId="group-1"
      />,
    );

    await user.click(screen.getByRole('button'));

    expect(mockRouter.push).toHaveBeenCalledWith('/record/post-1');
  });

  it('클릭 불가능한 활동(MEMBER_JOIN)은 버튼이 아닌 일반 텍스트로 렌더링된다', () => {
    render(
      <ActivityItem
        activity={buildActivity({ type: 'MEMBER_JOIN', refId: null })}
        groupId="group-1"
      />,
    );

    expect(screen.queryByRole('button')).toBeNull();
  });
});
