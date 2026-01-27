import LoginContent from './_components/LoginContent';

interface LoginPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams;
  return <LoginContent error={error} />;
}
