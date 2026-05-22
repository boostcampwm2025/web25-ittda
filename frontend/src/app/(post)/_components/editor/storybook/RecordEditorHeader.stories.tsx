import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import RecordEditorHeader from '../RecordEditorHeader';
import { PresenceMember } from '@/hooks/useDraftPresence';

const mockMembers: PresenceMember[] = [
  {
    actorId: 'actor-1',
    sessionId: 'session-1',
    displayName: '도비',
    permissionRole: 'EDITOR',
    profileImageId: '/profile-ex.jpeg',
    lastSeenAt: new Date().toISOString(),
  },
  {
    actorId: 'actor-2',
    sessionId: 'session-2',
    displayName: '루피',
    permissionRole: 'EDITOR',
    profileImageId: null,
    lastSeenAt: new Date().toISOString(),
  },
  {
    actorId: 'actor-3',
    sessionId: 'session-3',
    displayName: '하니',
    permissionRole: 'VIEWER',
    profileImageId: '/profile-ex.jpeg',
    lastSeenAt: new Date().toISOString(),
  },
];

const manyMembers: PresenceMember[] = [
  ...mockMembers,
  {
    actorId: 'actor-4',
    sessionId: 'session-4',
    displayName: '새벽',
    permissionRole: 'EDITOR',
    profileImageId: null,
    lastSeenAt: new Date().toISOString(),
  },
  {
    actorId: 'actor-5',
    sessionId: 'session-5',
    displayName: '민영',
    permissionRole: 'EDITOR',
    profileImageId: '/profile-ex.jpeg',
    lastSeenAt: new Date().toISOString(),
  },
  {
    actorId: 'actor-6',
    sessionId: 'session-6',
    displayName: '수연',
    permissionRole: 'ADMIN',
    profileImageId: null,
    lastSeenAt: new Date().toISOString(),
  },
];

const meta = {
  title: 'RecordEditor/RecordEditorHeader',
  component: RecordEditorHeader,
  parameters: {
    layout: 'fullscreen',
    nextjs: { appDirectory: true },
    docs: {
      description: {
        component: `
기록 작성·수정 페이지 상단에 고정되는 헤더 컴포넌트.

좌측에 뒤로가기 버튼과 페이지 제목(기록 작성/기록 수정), 우측에 현재 편집 중인 멤버 아바타 목록과 저장 버튼이 표시된다.
멤버 아바타에 마우스를 올리면 편집 중인 멤버 목록 팝오버가 나타난다.

- **mode**: \`'add'\` — "기록 작성" / \`'edit'\` — "기록 수정"
- **members**: 실시간 협업 중인 멤버 목록 (presence 데이터) — 빈 배열이면 멤버 표시 영역 숨김
- **onSave**: 우측 저장 버튼 클릭 시 호출
        `,
      },
    },
  },
  tags: ['autodocs'],
  args: {
    onSave: () => {},
  },
  decorators: [
    (Story) => (
      <div className="bg-[#F9F9F9] dark:bg-[#121212] min-h-20">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof RecordEditorHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    mode: 'add',
    members: [],
  },
  parameters: {
    docs: {
      description: {
        story: `
기록 작성 모드 — 협업 멤버 없이 혼자 작성하는 기본 상태.

- **← 뒤로가기 버튼**: 이전 페이지로 이동
- **저장 버튼**: \`onSave\` 호출 → 기록 저장 처리
        `,
      },
    },
  },
};

export const EditMode: Story = {
  args: {
    mode: 'edit',
    members: [],
  },
  parameters: {
    docs: {
      description: {
        story: '기록 수정 모드 — 헤더 제목이 "기록 수정"으로 변경된다.',
      },
    },
  },
};

export const WithCollaborators: Story = {
  args: {
    mode: 'edit',
    members: mockMembers,
  },
  parameters: {
    docs: {
      description: {
        story: '3명이 실시간으로 함께 편집 중인 상태 — 멤버 아바타가 우측에 표시된다. 아바타에 마우스를 올리면 멤버 목록 팝오버가 나타난다.',
      },
    },
  },
};

export const ManyCollaborators: Story = {
  args: {
    mode: 'edit',
    members: manyMembers,
  },
  parameters: {
    docs: {
      description: {
        story: '5명 초과(6명)가 편집 중인 상태 — 최대 4명의 아바타가 표시되고 나머지는 "+N" 숫자 배지로 표시된다.',
      },
    },
  },
};
