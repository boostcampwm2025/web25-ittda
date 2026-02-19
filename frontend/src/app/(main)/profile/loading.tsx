import ProfilePageSkeleton from './_components/ProfilePageSkeleton';
import ProfileHeaderActions from './_components/ProfileHeaderActions';

export default function ProfileLoading() {
  return (
    <div className="w-full flex flex-col min-h-screen pb-25 dark:bg-[#121212] bg-[#F9F9F9]">
      <ProfileHeaderActions />
      <div className="p-4 sm:p-5 space-y-4 sm:space-y-5">
        <ProfilePageSkeleton />
      </div>
    </div>
  );
}
