import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import RecordStatistics from '../RecordStatistics';
import { useEffect } from 'react';

const meta = {
  title: 'Profile/RecordStatistics',
  component: RecordStatistics,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="max-w-md mx-auto p-5 bg-[#F9F9F9] dark:bg-[#121212]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof RecordStatistics>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: '기본 기록 통계 - 작성 통계와 확장 가능한 상세 통계 포함',
      },
    },
  },
};

export const Collapsed: Story = {
  parameters: {
    docs: {
      description: {
        story: '접힌 상태 (기본) - WritingRecordStatistics만 표시',
      },
    },
  },
};

// 통계가 자동으로 펼쳐지도록 래퍼 컴포넌트 생성
function RecordStatisticsExpanded() {
  useEffect(() => {
    // DOM이 렌더링된 후 "통계 더보기" 버튼 클릭
    const timer = setTimeout(() => {
      const buttons = document.querySelectorAll('button');
      const expandButton = Array.from(buttons).find((button) =>
        button.textContent?.includes('통계 더보기'),
      );
      if (expandButton) {
        (expandButton as HTMLButtonElement).click();
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  return <RecordStatistics />;
}

export const Expanded: Story = {
  parameters: {
    docs: {
      description: {
        story:
          '펼쳐진 상태 - 월별 사용 차트, 장소 대시보드, 감정 대시보드 표시. Docs 모드에서도 자동으로 펼쳐집니다.',
      },
    },
  },
  render: () => <RecordStatisticsExpanded />,
};

export const DarkMode: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        story: '다크 모드 기록 통계',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="dark">
        <div className="max-w-md mx-auto p-5 bg-[#121212]">
          <Story />
        </div>
      </div>
    ),
  ],
};

export const Interactive: Story = {
  parameters: {
    docs: {
      description: {
        story: `
기록 통계 기능:
- **토글 버튼**: "통계 더보기" / "접기" 버튼으로 상세 통계 표시/숨김
- **애니메이션**: 부드러운 expand/collapse 애니메이션
- **포함된 통계**:
  1. WritingRecordStatistics: 작성 기록 요약
  2. MonthlyUsageChart: 월별 사용 차트
  3. PlaceDashboard: 장소별 통계
  4. EmotionDashboard: 감정별 통계
        `,
      },
    },
  },
};
