import LoginContent from './_components/LoginContent';

interface LoginPageProps {
  searchParams: Promise<{ error?: string; callback?: string; reason?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error, callback, reason } = await searchParams;
  return <LoginContent error={error} callback={callback} reason={reason} />;
}
