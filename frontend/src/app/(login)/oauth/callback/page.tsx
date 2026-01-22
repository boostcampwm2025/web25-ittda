import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import LoginContent from '../../login/_components/LoginContent';
import OAuthCallbackContent from './_components/OAuthCallbackContent';

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
      <OAuthCallbackContent code={code} error={error} />
      <AuthLoadingScreen />
    </>
  );
}
