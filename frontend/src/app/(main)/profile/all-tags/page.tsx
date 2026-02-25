import ProfileAllTagsHeaderActions from './_components/ProfileAllTagsHeaderActions';
import AllTagsData from './_components/AllTagsData';
import AllTagsSkeleton from './_components/AllTagsSkeleton';
import { Suspense } from 'react';

export default function ProfileAllTagsPage() {
  return (
    <div className="w-full pb-20 flex flex-col min-h-screen dark:bg-[#121212] dark:text-white bg-white text-itta-black">
      <ProfileAllTagsHeaderActions />
      <Suspense fallback={<AllTagsSkeleton />}>
        <AllTagsData />
      </Suspense>
    </div>
  );
}
