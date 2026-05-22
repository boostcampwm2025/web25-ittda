import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RecordList from '../RecordList';
import { formatDateISO } from '@/lib/date';
import { createMockRecordPreviews } from '@/lib/mocks/mock';

type ImageLayout = 'tile' | 'carousel' | 'responsive';

// 모듈 레벨에서 한 번만 생성 — args 변경 시 QueryClient가 재생성되어
// loading 플래시가 발생하는 문제를 방지한다
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: 0,
    },
  },
});

// 이미지 2장인 record를 첫 번째에 배치 — tile/carousel 차이가 바로 보이도록
function buildFeedData() {
  const today = formatDateISO();
  const [record1, record2, record3] = createMockRecordPreviews(today);
  return [record2, record1, record3];
}

const meta = {
  title: 'Record/RecordList',
  component: RecordList,
  argTypes: {
    imageLayout: {
      control: { type: 'inline-radio' },
      options: ['tile', 'carousel', 'responsive'] as ImageLayout[],
      description:
        '이미지 블록의 표시 방식. 이미지가 2장 이상인 카드에서 차이가 명확히 보인다.',
    },
  },
  args: {
    imageLayout: 'tile' as ImageLayout,
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
홈 화면과 그룹 홈의 **피드 탭**에서 날짜별 기록 목록을 표시하는 컴포넌트.

WeekCalendar에서 날짜를 선택하면 해당 날짜의 기록 목록이 이 컴포넌트를 통해 렌더링된다.
기록 카드를 클릭하면 해당 기록의 상세 페이지(\`/record/:id\`)로 이동한다.

Controls 패널의 \`imageLayout\`을 바꾸면 이미지 표시 방식(tile·carousel·responsive)이 즉시 전환된다.
이미지가 2장인 두 번째 카드에서 차이가 가장 명확하게 보인다.
        `,
      },
      story: { height: '500px' },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <div className="max-w-2xl mx-auto p-5 bg-[#F9F9F9] dark:bg-[#121212]">
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
} satisfies Meta<typeof RecordList>;

export default meta;
type Story = StoryObj<typeof meta>;

// 기본: Controls에서 imageLayout을 바꿔 tile·carousel·responsive를 확인할 수 있다
export const Default: Story = {
  render: (args) => <RecordList imageLayout={args.imageLayout} />,
  parameters: {
    docs: {
      description: {
        story: `
오늘 날짜 기준 기록 목록. Controls 패널에서 \`imageLayout\`을 변경하면 이미지 레이아웃이 즉시 전환된다.

- **tile**: 이미지 2장을 나란히 그리드로 표시
- **carousel**: 이미지를 한 장씩 슬라이드로 표시 (하단 인디케이터 점·1/2 카운터)
- **responsive**: 모바일(640px 미만) carousel, 데스크톱 이상 tile 자동 전환
        `,
      },
    },
    msw: {
      handlers: [
        http.get('/api/feed', () =>
          HttpResponse.json({ success: true, data: buildFeedData(), error: null }),
        ),
      ],
    },
  },
};

// 기록이 하나만 있는 경우
export const SingleRecord: Story = {
  parameters: {
    docs: {
      description: { story: '기록이 하나만 있는 경우' },
    },
    msw: {
      handlers: [
        http.get('/api/feed', () => {
          const today = formatDateISO();
          return HttpResponse.json({
            success: true,
            data: [createMockRecordPreviews(today)[0]],
            error: null,
          });
        }),
      ],
    },
  },
};

// 기록이 없는 경우
export const EmptyRecords: Story = {
  parameters: {
    docs: {
      description: {
        story: '기록이 없는 경우 — "기록 추가하기" 버튼이 표시되며 클릭 시 기록 추가 페이지로 이동',
      },
    },
    msw: {
      handlers: [
        http.get('/api/feed', () =>
          HttpResponse.json({ success: true, data: [], error: null }),
        ),
      ],
    },
  },
};

// 많은 기록이 있는 경우
export const ManyRecords: Story = {
  parameters: {
    docs: {
      description: { story: '스크롤이 필요할 만큼 많은 기록이 있는 경우' },
    },
    msw: {
      handlers: [
        http.get('/api/feed', () => {
          const today = formatDateISO();
          const records = createMockRecordPreviews(today);
          return HttpResponse.json({
            success: true,
            data: [...records, ...records, ...records],
            error: null,
          });
        }),
      ],
    },
  },
};

