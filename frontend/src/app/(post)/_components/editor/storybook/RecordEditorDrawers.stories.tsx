import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import EmotionDrawer from '../emotion/EmotionDrawer';
import TagDrawer from '../tag/TagDrawer';
import RatingDrawer from '../rating/RatingPickerDrawer';
import TimePickerDrawer from '../core/TimePickerDrawer';
import PhotoDrawer from '../photo/PhotoDrawer';
import MediaDrawer from '../media/MediaDrawer';
import DateDrawer from '@/components/DateDrawer';

import type { MoodValue, RatingValue, TagValue, TimeValue, ImageValue } from '@/lib/types/record';
import type { MediaValue } from '@/lib/types/recordField';

const noop = () => {};

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

// ─── MSW 핸들러 공통 ────────────────────────────────────────────────────────
const mockTagsHandler = http.get('/api/stats/tags', () =>
  HttpResponse.json({
    success: true,
    data: {
      recentTags: [
        { tag: '아침', count: 3 },
        { tag: '커피', count: 7 },
      ],
      frequentTags: [
        { tag: '팀프로젝트', count: 12 },
        { tag: '커피', count: 7 },
        { tag: '점심', count: 5 },
        { tag: '아침', count: 3 },
        { tag: '팀 잇다', count: 1 },
      ],
    },
  }),
);

const mockMediaResolveHandler = http.post('/api/media/resolve', () =>
  HttpResponse.json({ success: true, data: { items: [], failed: [] } }),
);

const mockMovieSearchHandler = http.get('/api/tmdb/search/movie', () =>
  HttpResponse.json({
    results: [
      {
        id: 157336,
        title: '인터스텔라',
        original_title: 'Interstellar',
        poster_path: null,
        release_date: '2014-11-05',
      },
      {
        id: 603,
        title: '매트릭스',
        original_title: 'The Matrix',
        poster_path: null,
        release_date: '1999-03-31',
      },
      {
        id: 27205,
        title: '인셉션',
        original_title: 'Inception',
        poster_path: null,
        release_date: '2010-07-16',
      },
    ],
  }),
);

// ─── Trigger 버튼 래퍼 헬퍼 ─────────────────────────────────────────────────
function DrawerTrigger({
  label,
  children,
}: {
  label: string;
  children: (open: boolean, setOpen: (v: boolean) => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col items-center gap-4 p-8 bg-[#F9F9F9] dark:bg-[#121212] rounded-2xl min-h-40 justify-center">
      <button
        onClick={() => setOpen(true)}
        className="px-5 py-2.5 rounded-xl bg-itta-point text-white text-sm font-bold shadow-lg active:scale-95 transition-all"
      >
        {label}
      </button>
      {children(open, setOpen)}
    </div>
  );
}

// ─── Meta ────────────────────────────────────────────────────────────────────
const meta = {
  title: 'RecordEditor/RecordEditorDrawers',
  component: EmotionDrawer,
  parameters: {
    layout: 'centered',
    nextjs: { appDirectory: true },
    docs: {
      description: {
        component: `
기록 에디터에서 각 블록 필드를 클릭하거나 툴바에서 블록을 추가할 때 열리는 드로어 모음.

각 스토리의 버튼을 클릭하면 실제 드로어가 열린다.

| 드로어 | 트리거 |
|--------|--------|
| \`EmotionDrawer\` | 감정 블록 클릭 |
| \`TagDrawer\` | 태그 블록 클릭 |
| \`RatingDrawer\` | 별점 블록 클릭 |
| \`TimePickerDrawer\` | 날짜·시간 블록 클릭 |
| \`DateDrawer\` | 날짜 블록 클릭 |
| \`PhotoDrawer\` | 사진 블록 클릭 |
| \`MediaDrawer\` | 미디어 블록 클릭 |
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof EmotionDrawer>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── EmotionDrawer ────────────────────────────────────────────────────────────
export const Emotion: Story = {
  name: 'EmotionDrawer',
  render: () => {
    const [selected, setSelected] = useState<MoodValue>({ mood: '' });
    return (
      <DrawerTrigger label="감정 드로어 열기">
        {(open, setOpen) => (
          <EmotionDrawer
            isOpen={open}
            selectedEmotion={selected}
            onSelect={(mood) => setSelected({ mood })}
            onClose={() => setOpen(false)}
          />
        )}
      </DrawerTrigger>
    );
  },
  parameters: {
    docs: {
      description: {
        story: `
감정 블록을 클릭했을 때 열리는 드로어 — 5열 그리드로 19가지 감정 이모지를 선택할 수 있다.

- **감정 클릭**: 해당 감정 선택 (링 강조 표시)
- **확인 버튼**: 드로어 닫기
        `,
      },
    },
  },
};

export const EmotionWithSelected: Story = {
  name: 'EmotionDrawer — 선택된 상태',
  render: () => {
    const [selected, setSelected] = useState<MoodValue>({ mood: '행복' });
    return (
      <DrawerTrigger label="감정 드로어 열기 (행복 선택됨)">
        {(open, setOpen) => (
          <EmotionDrawer
            isOpen={open}
            selectedEmotion={selected}
            onSelect={(mood) => setSelected({ mood })}
            onClose={() => setOpen(false)}
          />
        )}
      </DrawerTrigger>
    );
  },
  parameters: {
    docs: {
      description: {
        story: '이미 "행복"이 선택된 상태로 드로어가 열린다.',
      },
    },
  },
};

// ─── TagDrawer ────────────────────────────────────────────────────────────────
export const Tag: Story = {
  name: 'TagDrawer',
  render: () => {
    const [tags, setTags] = useState<TagValue>({ tags: [] });
    return (
      <DrawerTrigger label="태그 드로어 열기">
        {(open, setOpen) =>
          open && (
            <TagDrawer
              tags={tags}
              onUpdateTags={(newTags) => setTags({ tags: newTags })}
              onClose={() => setOpen(false)}
            />
          )
        }
      </DrawerTrigger>
    );
  },
  parameters: {
    msw: { handlers: [mockTagsHandler] },
    docs: {
      description: {
        story: `
태그 블록을 클릭했을 때 열리는 드로어 — 직접 입력하거나 이전에 사용한 태그를 선택할 수 있다.

- **# 입력창 + Enter / + 버튼**: 태그 추가 (최대 4개)
- **이전 사용 태그 클릭**: 토글 선택
- **4개 초과 시**: 경고 메시지 표시
        `,
      },
    },
  },
};

export const TagWithExisting: Story = {
  name: 'TagDrawer — 기존 태그 있음',
  render: () => {
    const [tags, setTags] = useState<TagValue>({ tags: ['성수동', '카페'] });
    return (
      <DrawerTrigger label="태그 드로어 열기 (태그 2개)">
        {(open, setOpen) =>
          open && (
            <TagDrawer
              tags={tags}
              onUpdateTags={(newTags) => setTags({ tags: newTags })}
              onClose={() => setOpen(false)}
            />
          )
        }
      </DrawerTrigger>
    );
  },
  parameters: {
    msw: { handlers: [mockTagsHandler] },
    docs: {
      description: {
        story: '이미 태그 2개가 선택된 상태로 드로어가 열린다.',
      },
    },
  },
};

// ─── RatingDrawer ─────────────────────────────────────────────────────────────
export const Rating: Story = {
  name: 'RatingDrawer',
  render: () => {
    const [rating, setRating] = useState<RatingValue>({ rating: 0 });
    return (
      <DrawerTrigger label="별점 드로어 열기">
        {(open, setOpen) =>
          open && (
            <RatingDrawer
              rating={rating}
              onUpdateRating={setRating}
              onClose={() => setOpen(false)}
            />
          )
        }
      </DrawerTrigger>
    );
  },
  parameters: {
    docs: {
      description: {
        story: `
별점 블록을 클릭했을 때 열리는 드로어 — 별 위를 드래그하거나 클릭해 0.1 단위로 별점을 설정한다.

- **별 영역 드래그/클릭**: 0.1점 단위 별점 입력
- **숫자 표시**: 현재 선택된 점수가 큰 숫자로 실시간 표시
- **확인 버튼**: 별점 저장 후 드로어 닫기
        `,
      },
    },
  },
};

export const RatingWithValue: Story = {
  name: 'RatingDrawer — 3.5점 상태',
  render: () => {
    const [rating, setRating] = useState<RatingValue>({ rating: 3.5 });
    return (
      <DrawerTrigger label="별점 드로어 열기 (3.5점)">
        {(open, setOpen) =>
          open && (
            <RatingDrawer
              rating={rating}
              onUpdateRating={setRating}
              onClose={() => setOpen(false)}
            />
          )
        }
      </DrawerTrigger>
    );
  },
  parameters: {
    docs: {
      description: {
        story: '3.5점이 미리 입력된 상태로 드로어가 열린다.',
      },
    },
  },
};

// ─── DateDrawer ───────────────────────────────────────────────────────────────
export const DateSingle: Story = {
  name: 'DateDrawer — 날짜 선택',
  render: () => {
    const [date, setDate] = useState('2026-01-15');
    return (
      <DrawerTrigger label="날짜 드로어 열기">
        {(open, setOpen) =>
          open && (
            <DateDrawer
              mode="single"
              currentDate={date}
              onSelectDate={(d) => { setDate(d); setOpen(false); }}
              onClose={() => setOpen(false)}
            />
          )
        }
      </DrawerTrigger>
    );
  },
  parameters: {
    docs: {
      description: {
        story: `
날짜 블록을 클릭했을 때 열리는 달력 드로어.

- **날짜 클릭**: 해당 날짜 선택 후 드로어 닫기
- **← / → 버튼**: 월 이동
- **↺ 버튼**: 오늘 날짜로 초기화
        `,
      },
    },
  },
};

// ─── TimePickerDrawer ─────────────────────────────────────────────────────────
export const TimePicker: Story = {
  name: 'TimePickerDrawer',
  render: () => {
    const [time, setTime] = useState<TimeValue>({ time: '14:30' });
    return (
      <DrawerTrigger label="시간 드로어 열기">
        {(open, setOpen) =>
          open && (
            <TimePickerDrawer
              currentTime={time}
              onSave={(t) => { setTime({ time: t }); setOpen(false); }}
              onClose={() => setOpen(false)}
            />
          )
        }
      </DrawerTrigger>
    );
  },
  parameters: {
    docs: {
      description: {
        story: `
시간 블록을 클릭했을 때 열리는 드럼롤 타임피커 드로어.

- **스크롤 / 드래그**: 시·분 선택
- **직접 입력 모드**: 키보드 아이콘 클릭 시 텍스트 입력으로 전환
- **확인 버튼**: 시간 저장 후 드로어 닫기
        `,
      },
    },
  },
};

// ─── PhotoDrawer ──────────────────────────────────────────────────────────────
export const Photo: Story = {
  name: 'PhotoDrawer — 사진 있음',
  render: () => {
    const [photos, setPhotos] = useState<ImageValue>({
      mediaIds: [],
      tempUrls: [
        'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=400',
        'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=400',
        'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&q=80&w=400',
      ],
    });
    return (
      <QueryClientProvider client={queryClient}>
        <DrawerTrigger label="사진 드로어 열기">
          {(open, setOpen) =>
            open && (
              <PhotoDrawer
                photos={photos}
                onUploadClick={noop}
                onRemovePhoto={(idx) =>
                  setPhotos((prev) => ({
                    ...prev,
                    tempUrls: prev.tempUrls?.filter((_, i) => i !== idx),
                  }))
                }
                onRemoveAll={() => setPhotos({ mediaIds: [], tempUrls: [] })}
                onClose={() => setOpen(false)}
              />
            )
          }
        </DrawerTrigger>
      </QueryClientProvider>
    );
  },
  parameters: {
    msw: { handlers: [mockMediaResolveHandler] },
    docs: {
      description: {
        story: `
사진 블록을 클릭했을 때 열리는 드로어 — 추가된 사진 목록과 관리 기능을 제공한다.

- **+ 버튼**: 사진 추가 (업로드 플로우)
- **사진 우측 X**: 해당 사진 개별 삭제
- **전체 삭제 버튼**: 모든 사진 제거
- **메타데이터 수정**: 촬영 날짜·시간·위치를 기록 블록에 자동 반영
        `,
      },
    },
  },
};

export const PhotoEmpty: Story = {
  name: 'PhotoDrawer — 사진 없음',
  render: () => (
    <QueryClientProvider client={queryClient}>
      <DrawerTrigger label="사진 드로어 열기 (빈 상태)">
        {(open, setOpen) =>
          open && (
            <PhotoDrawer
              photos={{ mediaIds: [], tempUrls: [] }}
              onUploadClick={noop}
              onRemovePhoto={noop}
              onRemoveAll={noop}
              onClose={() => setOpen(false)}
            />
          )
        }
      </DrawerTrigger>
    </QueryClientProvider>
  ),
  parameters: {
    msw: { handlers: [mockMediaResolveHandler] },
    docs: {
      description: {
        story: '사진이 한 장도 없는 초기 상태 — "+ 사진 추가" 버튼만 표시된다.',
      },
    },
  },
};

// ─── MediaDrawer ──────────────────────────────────────────────────────────────
export const Media: Story = {
  name: 'MediaDrawer',
  render: () => {
    const [, setSelected] = useState<MediaValue | null>(null);
    return (
      <DrawerTrigger label="미디어 드로어 열기">
        {(open, setOpen) =>
          open && (
            <MediaDrawer
              onSelect={(media) => { setSelected(media); setOpen(false); }}
              onClose={() => setOpen(false)}
            />
          )
        }
      </DrawerTrigger>
    );
  },
  parameters: {
    msw: { handlers: [mockMovieSearchHandler] },
    docs: {
      description: {
        story: `
미디어 블록을 클릭했을 때 열리는 드로어 — 영화·연극·뮤지컬을 검색해 기록에 첨부한다.

- **카테고리 칩**: 영화 / 연극 / 뮤지컬 전환
- **검색창 입력**: 자동으로 검색 결과 표시 (MSW mock)
- **검색 결과 클릭**: 해당 미디어 선택 후 드로어 닫기
- **직접 입력**: 검색 결과에 없는 경우 수동으로 제목·종류·연도 입력
        `,
      },
    },
  },
};
