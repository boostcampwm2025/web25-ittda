import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DailyDetailRecordItem from './DailyDetailRecordItem';
import type { RecordPreview } from '@/lib/types/recordResponse';

const mockRouter = vi.hoisted(() => ({ push: vi.fn(), back: vi.fn() }));
const mockInvalidateQueries = vi.hoisted(() => vi.fn());
const mockUseApiDelete = vi.hoisted(() => vi.fn());
const mockToastSuccess = vi.hoisted(() => vi.fn());
const mockRefreshSharedData = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}));

vi.mock('@/hooks/useApi', () => ({
  useApiDelete: mockUseApiDelete,
}));

vi.mock('sonner', () => ({
  toast: { success: mockToastSuccess },
}));

vi.mock('@/lib/actions/revalidate', () => ({
  refreshSharedData: mockRefreshSharedData,
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
    <button>{children}</button>
  ),
}));

vi.mock('../app/(post)/_components/DailyDetailRecordActions', () => ({
  default: ({ onDeleteClick }: { onDeleteClick: () => void }) => (
    <button aria-label="더보기" onClick={onDeleteClick} />
  ),
}));

vi.mock('@/components/BlockContent', () => ({
  default: ({ block }: { block: { id: string; type: string } }) => (
    <div data-testid="block" data-block-id={block.id} data-type={block.type} />
  ),
}));

vi.mock('./AssetImage', () => ({
  default: ({ alt }: { alt: string }) => (
    <img data-testid="asset-image" alt={alt} />
  ),
}));

function makeRecord(overrides: Partial<RecordPreview> = {}): RecordPreview {
  return {
    postId: 'record-1',
    scope: 'ME',
    contributors: [],
    groupId: null,
    title: '성수동 카페 투어',
    eventAt: '2024-06-15T05:30:00.000Z',
    createdAt: '2024-06-15T05:30:00.000Z',
    updatedAt: '2024-06-15T05:30:00.000Z',
    location: null,
    tags: null,
    emotion: [],
    rating: null,
    blocks: [],
    ...overrides,
  } as RecordPreview;
}

describe('DailyDetailRecordItem', () => {
  let capturedOptions: {
    onSuccess?: () => void | Promise<void>;
    onError?: (error: { code?: string }) => void;
  } = {};
  const deleteRecord = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseApiDelete.mockImplementation((_url, options) => {
      capturedOptions = options;
      return { mutate: deleteRecord };
    });
  });

  it('eventAt이 있으면 시간을 표시한다', () => {
    render(<DailyDetailRecordItem record={makeRecord()} />);
    // formatTime은 로컬 타임존 기준이라 시:분 형식(오전/오후 h:mm)만 느슨하게 확인
    expect(screen.getByText(/(오전|오후)/)).toBeInTheDocument();
  });

  it('eventAt이 없으면 "시간 정보 없음"을 표시한다', () => {
    render(
      <DailyDetailRecordItem
        record={makeRecord({ eventAt: '' as unknown as string })}
      />,
    );
    expect(screen.getByText('시간 정보 없음')).toBeInTheDocument();
  });

  it('카드를 클릭하면 groupId 없이 기록 상세로 이동한다', async () => {
    render(<DailyDetailRecordItem record={makeRecord()} />);

    await userEvent.click(screen.getByText('성수동 카페 투어'));

    expect(mockRouter.push).toHaveBeenCalledWith('/record/record-1');
  });

  it('groupId가 있으면 scope, groupId 쿼리와 함께 이동한다', async () => {
    render(
      <DailyDetailRecordItem record={makeRecord()} groupId="group-1" />,
    );

    await userEvent.click(screen.getByText('성수동 카페 투어'));

    expect(mockRouter.push).toHaveBeenCalledWith(
      '/record/record-1?scope=group&groupId=group-1',
    );
  });

  it('hasActiveEditDraft가 true면 공동 수정 중 안내를 표시한다', () => {
    render(
      <DailyDetailRecordItem record={makeRecord({ hasActiveEditDraft: true })} />,
    );
    expect(screen.getByText('공동 수정 중...')).toBeInTheDocument();
  });

  it('span이 2인 블록이 있는 row는 BlockContent를 렌더링한다', () => {
    render(
      <DailyDetailRecordItem
        record={makeRecord({
          blocks: [
            {
              id: 'b1',
              type: 'TEXT',
              value: { text: 'a' },
              layout: { row: 1, col: 1, span: 2 },
            },
            {
              id: 'b2',
              type: 'RATING',
              value: { rating: 4 },
              layout: { row: 2, col: 1, span: 1 },
            },
            {
              id: 'b3',
              type: 'DATE',
              value: { date: '2024-06-15' },
              layout: { row: 2, col: 2, span: 1 },
            },
          ],
        })}
      />,
    );

    const blocks = screen.getAllByTestId('block');
    expect(blocks).toHaveLength(3);
    expect(blocks.map((b) => b.dataset.blockId)).toEqual(['b1', 'b2', 'b3']);
  });

  it('groupId가 있으면 참여자 아바타를 최대 4명까지 표시하고 초과분은 뱃지로 표시한다', () => {
    const contributors = Array.from({ length: 6 }, (_, i) => ({
      userId: `u${i}`,
      role: 'CONTRIBUTOR' as const,
      nickname: `user${i}`,
      groupNickname: `g${i}`,
      groupProfileImageId: null,
      profileImageId: null,
    }));
    render(
      <DailyDetailRecordItem
        record={makeRecord({ contributors })}
        groupId="group-1"
      />,
    );

    expect(screen.getAllByAltText(/의 프로필/)).toHaveLength(4);
    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  it('groupId가 없으면 참여자 아바타를 표시하지 않는다', () => {
    const contributors = [
      {
        userId: 'u1',
        role: 'CONTRIBUTOR' as const,
        nickname: 'user1',
        groupNickname: 'g1',
        groupProfileImageId: null,
        profileImageId: null,
      },
    ];
    render(<DailyDetailRecordItem record={makeRecord({ contributors })} />);

    expect(screen.queryAllByAltText(/의 프로필/)).toHaveLength(0);
  });

  it('삭제 트리거 → 확인 드로어 → 삭제하기 클릭 시 삭제를 실행하고 드로어를 닫는다', async () => {
    render(<DailyDetailRecordItem record={makeRecord()} />);

    await userEvent.click(screen.getByRole('button', { name: '더보기' }));
    expect(screen.getByText(/기록을 삭제할까요\?/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '삭제하기' }));

    expect(deleteRecord).toHaveBeenCalledWith({});
    expect(screen.queryByText(/기록을 삭제할까요\?/)).toBeNull();
  });

  it('삭제 성공(personal) 시 성공 토스트와 my/records 무효화만 실행한다', async () => {
    render(<DailyDetailRecordItem record={makeRecord()} />);

    await capturedOptions.onSuccess?.();

    expect(mockToastSuccess).toHaveBeenCalledWith('기록이 삭제되었습니다.');
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ['my', 'records'],
    });
    expect(mockRefreshSharedData).not.toHaveBeenCalled();
  });

  it('삭제 성공(group) 시 그룹/공유 쿼리 무효화와 refreshSharedData를 함께 실행한다', async () => {
    render(
      <DailyDetailRecordItem record={makeRecord()} groupId="group-1" />,
    );

    await capturedOptions.onSuccess?.();

    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ['group', 'group-1', 'records'],
    });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ['shared'],
    });
    expect(mockRefreshSharedData).toHaveBeenCalledTimes(1);
  });

  it('삭제 실패(NOT_FOUND)면 이전 페이지로 돌아간다', () => {
    render(<DailyDetailRecordItem record={makeRecord()} />);

    capturedOptions.onError?.({ code: 'NOT_FOUND' });

    expect(mockRouter.back).toHaveBeenCalledTimes(1);
  });

  it('삭제 실패(다른 코드)면 이전 페이지로 돌아가지 않는다', () => {
    render(<DailyDetailRecordItem record={makeRecord()} />);

    capturedOptions.onError?.({ code: 'INTERNAL_SERVER_ERROR' });

    expect(mockRouter.back).not.toHaveBeenCalled();
  });
});
