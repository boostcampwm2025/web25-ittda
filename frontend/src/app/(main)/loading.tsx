import HomePageSkeleton from './_components/HomePageSkeleton';

function WeekCalendarSkeleton() {
  return (
    <>
      <div className="flex flex-col gap-2 px-2 py-2 sm:px-6 sm:py-4 animate-pulse self-start">
        <div className="mb-2 h-4 sm:h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
      <div className="mx-2 mb-2 sm:mx-6 h-13.5 sm:h-14.5 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
    </>
  );
}

export default function Loading() {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <WeekCalendarSkeleton />
      <HomePageSkeleton />
    </div>
  );
}
