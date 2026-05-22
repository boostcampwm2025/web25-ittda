import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DateSelectorDrawer from '../DateSelectorDrawer';

// DateSelectorDrawer는 내부에서 useQuery(myDailyRecordedDatesOption | groupDailyRecordedDatesOption)를 호출한다.
// enabled: isOpen 이지만 useQueryClient() 자체는 항상 실행되므로 QueryClientProvider가 필요하다.
// 드로어를 열었을 때 캘린더에 기록 점이 표시되도록 현재 월 데이터를 미리 주입한다.
//   - personal 키: ['recordedDates', '/api/user/archives/record-days?month={YEAR}-{MONTH}']
//   - group 키:    ['recordedDates', '/api/groups/{groupId}/archives/record-days?month={YEAR}-{MONTH}']

const NOW = new Date();
const YEAR = NOW.getFullYear();
const MONTH = String(NOW.getMonth() + 1).padStart(2, '0');
// 현재 월의 기록된 날짜 (캘린더에 초록 점으로 표시됨)
const mockRecordedDates: string[] = [5, 10, 14, 20].map(
  (d) => `${YEAR}-${MONTH}-${String(d).padStart(2, '0')}`,
);

function makeClient(queryKey: unknown[], data: string[]) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  client.setQueryData(queryKey, data);
  return client;
}

const clients = {
  default: makeClient(
    ['recordedDates', `/api/user/archives/record-days?month=${YEAR}-${MONTH}`],
    mockRecordedDates,
  ),
};

const meta = {
  title: 'Record/DateSelectorDrawer',
  component: DateSelectorDrawer,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          '홈/아카이브 헤더에서 날짜를 선택하는 드로어 컴포넌트입니다. 캘린더 아이콘 버튼을 클릭하면 드로어가 열리며, 날짜 클릭 시 `dayRoute`로, 월 전체보기 클릭 시 `monthRoute`로, 연도 전체보기 클릭 시 `yearRoute`로 이동합니다. 기록이 있는 날짜에는 초록 점이 표시되며, 미래 날짜는 선택이 비활성화됩니다. 월 헤더 클릭 시 연도·월 선택 피커로 전환됩니다.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    dayRoute: { description: '날짜 클릭 시 이동할 기본 경로. 뒤에 /{YYYY-MM-DD}가 붙습니다.', control: 'text' },
    monthRoute: { description: '"월 기록 전체보기" 클릭 시 이동할 기본 경로. 뒤에 /{YYYY-MM}이 붙습니다.', control: 'text' },
    yearRoute: { description: '"연도 기록 전체보기" 클릭 시 이동할 기본 경로. 뒤에 /{YYYY}가 붙습니다.', control: 'text' },
    groupId: { description: '그룹 기록함이면 그룹 ID를 전달. 없으면 개인 기록함 API를 사용합니다.', control: 'text' },
  },
} satisfies Meta<typeof DateSelectorDrawer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    dayRoute: '/my/detail',
    monthRoute: '/my/month',
    yearRoute: '/my/year',
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={clients.default}>
        <div className="p-10 bg-[#F9F9F9] dark:bg-[#121212]">
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: `
개인 기록함 — 캘린더 아이콘을 클릭하면 드로어가 열립니다.
- **날짜 클릭**: \`dayRoute/{YYYY-MM-DD}\`로 이동
- **월 기록 전체보기**: \`monthRoute/{YYYY-MM}\`으로 이동
- **연도 기록 전체보기**: \`yearRoute/{YYYY}\`으로 이동
- **월 헤더 클릭**: 연도·월 선택 피커(스크롤 휠)로 전환
- **기록 있는 날짜**: 초록 점 표시 (드로어 열면 확인 가능)
- **미래 날짜**: 선택 비활성화
        `,
      },
    },
  },
};

