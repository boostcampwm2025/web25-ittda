export default function RecordLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen flex flex-col p-6 space-y-8 pb-24 transition-colors duration-300 dark:bg-[#121212] bg-[#FDFDFD]">
      {children}
    </div>
  );
}
