import GroupHeader from '../../_components/GroupHeader';
import GroupDraftFloating from '../../_components/GroupDraftFloating';

export default async function GroupRootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;

  return (
    <main className="w-full h-full flex flex-col gap-4 sm:gap-6 p-4 sm:p-6">
      <GroupHeader groupId={groupId} />
      <>
        <div className="flex items-center justify-start px-1">
          <h3 className="text-[9px] sm:text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
            기록 보관함
          </h3>
        </div>

        {children}
      </>
      <GroupDraftFloating groupId={groupId} />
    </main>
  );
}
