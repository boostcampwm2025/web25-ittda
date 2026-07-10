import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GroupSelectDrawer from './GroupSelectDrawer';
import type { GroupSummary } from '@/lib/types/recordResponse';

const mockRouter = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

vi.mock('@/components/ui/drawer', () => ({
  Drawer: ({
    open,
    children,
  }: {
    open: boolean;
    children: React.ReactNode;
  }) => (open ? <div>{children}</div> : null),
  DrawerContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DrawerHeader: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DrawerTitle: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DrawerClose: ({ children }: { children: React.ReactNode }) => (
    <button aria-label="닫기">{children}</button>
  ),
}));

vi.mock('./AssetImage', () => ({
  default: ({ alt }: { alt: string }) => (
    <img data-testid="asset-image" alt={alt} />
  ),
}));

function makeGroup(overrides: Partial<GroupSummary> = {}): GroupSummary {
  return {
    groupId: 'group-1',
    name: '여행 그룹',
    memberCount: 3,
    permission: 'EDITOR',
    cover: null,
    ...overrides,
  } as GroupSummary;
}

describe('GroupSelectDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('open이 false이면 렌더링하지 않는다', () => {
    const { container } = render(
      <GroupSelectDrawer open={false} onOpenChange={vi.fn()} groups={[]} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('그룹이 없으면 빈 상태 안내를 렌더링한다', () => {
    render(
      <GroupSelectDrawer open={true} onOpenChange={vi.fn()} groups={[]} />,
    );

    expect(screen.getByText('공유된 그룹이 없어요')).toBeInTheDocument();
  });

  it('그룹 목록을 렌더링한다', () => {
    const groups = [
      makeGroup({ groupId: 'g1', name: '여행 그룹' }),
      makeGroup({ groupId: 'g2', name: '맛집 그룹' }),
    ];
    render(
      <GroupSelectDrawer open={true} onOpenChange={vi.fn()} groups={groups} />,
    );

    expect(screen.getByText('여행 그룹')).toBeInTheDocument();
    expect(screen.getByText('맛집 그룹')).toBeInTheDocument();
  });

  it('EDITOR 권한 그룹을 클릭하면 drawer를 닫고 기록 작성 페이지로 이동한다', async () => {
    const onOpenChange = vi.fn();
    const groups = [makeGroup({ groupId: 'g1', permission: 'EDITOR' })];
    render(
      <GroupSelectDrawer
        open={true}
        onOpenChange={onOpenChange}
        groups={groups}
      />,
    );

    await userEvent.click(screen.getByText('여행 그룹'));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(mockRouter.push).toHaveBeenCalledWith('/add?groupId=g1');
  });

  it('VIEWER 권한 그룹은 비활성화되어 클릭해도 이동하지 않는다', async () => {
    const onOpenChange = vi.fn();
    const groups = [makeGroup({ groupId: 'g1', permission: 'VIEWER' })];
    render(
      <GroupSelectDrawer
        open={true}
        onOpenChange={onOpenChange}
        groups={groups}
      />,
    );

    const button = screen.getByText('여행 그룹').closest('button');
    expect(button).toBeDisabled();

    await userEvent.click(button!);

    expect(mockRouter.push).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('cover 이미지가 없으면 랜덤 기본 이미지를 사용한다', () => {
    const groups = [
      makeGroup({ groupId: 'g1', cover: null }),
    ];
    render(
      <GroupSelectDrawer open={true} onOpenChange={vi.fn()} groups={groups} />,
    );

    const image = screen.getByTestId('asset-image');
    expect(image).toBeInTheDocument();
  });
});
