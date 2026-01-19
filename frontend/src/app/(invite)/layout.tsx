export default function InviteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="flex flex-col min-h-screen w-full transition-colors duration-300 dark:bg-[#121212] dark:text-white bg-white text-itta-black">
      {children}
    </main>
  );
}
