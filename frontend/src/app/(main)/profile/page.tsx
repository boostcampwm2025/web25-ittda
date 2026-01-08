import { ProfileTag } from '@/lib/types/profile';
import Profile from '../_components/Profile';
import ProfileHeaderActions from '../_components/ProfileHeaderActions';
import TagDashboard from '../_components/TagDashboard';
import Setting from '../_components/Setting';

const tags: ProfileTag = {
  recent: [
    { name: '아침', count: 1 },
    { name: '좋은글', count: 1 },
    { name: '점심', count: 1 },
    { name: '커피', count: 1 },
    { name: '식사', count: 1 },
  ],
  frequent: [
    { name: '산책', count: 12 },
    { name: '성수동', count: 8 },
    { name: '맛집', count: 7 },
    { name: '가족', count: 5 },
    { name: '주말', count: 4 },
  ],
  all: [
    { name: '산책', count: 12 },
    { name: '성수동', count: 8 },
    { name: '맛집', count: 7 },
    { name: '가족', count: 5 },
    { name: '아침', count: 1 },
    { name: '좋은글', count: 1 },
    { name: '점심', count: 1 },
    { name: '커피', count: 1 },
    { name: '식사', count: 1 },
    { name: '주말', count: 4 },
    { name: '독서', count: 3 },
    { name: '영화', count: 6 },
    { name: '데이트', count: 9 },
    { name: '운동', count: 2 },
    { name: '여행', count: 11 },
  ],
};

export default function ProfilePage() {
  return (
    <div className="w-full flex flex-col min-h-screen pb-25 dark:bg-[#121212] bg-[#F9F9F9]">
      <ProfileHeaderActions />
      <div className="p-5 space-y-5">
        {/* 프로필 섹션 */}
        <Profile />
        <TagDashboard tags={tags} />
        <Setting />
      </div>
    </div>
  );
}
