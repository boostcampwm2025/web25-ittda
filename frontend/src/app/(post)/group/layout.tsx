export default function GroupMonthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="pt-0 w-full space-y-8 pb-32 transition-colors duration-300 min-h-full dark:bg-[#121212] bg-[#FDFDFD]">
      {children}
    </div>
  );
}
