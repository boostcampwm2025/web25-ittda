'use client';

import { useSearchParams } from 'next/navigation';
import RecordMapContent from '../_components/RecordMapContent';

export default function RecordMapPage() {
  const searchParams = useSearchParams();
  const scope =
    (searchParams.get('scope') as 'personal' | 'group') || 'personal';
  const groupId = searchParams.get('groupId') || undefined;

  return <RecordMapContent scope={scope} groupId={groupId} />;
}
