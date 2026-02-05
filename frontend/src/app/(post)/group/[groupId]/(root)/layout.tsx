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
    <main className="w-full flex flex-col gap-6 p-6">
      <GroupHeader groupId={groupId} />
      <GroupDraftFloating groupId={groupId} />
      <>
        <div className="flex items-center justify-start px-1">
          <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
            기록 보관함
          </h3>
        </div>

        {children}
      </>
    </main>
  );
}
