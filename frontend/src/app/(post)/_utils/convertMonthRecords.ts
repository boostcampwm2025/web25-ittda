import { MyMonthlyRecordListResponse } from '@/lib/types/recordResponse';

export const convertMontRecords = (
  monthlyRecords: MyMonthlyRecordListResponse[],
) =>
  monthlyRecords.map((record) => {
    const [y, m] = record.month.split('-');
    return {
      id: record.month,
      name: `${y}년 ${parseInt(m, 10)}월`,
      count: record.count,
      latestTitle: record.latestTitle,
      latestLocation: record.latestLocation ?? '',
      cover: record.coverAssetId
        ? {
            assetId: record.coverAssetId,
            width: 150,
            height: 150,
            mimeType: 'image/jpeg',
          }
        : null,
    };
  });
