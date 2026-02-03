import LoginContent from '@/app/(login)/login/_components/LoginContent';
import OAuthCallbackContent from '@/app/(login)/oauth/callback/_components/OAuthCallbackContent';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import { Suspense } from 'react';

interface OAuthCallbackPageProps {
  searchParams: Promise<{ code?: string; error?: string }>;
}

export default async function OAuthCallbackModalPage({
  searchParams,
}: OAuthCallbackPageProps) {
  const { code, error } = await searchParams;

  return (
    <>
      <LoginContent error={error} />
      <Suspense fallback={<AuthLoadingScreen />}>
        <OAuthCallbackContent code={code} error={error} />
      </Suspense>
      <AuthLoadingScreen />
    </>
  );
}
