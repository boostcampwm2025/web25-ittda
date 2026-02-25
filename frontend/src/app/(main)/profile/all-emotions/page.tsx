import ProfileAllEmotionsHeaderActions from './_components/ProfileAllEmotionsHeaderActions';
import AllEmotionsData from './_components/AllEmotionsData';
import AllEmotionsSkeleton from './_components/AllEmotionsSkeleton';
import { Suspense } from 'react';

export default function ProfileAllEmotionsPage() {
  return (
    <div className="w-full pb-20 flex flex-col min-h-screen dark:bg-[#121212] dark:text-white bg-white text-itta-black">
      <ProfileAllEmotionsHeaderActions />
      <Suspense fallback={<AllEmotionsSkeleton />}>
        <AllEmotionsData />
      </Suspense>
    </div>
  );
}
