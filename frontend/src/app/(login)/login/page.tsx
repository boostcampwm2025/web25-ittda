import LoginContent from './_components/LoginContent';

interface LoginPageProps {
  searchParams: Promise<{ error?: string; callback?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error, callback } = await searchParams;
  return <LoginContent error={error} callback={callback} />;
}
