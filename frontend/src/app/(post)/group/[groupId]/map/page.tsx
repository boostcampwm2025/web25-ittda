'use client';

import { use } from 'react';
import RecordMapContent from '@/app/(map)/_components/RecordMapContent';

interface GroupMapPageProps {
  params: Promise<{ groupId: string }>;
}

export default function GroupMapPage({ params }: GroupMapPageProps) {
  const { groupId } = use(params);

  return <RecordMapContent scope="group" groupId={groupId} />;
}
