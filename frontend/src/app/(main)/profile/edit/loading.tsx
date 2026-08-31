import ProfileEditSkeleton from './_components/ProfileEditSkeleton';

export default function Loading() {
  return (
    <div className="w-full flex flex-col min-h-screen dark:bg-[#121212] dark:text-white bg-white text-itta-black">
      <ProfileEditSkeleton />
    </div>
  );
}
