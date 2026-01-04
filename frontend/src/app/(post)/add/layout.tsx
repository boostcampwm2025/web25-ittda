export default function AddPostLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="flex flex-col min-h-full w-full transition-colors duration-300 dark:bg-[#121212] dark:text-white bg-white text-itta-black">
      <div className="flex-1 w-full space-y-6 pb-30 transition-colors duration-300 dark:bg-[#121212] bg-white">
        {children}
      </div>
    </main>
  );
}
