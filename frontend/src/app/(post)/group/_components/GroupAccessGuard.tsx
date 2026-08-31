'use client';

import { useQuery } from '@tanstack/react-query';
import { groupMyRoleOptions } from '@/lib/api/group';
import { useRouter } from 'next/navigation';
import { notFound } from 'next/navigation';
import { useEffect } from 'react';
import { ApiError } from '@/lib/utils/errorHandler';
import { showErrorToast } from '@/lib/utils/errorToast';

interface GroupAccessGuardProps {
  groupId: string;
  children: React.ReactNode;
}

export default function GroupAccessGuard({
  groupId,
  children,
}: GroupAccessGuardProps) {
  const router = useRouter();
  const { error, isError } = useQuery(groupMyRoleOptions(groupId));

  useEffect(() => {
    if (isError) {
      const apiError = error as ApiError;
      if (apiError?.code === 'NOT_FOUND') {
        notFound();
      }
      showErrorToast(error);
      router.replace('/shared');
    }
  }, [isError, error, router]);

  if (isError) return null;

  return <>{children}</>;
}
