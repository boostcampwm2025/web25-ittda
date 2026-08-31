import Back from '@/components/Back';
import StackedNativeHeader from '@/components/StackedNativeHeader';

export default function NotificationsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="pb-bottom-nav transition-colors duration-300 min-h-full dark:bg-[#121212] bg-[#FDFDFD]">
      <StackedNativeHeader className="sticky top-0 z-50 px-4 pt-3 pb-3 transition-all duration-300 dark:bg-[#121212] bg-[#FDFDFD]">
        <div className="flex items-center justify-start gap-2">
          <Back />
          <h2 className="text-base font-bold tracking-tight dark:text-white text-[#222222]">
            그룹 알림
          </h2>
          <div className="w-8" />
        </div>
      </StackedNativeHeader>

      <div className="px-6 pt-4 space-y-4">{children}</div>
    </main>
  );
}
