import ProfileAllTagsHeaderActions from './_components/ProfileAllTagsHeaderActions';
import AllTagsSkeleton from './_components/AllTagsSkeleton';

export default function Loading() {
  return (
    <div className="w-full pb-20 flex flex-col min-h-screen dark:bg-[#121212] dark:text-white bg-white text-itta-black">
      <ProfileAllTagsHeaderActions />
      <AllTagsSkeleton />
    </div>
  );
}
