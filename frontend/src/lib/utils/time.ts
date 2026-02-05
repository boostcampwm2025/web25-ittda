/**
 * 24시간 형식(HH:mm)을 12시간 형식(오전/오후 h:mm)으로 변환
 * @example "23:23" -> "오후 11:23"
 * @example "00:15" -> "오전 12:15"
 */
export const convertTo12Hour = (time24: string): string => {
  if (!time24 || !time24.includes(':')) return time24;

  const [hStr, mStr] = time24.split(':');
  let hour = parseInt(hStr, 10);
  const minute = mStr.padStart(2, '0');

  const period = hour >= 12 ? '오후' : '오전';

  // 0시 -> 12시, 13~23시 -> 1~11시로
  hour = hour % 12 === 0 ? 12 : hour % 12;

  return `${period} ${hour}:${minute}`;
};

/**
 * 12시간 형식(오전/오후 h:mm)을 24시간 형식(HH:mm)으로 변환
 * @example "오후 11:23" -> "23:23"
 * @example "오전 12:05" -> "00:05"
 */
export const convertTo24Hour = (time12: string): string => {
  const match = time12.match(/(오전|오후)\s(\d+):(\d+)/);

  if (!match) {
    // 이미 24시간 형식인 경우
    if (/^\d{1,2}:\d{2}$/.test(time12)) {
      const [h, m] = time12.split(':');
      return `${h.padStart(2, '0')}:${m}`;
    }
    return time12;
  }

  const [, period, hStr, mStr] = match;
  let hour = parseInt(hStr, 10);
  const minute = mStr.padStart(2, '0');

  if (period === '오후') {
    // 오후 12시말고 모두 +12
    if (hour !== 12) hour += 12;
  } else {
    // 오전 12시 -> 0시
    if (hour === 12) hour = 0;
  }

  return `${hour.toString().padStart(2, '0')}:${minute}`;
};

// mock 데이터를 위한 임시 유틸 함수
export const getPastDate = (currentDate: string, daysAgo: number) => {
  const date = new Date(currentDate);
  // 현재 날짜에서 daysAgo만큼 차감
  date.setDate(date.getDate() - daysAgo);

  // YYYY-MM-DD 형식으로 변환 (로컬 시간 기준)
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};
