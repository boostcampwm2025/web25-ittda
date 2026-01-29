export default async function GroupNotificationPage() {
  if (process.env.NEXT_PUBLIC_MOCK !== 'true') {
    // const groupList = await getCachedGroupList();
    // QueryClient에 직접 넣어서 HydrationBoundary로 클라이언트에 전달
    // queryClient.setQueryData(['shared'], groupList);
  }

  return <div className="w-full flex flex-col gap-6">알림 내역</div>;
}
