export default function MyRecordsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="p-6 space-y-8 pb-32 transition-colors duration-300 min-h-full dark:bg-[#121212] bg-[#FDFDFD]">
      {children}
    </div>
  );
}
