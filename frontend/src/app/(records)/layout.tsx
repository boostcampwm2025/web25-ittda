export default function RecordsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="w-full h-screen flex flex-col overflow-y-auto">
      <div className="flex-1">{children}</div>
    </div>
  );
}
