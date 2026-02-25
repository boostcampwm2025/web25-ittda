import ProfileHeaderActions from './_components/ProfileHeaderActions';
import ProfileData from './_components/ProfileData';
import ProfilePageSkeleton from './_components/ProfilePageSkeleton';
import { Suspense } from 'react';

export default function ProfilePage() {
  return (
    <div className="w-full flex flex-col h-full pb-25 dark:bg-[#121212] bg-[#F9F9F9]">
      <ProfileHeaderActions />
      <div className="p-4 sm:p-5 space-y-4 sm:space-y-5">
        <Suspense fallback={<ProfilePageSkeleton />}>
          <ProfileData />
        </Suspense>
      </div>
    </div>
  );
}
