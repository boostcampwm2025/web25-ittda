import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import Toolbar from '../Toolbar';

const meta = {
  title: 'RecordEditor/Toolbar',
  component: Toolbar,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
기록 작성·수정 페이지 하단에 고정되는 툴바 컴포넌트.

기록에 추가할 수 있는 블록 타입 버튼들이 나열된다.
각 버튼을 클릭하면 해당 타입의 새 블록이 에디터에 추가된다.

| 아이콘 | 블록 타입 | 설명 |
|--------|-----------|------|
| T (텍스트) | \`content\` | 텍스트 블록 |
| 사진 | \`photos\` | 이미지 블록 |
| 이모지 | \`emotion\` | 감정 블록 |
| 태그 | \`tags\` | 태그 블록 |
| 위치 | \`location\` | 위치 블록 |
| 표 | \`table\` | 테이블 블록 |
| 별 | \`rating\` | 별점 블록 |
| 돋보기 | \`media\` | 미디어 검색 블록 |
        `,
      },
    },
  },
  tags: ['autodocs'],
  args: {
    onAddBlock: () => {},
    onOpenDrawer: () => {},
  },
  decorators: [
    (Story) => (
      <div className="relative h-40 bg-[#F9F9F9] dark:bg-[#121212]">
        <div className="flex items-center justify-center h-full text-gray-400 text-sm">
          에디터 콘텐츠 영역
        </div>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Toolbar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: `
기록 에디터 하단 툴바 기본 상태.

- **각 아이콘 버튼 클릭**: \`onAddBlock(type)\` 호출 → 에디터에 해당 타입 블록 추가
- 아이콘에 호버 시 초록색(\`itta-point\`)으로 강조됨
        `,
      },
    },
  },
};
