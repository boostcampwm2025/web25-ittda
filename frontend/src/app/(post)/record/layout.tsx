export default function RecordLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      className="min-h-screen flex flex-col p-6 space-y-8 transition-colors duration-300 dark:bg-[#121212] bg-[#FDFDFD]"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 6rem)' }}
    >
      {children}
    </div>
  );
}
