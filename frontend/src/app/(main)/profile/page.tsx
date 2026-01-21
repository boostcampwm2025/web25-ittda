import { ProfileTag, TagStatSummary } from '@/lib/types/profile';
import Profile from './_components/Profile';
import ProfileHeaderActions from './_components/ProfileHeaderActions';
import TagDashboard from './_components/TagDashboard';
import Setting from './_components/Setting';
import RecordStatistics from './_components/RecordStatistics';
import { QueryClient } from '@tanstack/react-query';
import {
  userProfileEmotionSummaryOptions,
  userProfileTagSummaryOptions,
} from '@/lib/api/profile';
import { createMockTagStats } from '@/lib/mocks/mock';

export default async function ProfilePage() {
  let tagStats: TagStatSummary;

  if (process.env.NEXT_PUBLIC_MOCK === 'true') {
    tagStats = createMockTagStats();
  } else {
    const queryClient = new QueryClient();
    tagStats = await queryClient.fetchQuery(userProfileTagSummaryOptions());

    // TODO: Promise.all로 월별 사용 그래프, 방문 장소 통계를 같이 호출
    await queryClient.prefetchQuery(userProfileEmotionSummaryOptions());
  }

  const tags: ProfileTag = {
    recent: tagStats.recentTop,
    frequent: tagStats.allTimeTop,
    all: [...tagStats.recentTop, ...tagStats.allTimeTop],
  };

  return (
    <div className="w-full flex flex-col min-h-screen pb-25 dark:bg-[#121212] bg-[#F9F9F9]">
      <ProfileHeaderActions />
      <div className="p-5 space-y-5">
        <Profile />
        <TagDashboard tags={tags} />
        <RecordStatistics />
        <Setting />
      </div>
    </div>
  );
}
