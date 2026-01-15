import ErrorHandlingWrapper from '@/components/ErrorHandlingWrapper';
import { RecordErrorFallback } from './RecordErrorFallback';
import RecordDetail from './RecordDetail';
import RecordDetailSkeleton from './RecordDetailSkeleton';

interface RecordDetailContentProps {
  recordId: string;
}

export default function RecordDetailContent({
  recordId,
}: RecordDetailContentProps) {
  return (
    <ErrorHandlingWrapper
      fallbackComponent={RecordErrorFallback}
      suspenseFallback={<RecordDetailSkeleton />}
    >
      <RecordDetail recordId={recordId} />
    </ErrorHandlingWrapper>
  );
}
