import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';

import { DateField, TimeField, ContentField } from '../core/CoreField';
import { EmotionField } from '../emotion/EmotionField';
import { PhotoField } from '../photo/PhotoField';
import { TagField } from '../tag/TagField';
import { RatingField } from '../rating/RatingField';
import { TableField } from '../table/TableField';
import MediaField from '../media/MediaField';
import { LocationField } from '@/components/map/LocationField';

import type {
  DateValue,
  TimeValue,
  TextValue,
  MoodValue,
  TagValue,
  RatingValue,
  LocationValue,
  ImageValue,
  TableValue,
  MediaInfoValue,
} from '@/lib/types/record';

const noop = () => {};

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

// ─── 비어 있는 기본값 ───────────────────────────────────────────────────────
const emptyDate: DateValue = { date: '' };
const emptyTime: TimeValue = { time: '' };
const emptyText: TextValue = { text: '' };
const emptyEmotion: MoodValue = { mood: '' };
const emptyTags: TagValue = { tags: [] };
const emptyRating: RatingValue = { rating: 0 };
const emptyLocation: LocationValue = { lat: 0, lng: 0, address: '' };
const emptyPhoto: ImageValue = { mediaIds: [], tempUrls: [] };
const emptyTable: TableValue = {
  rows: 2,
  cols: 2,
  cells: [
    ['', ''],
    ['', ''],
  ],
};
const emptyMedia: MediaInfoValue = {
  title: '',
  type: '',
  externalId: '',
  year: '',
  imageUrl: '',
};

// ─── 데이터 있는 값 ──────────────────────────────────────────────────────────
const filledDate: DateValue = { date: '2026-01-15' };
const filledTime: TimeValue = { time: '14:30' };
const filledText: TextValue = {
  text: '성수동 카페에서 오랜만에 친구와 만났다. 날씨도 좋고 커피도 맛있었다.',
};
const filledEmotion: MoodValue = { mood: '행복' };
const filledTags: TagValue = { tags: ['성수동', '카페', '친구'] };
const filledRating: RatingValue = { rating: 4 };
const filledLocation: LocationValue = {
  lat: 37.5444,
  lng: 127.0557,
  address: '서울 성동구 성수동2가',
  placeName: '성수 카페거리',
};
const filledPhoto: ImageValue = {
  mediaIds: [],
  tempUrls: [
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1516715094483-75da7dee9758?auto=format&fit=crop&q=80&w=400',
  ],
};
const filledTable: TableValue = {
  rows: 3,
  cols: 2,
  cells: [
    ['항목', '내용'],
    ['이름', '성수 카페'],
    ['가격', '7,000원'],
  ],
};
const filledMedia: MediaInfoValue = {
  title: '인터스텔라',
  type: '영화',
  externalId: 'tt0816692',
  year: '2014',
  imageUrl:
    'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&q=80&w=56',
};

// ─── 레이아웃 래퍼 ───────────────────────────────────────────────────────────
function FieldSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] font-black text-itta-point uppercase tracking-widest">
        {label}
      </span>
      <div className="px-1">{children}</div>
    </div>
  );
}

function EditorCanvas({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="max-w-lg mx-auto bg-white dark:bg-[#121212] rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 p-5 flex flex-col gap-5">
        {children}
      </div>
    </QueryClientProvider>
  );
}

// ─── Meta ────────────────────────────────────────────────────────────────────
const meta = {
  title: 'RecordEditor/RecordFields',
  parameters: {
    layout: 'padded',
    nextjs: { appDirectory: true },
    msw: {
      handlers: [
        // PhotoField 내부의 useMediaResolveMulti가 빈 배열로 호출할 때 빈 결과 반환
        http.post('/api/media/resolve', () =>
          HttpResponse.json({ success: true, data: { items: [], failed: [] } }),
        ),
      ],
    },
    docs: {
      description: {
        component: `
기록 작성·수정 에디터에서 툴바 버튼을 클릭하면 추가되는 블록 필드 컴포넌트 모음.

각 블록은 **빈 상태(방금 추가됨)**와 **데이터 있는 상태** 두 가지로 표시된다.
- 빈 상태: 점선 테두리의 플레이스홀더 버튼 → 클릭하면 해당 드로어/입력 열림
- 데이터 있는 상태: 입력된 값이 카드/칩 형태로 표시, 우측 X로 삭제 가능

| 툴바 아이콘 | 블록 타입 | 컴포넌트 |
|------------|-----------|---------|
| T | 텍스트 | \`ContentField\` |
| 사진 | 이미지 | \`PhotoField\` |
| 이모지 | 감정 | \`EmotionField\` |
| 태그 | 태그 | \`TagField\` |
| 위치 | 위치 | \`LocationField\` |
| 표 | 테이블 | \`TableField\` |
| 별 | 별점 | \`RatingField\` |
| 돋보기 | 미디어 정보 | \`MediaField\` |

날짜/시간 블록은 툴바가 아닌 기록 생성 시 자동으로 추가된다.
        `,
      },
    },
  },
  tags: ['autodocs'],
  // component는 단일 컴포넌트가 아니므로 대표용으로 ContentField 지정
  component: ContentField,
} satisfies Meta<typeof ContentField>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Stories ─────────────────────────────────────────────────────────────────

export const AllEmpty: Story = {
  render: () => (
    <EditorCanvas>
      <FieldSection label="날짜 · 시간 (자동 추가)">
        <div className="flex gap-4 flex-wrap">
          <DateField date={emptyDate} onClick={noop} />
          <TimeField time={emptyTime} onClick={noop} />
        </div>
      </FieldSection>

      <FieldSection label="텍스트 (T)">
        <ContentField
          value={emptyText}
          onChange={noop}
          onRemove={noop}
          isLastContentBlock={false}
        />
      </FieldSection>

      <FieldSection label="사진">
        <PhotoField photos={emptyPhoto} onClick={noop} onRemove={noop} />
      </FieldSection>

      <FieldSection label="감정">
        <EmotionField emotion={emptyEmotion} onClick={noop} onRemove={noop} />
      </FieldSection>

      <FieldSection label="태그">
        <TagField tags={emptyTags} onRemove={noop} onAdd={noop} onRemoveField={noop} />
      </FieldSection>

      <FieldSection label="위치">
        <LocationField location={emptyLocation} onClick={noop} onRemove={noop} />
      </FieldSection>

      <FieldSection label="별점">
        <RatingField value={emptyRating} onClick={noop} onRemove={noop} />
      </FieldSection>

      <FieldSection label="미디어 정보 (영화·연극 등)">
        <MediaField data={emptyMedia} onClick={noop} onRemove={noop} />
      </FieldSection>

      <FieldSection label="테이블">
        <TableField data={emptyTable} onUpdate={noop} />
      </FieldSection>
    </EditorCanvas>
  ),
  parameters: {
    docs: {
      description: {
        story: `
툴바에서 각 버튼을 클릭했을 때 **처음 추가되는 빈 상태**.

점선 테두리의 플레이스홀더 버튼이 표시되며, 버튼 클릭 시 해당 입력 드로어가 열린다.
우측 X 버튼으로 해당 블록을 에디터에서 제거할 수 있다.

- **날짜·시간**: 툴바가 아닌 기록 생성 시 현재 날짜·시간으로 자동 삽입됨
- **텍스트**: 좌측 초록색 세로선이 포커스 시 나타남
- **테이블**: 빈 셀부터 시작해 열/행 추가 가능
        `,
      },
    },
  },
};

export const AllFilled: Story = {
  render: () => (
    <EditorCanvas>
      <FieldSection label="날짜 · 시간">
        <div className="flex gap-4 flex-wrap">
          <DateField date={filledDate} onClick={noop} />
          <TimeField time={filledTime} onClick={noop} />
        </div>
      </FieldSection>

      <FieldSection label="텍스트">
        <ContentField
          value={filledText}
          onChange={noop}
          onRemove={noop}
          isLastContentBlock={false}
        />
      </FieldSection>

      <FieldSection label="사진 (4장)">
        <PhotoField photos={filledPhoto} onClick={noop} onRemove={noop} />
      </FieldSection>

      <FieldSection label="감정">
        <EmotionField emotion={filledEmotion} onClick={noop} onRemove={noop} />
      </FieldSection>

      <FieldSection label="태그">
        <TagField tags={filledTags} onRemove={noop} onAdd={noop} onRemoveField={noop} />
      </FieldSection>

      <FieldSection label="위치">
        <LocationField location={filledLocation} onClick={noop} onRemove={noop} />
      </FieldSection>

      <FieldSection label="별점">
        <RatingField value={filledRating} onClick={noop} onRemove={noop} />
      </FieldSection>

      <FieldSection label="미디어 정보">
        <MediaField data={filledMedia} onClick={noop} onRemove={noop} />
      </FieldSection>

      <FieldSection label="테이블">
        <TableField data={filledTable} onUpdate={noop} />
      </FieldSection>
    </EditorCanvas>
  ),
  parameters: {
    docs: {
      description: {
        story: `
데이터가 입력된 상태. 플레이스홀더 대신 실제 값이 카드·칩 형태로 표시된다.

- **사진**: 최대 3장이 겹쳐 보이고 초과 수는 "+N"으로 표시됨
- **태그**: 최대 4개까지 추가 가능하며, 4개 미만이면 + 버튼으로 더 추가
- **미디어**: 포스터 이미지·제목·종류·연도가 카드로 표시됨
        `,
      },
    },
  },
};

export const DateTimeField: Story = {
  render: () => (
    <EditorCanvas>
      <FieldSection label="빈 상태 (현재 날짜·시간으로 기본값 자동 설정)">
        <div className="flex gap-4">
          <DateField date={emptyDate} onClick={noop} />
          <TimeField time={emptyTime} onClick={noop} />
        </div>
      </FieldSection>
      <FieldSection label="값 있는 상태">
        <div className="flex gap-4">
          <DateField date={filledDate} onClick={noop} />
          <TimeField time={filledTime} onClick={noop} />
        </div>
      </FieldSection>
    </EditorCanvas>
  ),
  parameters: {
    docs: {
      description: {
        story: '날짜·시간 필드 — 기록 생성 시 현재 시각으로 자동 채워지며, 클릭하면 타임피커 드로어가 열린다.',
      },
    },
  },
};

export const TextField: Story = {
  render: () => (
    <EditorCanvas>
      <FieldSection label="빈 상태">
        <ContentField value={emptyText} onChange={noop} onRemove={noop} isLastContentBlock={false} />
      </FieldSection>
      <FieldSection label="내용 있는 상태">
        <ContentField value={filledText} onChange={noop} onRemove={noop} isLastContentBlock={false} />
      </FieldSection>
      <FieldSection label="마지막 텍스트 블록 (삭제 버튼 숨김)">
        <ContentField value={filledText} onChange={noop} onRemove={noop} isLastContentBlock={true} />
      </FieldSection>
    </EditorCanvas>
  ),
  parameters: {
    docs: {
      description: {
        story: '텍스트 블록 — 여러 개 추가할 수 있으며, 마지막 텍스트 블록에는 삭제(X) 버튼이 숨겨진다.',
      },
    },
  },
};

export const PhotoFieldStory: Story = {
  name: 'PhotoField',
  render: () => (
    <EditorCanvas>
      <FieldSection label="빈 상태">
        <PhotoField photos={emptyPhoto} onClick={noop} onRemove={noop} />
      </FieldSection>
      <FieldSection label="사진 4장 (3장 표시 + +1)">
        <PhotoField photos={filledPhoto} onClick={noop} onRemove={noop} />
      </FieldSection>
      <FieldSection label="사진 1장">
        <PhotoField
          photos={{ tempUrls: [filledPhoto.tempUrls![0]], mediaIds: [] }}
          onClick={noop}
          onRemove={noop}
        />
      </FieldSection>
    </EditorCanvas>
  ),
  parameters: {
    docs: {
      description: {
        story: '사진 블록 — 최대 3장이 겹쳐 표시되고 초과분은 "+N"으로 표시된다. 클릭하면 사진 선택 드로어가 열린다.',
      },
    },
  },
};

export const EmotionFieldStory: Story = {
  name: 'EmotionField',
  render: () => (
    <EditorCanvas>
      <FieldSection label="빈 상태">
        <EmotionField emotion={emptyEmotion} onClick={noop} onRemove={noop} />
      </FieldSection>
      <div className="flex flex-wrap gap-3">
        {(['행복', '좋음', '만족', '재미', '피곤', '화남', '슬픔', '보통'] as const).map(
          (mood) => (
            <FieldSection key={mood} label={mood}>
              <EmotionField emotion={{ mood }} onClick={noop} onRemove={noop} />
            </FieldSection>
          ),
        )}
      </div>
    </EditorCanvas>
  ),
  parameters: {
    docs: {
      description: {
        story: '감정 블록 — 선택된 감정에 맞는 이모지와 이름이 표시된다. 클릭하면 감정 선택 드로어가 열린다.',
      },
    },
  },
};

export const TagFieldStory: Story = {
  name: 'TagField',
  render: () => (
    <EditorCanvas>
      <FieldSection label="빈 상태">
        <TagField tags={emptyTags} onRemove={noop} onAdd={noop} onRemoveField={noop} />
      </FieldSection>
      <FieldSection label="태그 2개 (+ 버튼 표시)">
        <TagField
          tags={{ tags: ['성수동', '카페'] }}
          onRemove={noop}
          onAdd={noop}
          onRemoveField={noop}
        />
      </FieldSection>
      <FieldSection label="태그 4개 (최대, + 버튼 숨김)">
        <TagField tags={filledTags.tags.length >= 4 ? filledTags : { tags: ['성수동', '카페', '친구', '주말'] }} onRemove={noop} onAdd={noop} onRemoveField={noop} />
      </FieldSection>
    </EditorCanvas>
  ),
  parameters: {
    docs: {
      description: {
        story: '태그 블록 — 최대 4개까지 추가 가능. 4개 미만이면 + 버튼이 표시되어 태그 추가 드로어를 열 수 있다.',
      },
    },
  },
};

export const RatingFieldStory: Story = {
  name: 'RatingField',
  render: () => (
    <EditorCanvas>
      <FieldSection label="빈 상태">
        <RatingField value={emptyRating} onClick={noop} onRemove={noop} />
      </FieldSection>
      <div className="flex flex-wrap gap-3">
        {([1, 2, 3, 4, 5] as const).map((rating) => (
          <FieldSection key={rating} label={`${rating}점`}>
            <RatingField value={{ rating }} onClick={noop} onRemove={noop} />
          </FieldSection>
        ))}
      </div>
    </EditorCanvas>
  ),
  parameters: {
    docs: {
      description: {
        story: '별점 블록 — 1~5점 범위. 클릭하면 별점 선택 드로어가 열린다.',
      },
    },
  },
};

export const LocationFieldStory: Story = {
  name: 'LocationField',
  render: () => (
    <EditorCanvas>
      <FieldSection label="빈 상태">
        <LocationField location={emptyLocation} onClick={noop} onRemove={noop} />
      </FieldSection>
      <FieldSection label="장소명 있는 상태">
        <LocationField location={filledLocation} onClick={noop} onRemove={noop} />
      </FieldSection>
      <FieldSection label="주소만 있는 상태 (장소명 없음)">
        <LocationField
          location={{ lat: 37.5326, lng: 126.9905, address: '서울 영등포구 여의도동' }}
          onClick={noop}
          onRemove={noop}
        />
      </FieldSection>
    </EditorCanvas>
  ),
  parameters: {
    docs: {
      description: {
        story: '위치 블록 — 장소명이 있으면 장소명을, 없으면 주소를 표시한다. 클릭하면 지도 위치 선택 화면으로 이동한다.',
      },
    },
  },
};

export const MediaFieldStory: Story = {
  name: 'MediaField',
  render: () => (
    <EditorCanvas>
      <FieldSection label="빈 상태">
        <MediaField data={emptyMedia} onClick={noop} onRemove={noop} />
      </FieldSection>
      <FieldSection label="미디어 정보 있는 상태 (이미지 있음)">
        <MediaField data={filledMedia} onClick={noop} onRemove={noop} />
      </FieldSection>
      <FieldSection label="미디어 정보 있는 상태 (이미지 없음)">
        <MediaField
          data={{ title: '오페라의 유령', type: '뮤지컬', externalId: 'phantom', year: '1986' }}
          onClick={noop}
          onRemove={noop}
        />
      </FieldSection>
    </EditorCanvas>
  ),
  parameters: {
    docs: {
      description: {
        story: '미디어 정보 블록 (영화·연극 등) — 포스터 이미지·제목·종류·연도가 카드로 표시된다. 이미지가 없으면 필름 아이콘으로 대체된다.',
      },
    },
  },
};

export const TableFieldStory: Story = {
  name: 'TableField',
  render: () => (
    <EditorCanvas>
      <FieldSection label="2×2 빈 테이블">
        <TableField data={emptyTable} onUpdate={noop} />
      </FieldSection>
      <FieldSection label="3×2 데이터 있는 테이블">
        <TableField data={filledTable} onUpdate={noop} />
      </FieldSection>
    </EditorCanvas>
  ),
  parameters: {
    docs: {
      description: {
        story: '테이블 블록 — 셀을 직접 편집할 수 있으며 최대 4×4까지 행/열을 추가할 수 있다.',
      },
    },
  },
};
