import OnboardingContent from './_components/OnboardingContent';

interface OnboardingPageProps {
  searchParams: Promise<{ callback?: string }>;
}

export default async function OnboardingPage({
  searchParams,
}: OnboardingPageProps) {
  const { callback } = await searchParams;
  return <OnboardingContent callback={callback} />;
}
