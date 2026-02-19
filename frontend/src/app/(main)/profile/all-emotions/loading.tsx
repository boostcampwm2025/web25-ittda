import ProfileAllEmotionsHeaderActions from './_components/ProfileAllEmotionsHeaderActions';
import AllEmotionsSkeleton from './_components/AllEmotionsSkeleton';

export default function Loading() {
  return (
    <div className="w-full pb-20 flex flex-col min-h-screen dark:bg-[#121212] dark:text-white bg-white text-itta-black">
      <ProfileAllEmotionsHeaderActions />
      <AllEmotionsSkeleton />
    </div>
  );
}
