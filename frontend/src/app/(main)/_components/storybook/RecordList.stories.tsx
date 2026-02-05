import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RecordList from '../RecordList';
import { formatDateISO } from '@/lib/date';
import { createMockRecordPreviews } from '@/lib/mocks/handlers';

// 각 스토리마다 새로운 QueryClient를 생성하는 함수
const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
    },
  });

const meta = {
  title: 'Record/RecordList',
  component: RecordList,
  parameters: {
    layout: 'padded',
    docs: {
      // Docs에서 각 스토리를 독립적인 iframe으로 렌더링
      story: { inline: false, height: '400px' },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <QueryClientProvider client={createQueryClient()}>
        <div className="max-w-md mx-auto p-5 bg-[#F9F9F9] dark:bg-[#121212]">
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
} satisfies Meta<typeof RecordList>;

export default meta;
type Story = StoryObj<typeof meta>;

// 기본: 여러 기록이 있는 경우
export const Default: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/feed', () => {
          const today = formatDateISO();
          return HttpResponse.json({
            success: true,
            data: createMockRecordPreviews(today),
            error: null,
          });
        }),
      ],
    },
  },
};

// 기록이 하나만 있는 경우
export const SingleRecord: Story = {
  parameters: {
    docs: {
      description: {
        story: '기록이 하나만 있는 경우',
      },
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
        story: '기록이 없는 경우 - "기록 추가하기" 버튼 표시',
      },
    },
    msw: {
      handlers: [
        http.get('/api/feed', () => {
          return HttpResponse.json({
            success: true,
            data: [],
            error: null,
          });
        }),
      ],
    },
  },
};

// 많은 기록이 있는 경우
export const ManyRecords: Story = {
  parameters: {
    docs: {
      description: {
        story: '많은 기록이 있는 경우',
      },
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

// 다크 모드
export const DarkMode: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        story: '다크 모드',
      },
    },
    msw: {
      handlers: [
        http.get('/api/feed', () => {
          const today = formatDateISO();
          return HttpResponse.json({
            success: true,
            data: createMockRecordPreviews(today),
            error: null,
          });
        }),
      ],
    },
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={createQueryClient()}>
        <div className="dark">
          <div className="max-w-md mx-auto p-5 bg-[#121212]">
            <Story />
          </div>
        </div>
      </QueryClientProvider>
    ),
  ],
};
