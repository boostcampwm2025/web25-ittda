'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface DateDetailHeaderActionsProps {
  routePath: string;
}

export default function DateDetailHeaderActions({
  routePath,
}: DateDetailHeaderActionsProps) {
  const router = useRouter();

  const handleBack = () => {
    router.push(routePath);
  };

  return (
    <button
      onClick={handleBack}
      className="cursor-pointer p-1 -ml-1 active:scale-90 transition-transform"
    >
      <ArrowLeft className="w-6 h-6 dark:text-white text-itta-black" />
    </button>
  );
}
