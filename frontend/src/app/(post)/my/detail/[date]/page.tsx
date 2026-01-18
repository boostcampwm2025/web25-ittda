import DailyDetailRecords from '../../../../../components/DailyDetailRecords';
import DailyDetailFloatingActions from '@/app/(post)/_components/DailyDetailFloatingActions';
import Back from '@/components/Back';
import { QueryClient } from '@tanstack/react-query';
import { recordPreviewListOptions } from '@/lib/api/records';
import { formatDateISO } from '@/lib/date';
import { RecordPreview } from '@/lib/types/recordResponse';

interface MyMonthlyDetailPageProps {
  params: Promise<{ date: string }>;
}

const createMockRecordPreviews = (date: string): RecordPreview[] => [
  // 기록 1: 이미지 먼저, 태그/평점 2열, 텍스트, 날짜/시간 2열
  {
    postId: '225f4bd7-3bbc-4a71-8747-fe6a43dc3d6c',
    scope: 'ME',
    groupId: null,
    title: '성수동 팝업스토어 방문',
    eventAt: `${date}T13:30:00Z`,
    createdAt: `${date}T14:00:00Z`,
    updatedAt: `${date}T14:00:00Z`,
    location: {
      lat: 37.5445,
      lng: 127.0567,
      address: '서울 성동구 성수동2가',
      placeName: '성수동 팝업스토어',
    },
    tags: ['popup', 'seongsu', 'weekend'],
    rating: 4,
    block: [
      {
        id: 'image-block-1',
        type: 'IMAGE',
        value: {
          tempUrls: [
            'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&q=80&w=800',
          ],
        },
        layout: { row: 1, col: 1, span: 2 },
      },
      {
        id: 'tag-block-1',
        type: 'TAG',
        value: { tags: ['popup', 'seongsu', 'weekend'] },
        layout: { row: 2, col: 1, span: 1 },
      },
      {
        id: 'rating-block-1',
        type: 'RATING',
        value: { rating: 4 },
        layout: { row: 2, col: 2, span: 1 },
      },
      {
        id: 'text-block-1',
        type: 'TEXT',
        value: {
          text: '오늘 성수동 팝업스토어 다녀왔다! 한정판 굿즈도 득템 성공',
        },
        layout: { row: 3, col: 1, span: 2 },
      },
      {
        id: 'date-block-1',
        type: 'DATE',
        value: { date },
        layout: { row: 4, col: 1, span: 1 },
      },
      {
        id: 'time-block-1',
        type: 'TIME',
        value: { time: '13:30' },
        layout: { row: 4, col: 2, span: 1 },
      },
    ],
  },
  // 기록 2: 평점만 전체 너비, 위치, 이미지 2장
  {
    postId: 'b3c7e8f1-2a45-4d89-9c12-abc123def456',
    scope: 'ME',
    groupId: null,
    title: '한남동 브런치 맛집',
    eventAt: `${date}T11:00:00Z`,
    createdAt: `${date}T12:30:00Z`,
    updatedAt: `${date}T12:30:00Z`,
    location: {
      lat: 37.5347,
      lng: 127.0008,
      address: '서울 용산구 한남동',
      placeName: '카페 라떼',
    },
    tags: ['brunch', 'hannam', 'cafe'],
    rating: 5,
    block: [
      {
        id: 'rating-block-2',
        type: 'RATING',
        value: { rating: 5 },
        layout: { row: 1, col: 1, span: 2 },
      },
      {
        id: 'loc-block-2',
        type: 'LOCATION',
        value: {
          lat: 37.5347,
          lng: 127.0008,
          address: '서울 용산구 한남동',
          placeName: '카페 라떼',
        },
        layout: { row: 2, col: 1, span: 2 },
      },
      {
        id: 'image-block-2',
        type: 'IMAGE',
        value: {
          tempUrls: [
            'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=800',
            'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=800',
          ],
        },
        layout: { row: 3, col: 1, span: 2 },
      },
      {
        id: 'text-block-2',
        type: 'TEXT',
        value: {
          text: '한남동 새로 생긴 브런치 카페! 에그 베네딕트가 정말 맛있었다',
        },
        layout: { row: 4, col: 1, span: 2 },
      },
    ],
  },
  // 기록 3: 텍스트 먼저, 날짜/위치 2열, 태그 전체 너비
  {
    postId: 'c9d8e7f6-5b34-4c21-8a09-fed987cba654',
    scope: 'GROUP',
    groupId: 'group-123',
    title: '홍대 버스킹 구경',
    eventAt: `${date}T19:00:00Z`,
    createdAt: `${date}T21:00:00Z`,
    updatedAt: `${date}T21:00:00Z`,
    location: {
      lat: 37.5563,
      lng: 126.9236,
      address: '서울 마포구 서교동',
      placeName: '홍대 걷고싶은거리',
    },
    tags: ['busking', 'hongdae', 'music', 'nightlife'],
    rating: 4,
    block: [
      {
        id: 'text-block-3',
        type: 'TEXT',
        value: {
          text: '홍대에서 버스킹 구경했는데 실력이 대박이었음! 다음에 또 와야지',
        },
        layout: { row: 1, col: 1, span: 2 },
      },
      {
        id: 'date-block-3',
        type: 'DATE',
        value: { date },
        layout: { row: 2, col: 1, span: 1 },
      },
      {
        id: 'loc-block-3',
        type: 'LOCATION',
        value: {
          lat: 37.5563,
          lng: 126.9236,
          address: '서울 마포구 서교동',
          placeName: '홍대 걷고싶은거리',
        },
        layout: { row: 2, col: 2, span: 1 },
      },
      {
        id: 'tag-block-3',
        type: 'TAG',
        value: { tags: ['busking', 'hongdae', 'music', 'nightlife'] },
        layout: { row: 3, col: 1, span: 2 },
      },
      {
        id: 'rating-block-3',
        type: 'RATING',
        value: { rating: 4 },
        layout: { row: 4, col: 1, span: 1 },
      },
      {
        id: 'time-block-3',
        type: 'TIME',
        value: { time: '19:00' },
        layout: { row: 4, col: 2, span: 1 },
      },
    ],
  },
];

export default async function MyDateDetailPage({
  params,
}: MyMonthlyDetailPageProps) {
  const { date } = await params;
  const selectedDate = date || formatDateISO();

  const queryClient = new QueryClient();

  // const records = await queryClient.fetchQuery(
  //   recordPreviewListOptions(selectedDate),
  // );

  const records = createMockRecordPreviews(date);

  // TODO: 서버로부터 데이터 받아와야 함
  const recordedDates = ['2025-12-20', '2025-12-21', '2025-12-15'];

  return (
    <div className="-mt-6 min-h-screen transition-colors duration-300 dark:bg-[#121212] bg-[#FDFDFD]">
      <header className="-mx-6 sticky top-0 z-50 backdrop-blur-md p-6 flex items-center justify-between transition-colors duration-300 dark:bg-[#121212]/80 bg-white/80">
        <Back />
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-bold uppercase tracking-widest leading-none mb-1 text-[#10B981]">
            RECORD OF
          </span>
          <span className="text-sm font-bold dark:text-white text-itta-black">
            {date}
          </span>
        </div>
        <div className="w-8" />
      </header>

      <div className="py-6">
        <DailyDetailRecords memories={records} />
        <DailyDetailFloatingActions date={date} recordedDates={recordedDates} />
      </div>
    </div>
  );
}
