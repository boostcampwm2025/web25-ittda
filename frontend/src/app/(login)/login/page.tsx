import LoginContent from './_components/LoginContent';

interface LoginPageProps {
  searchParams: Promise<{
    error?: string;
    callback?: string;
    reason?: string;
    forceAccountSelect?: string;
  }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error, callback, reason, forceAccountSelect } = await searchParams;
  return (
    <LoginContent
      error={error}
      callback={callback}
      reason={reason}
      forceAccountSelect={forceAccountSelect === 'true'}
    />
  );
}
