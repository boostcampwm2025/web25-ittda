import { DailyRecordList, MonthlyRecordList } from '@/lib/types/recordResponse';

const dayNames = ['일', '월', '화', '수', '목', '금', '토'] as const;

export const convertMontRecords = (monthlyRecords: MonthlyRecordList[]) =>
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

export const convertDayRecords = (dailyRecords: DailyRecordList[]) =>
  dailyRecords.map((record) => {
    const dayIndex = new Date(record.date).getDay();

    return {
      date: record.date,
      dayName: dayNames[dayIndex],
      title: record.latestPostTitle,
      count: record.postCount,
      coverUrl: record.coverAssetId || '/base.png',
    };
  });
