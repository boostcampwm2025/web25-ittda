import { QueryClient } from '@tanstack/react-query';
import ProfileEditClient from './_components/ProfileEditClient';
import { getCachedUserProfile } from '@/lib/api/profile';

export default async function ProfileEditPage() {
  const queryClient = new QueryClient();

  if (process.env.NEXT_PUBLIC_MOCK !== 'true') {
    const profile = await getCachedUserProfile();

    // QueryClient에 직접 넣어서 HydrationBoundary로 클라이언트에 전달
    queryClient.setQueryData(['profile', 'me'], profile);
  }

  return (
    <div className="w-full flex flex-col min-h-screen dark:bg-[#121212] dark:text-white bg-white text-itta-black">
      <ProfileEditClient />
    </div>
  );
}
