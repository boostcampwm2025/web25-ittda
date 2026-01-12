import DateSelectorDrawer from '@/components/DateSelectorDrawer';

export default function MyRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="w-full flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight dark:text-white text-[#222222]">
          내 기록함
        </h2>
        <DateSelectorDrawer
          dayRoute="/my/detail"
          monthRoute="/my/month"
          yearRoute="/my/year"
        />
      </div>
      {children}
    </main>
  );
}
