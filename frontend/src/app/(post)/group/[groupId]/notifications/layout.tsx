export default function SharedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="p-6 space-y-8 pb-32 transition-colors duration-300 min-h-full dark:bg-[#121212] bg-[#FDFDFD]">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight dark:text-white text-[#222222]">
          그룹 알림
        </h2>
      </div>

      {children}
    </main>
  );
}
