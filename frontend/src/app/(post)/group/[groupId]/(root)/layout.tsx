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
    <main className="w-full h-full flex flex-col gap-4 sm:gap-6 p-4 sm:p-6 pt-0">
      <GroupHeader groupId={groupId} />
      {children}
      <GroupDraftFloating groupId={groupId} />
    </main>
  );
}
