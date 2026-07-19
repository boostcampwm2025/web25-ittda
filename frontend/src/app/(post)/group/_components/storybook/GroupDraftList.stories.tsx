import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import GroupDraftList from '../GroupDraftList';
import { GroupDraftListItem } from '@/lib/types/recordCollaboration';

const GROUP_ID = 'group-1';

function makeDraft(override: Partial<GroupDraftListItem> & { draftId: string }): GroupDraftListItem {
  return {
    kind: 'CREATE',
    targetPostId: null,
    title: '제목 없음',
    createdAt: '2026-06-01T10:00:00Z',
    updatedAt: '2026-06-01T11:00:00Z',
    participantCount: 1,
    isPublishing: false,
    ...override,
  };
}

const mockDrafts: GroupDraftListItem[] = [
  makeDraft({ draftId: 'draft-1', kind: 'CREATE', title: '가족 나들이 기록', participantCount: 3 }),
  makeDraft({ draftId: 'draft-2', kind: 'EDIT', targetPostId: 'post-1', title: '설날 가족 모임', participantCount: 2 }),
  makeDraft({ draftId: 'draft-3', kind: 'CREATE', title: '', participantCount: 1 }),
];

const meta = {
  title: 'Group/GroupDraftList',
  component: GroupDraftList,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          '그룹 홈 플로팅 버튼 팝오버 내부에서 공동 작성 중인 드래프트 목록을 표시하는 컴포넌트입니다. 드래프트는 공동 작성(CREATE)과 공동 수정(EDIT)으로 구분되며, VIEWER는 카드를 클릭할 수 없습니다.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof GroupDraftList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: { groupId: GROUP_ID, drafts: [], isViewer: false },
  parameters: {
    docs: {
      description: {
        story: `
공동 작성 중인 드래프트가 없는 상태 — 빈 상태 안내 문구 표시.

- **새 드래프트 생성**: 플로팅 버튼 팝오버 상단의 '새 드래프트' 버튼으로 진입
        `,
      },
    },
  },
};

export const WithDrafts: Story = {
  args: { groupId: GROUP_ID, drafts: mockDrafts, isViewer: false },
  parameters: {
    docs: {
      description: {
        story: `
공동 작성(CREATE)·공동 수정(EDIT) 드래프트가 혼합된 상태.

- **드래프트 클릭**: 해당 공동 작성/수정 페이지로 이동
- **공동 작성** 배지: 초록색, **공동 수정** 배지: 노란색
- title이 빈 문자열인 경우 '제목 없음'으로 표시
        `,
      },
    },
  },
};

export const ViewerRole: Story = {
  args: { groupId: GROUP_ID, drafts: mockDrafts, isViewer: true },
  parameters: {
    docs: {
      description: {
        story: 'VIEWER 권한 — 드래프트 카드가 흐림 처리되어 클릭 불가',
      },
    },
  },
};
