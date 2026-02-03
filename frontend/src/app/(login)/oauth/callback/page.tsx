import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import LoginContent from '../../login/_components/LoginContent';
import OAuthCallbackContent from './_components/OAuthCallbackContent';
import { Suspense } from 'react';

interface OAuthCallbackPageProps {
  searchParams: Promise<{ code?: string; error?: string }>;
}

export default async function OAuthCallbackPage({
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
