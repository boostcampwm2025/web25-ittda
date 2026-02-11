import {
  EmotionStatSummary,
  ProfileTag,
  TagStatSummary,
} from '@/lib/types/profile';
import Profile from './_components/Profile';
import ProfileHeaderActions from './_components/ProfileHeaderActions';
import TagDashboard from './_components/TagDashboard';
import Setting from './_components/Setting';
import RecordStatistics from './_components/RecordStatistics';
import {
  getCachedUserEmotionSummary,
  getCachedUserTagSummary,
} from '@/lib/api/profile';
import { createMockTagStats } from '@/lib/mocks/mock';
import { getCachedMyMonthlyRecordList } from '@/lib/api/my';
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { MonthlyRecordList } from '@/lib/types/recordResponse';

export default async function ProfilePage() {
  let tagStats: TagStatSummary;
  let emotionStats: EmotionStatSummary;
  let monthlyRecordList: MonthlyRecordList[];
  const queryClient = new QueryClient();

  if (process.env.NEXT_PUBLIC_MOCK === 'true') {
    tagStats = createMockTagStats();
  } else {
    const year = String(new Date().getFullYear());
    [tagStats, emotionStats, monthlyRecordList] = await Promise.all([
      getCachedUserTagSummary(10),
      getCachedUserEmotionSummary(10),
      getCachedMyMonthlyRecordList(year),
    ]);

    // QueryClient에 직접 넣어서 HydrationBoundary로 클라이언트에 전달
    queryClient.setQueryData(['profile', 'tags', 'summary'], tagStats);
    queryClient.setQueryData(['profile', 'emotions', 'summary'], emotionStats);
    queryClient.setQueryData(
      ['my', 'records', 'month', year],
      monthlyRecordList,
    );
  }

  const allTags = [...tagStats.recentTags, ...tagStats.frequentTags];

  const uniqueAll = Array.from(
    new Map(allTags.map((item) => [item.tag, item])).values(),
  );

  const tags: ProfileTag = {
    recent: tagStats.recentTags,
    frequent: tagStats.frequentTags,
    all: uniqueAll,
  };

  return (
    <div className="w-full flex flex-col min-h-screen pb-25 dark:bg-[#121212] bg-[#F9F9F9]">
      <ProfileHeaderActions />
      <div className="p-4 sm:p-5 space-y-4 sm:space-y-5">
        <Profile />
        <HydrationBoundary state={dehydrate(queryClient)}>
          <TagDashboard tags={tags} />
          <RecordStatistics />
        </HydrationBoundary>
        <Setting />
      </div>
    </div>
  );
}
