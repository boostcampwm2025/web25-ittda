import WeekCalendar from './_components/WeekCalendar';

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="flex flex-col min-h-full w-full transition-colors duration-300 dark:bg-[#121212] dark:text-white bg-white text-itta-black">
      <WeekCalendar />
      <div className="flex-1 w-full p-5 space-y-6 pb-30 transition-colors duration-300 dark:bg-[#121212] bg-[#F9F9F9]">
        {children}
      </div>
    </main>
  );
}
