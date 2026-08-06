import ErrorHandlingWrapper from '@/components/ErrorHandlingWrapper';
import { RecordErrorFallback } from './RecordErrorFallback';
import RecordDetail from './RecordDetail';
import RecordDetailSkeleton from './RecordDetailSkeleton';

interface RecordDetailContentProps {
  recordId: string;
  groupId?: string;
}

export default function RecordDetailContent({
  recordId,
  groupId,
}: RecordDetailContentProps) {
  return (
    <ErrorHandlingWrapper
      fallbackComponent={RecordErrorFallback}
      suspenseFallback={<RecordDetailSkeleton />}
    >
      <RecordDetail recordId={recordId} groupId={groupId} />
    </ErrorHandlingWrapper>
  );
}
