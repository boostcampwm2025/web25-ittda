'use client';

import { useQuery } from '@tanstack/react-query';
import { groupMyRoleOptions } from '@/lib/api/group';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/utils/errorHandler';

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
      toast.error(getErrorMessage(error));
      router.replace('/');
    }
  }, [isError, error, router]);

  if (isError) return null;

  return <>{children}</>;
}
