import { reverseGeocodeAddress } from '@/hooks/useGeolocation';
import * as exifr from 'exifr';
import * as Sentry from '@sentry/nextjs';

export interface ExifMetadata {
  date?: string; // YYYY-MM-DD
  time?: string; // HH:mm
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  hasMetadata: boolean;
}

/**
 * 이미지 파일에서 EXIF 메타데이터를 추출합니다.
 * @param file 이미지 파일
 * @returns EXIF 메타데이터 (날짜, 시간, 위치)
 */
export async function extractExifMetadata(file: File): Promise<ExifMetadata> {
  try {
    // exifr은 gps: true 옵션으로 GPS 좌표를 자동으로 decimal로 변환하여 latitude, longitude 필드로 제공
    // pick 옵션을 사용하지 않으면 필요한 모든 데이터를 효율적으로 파싱

    const exifData = await exifr.parse(file, {
      gps: true, // GPS 데이터를 자동으로 파싱하여 latitude, longitude로 변환
    });

    if (!exifData) {
      return { hasMetadata: false };
    }

    const result: ExifMetadata = { hasMetadata: false };

    // 날짜/시간 추출 (우선순위: DateTimeOriginal > CreateDate > DateTime)
    const dateTime =
      exifData.DateTimeOriginal || exifData.CreateDate || exifData.DateTime;

    if (dateTime) {
      result.hasMetadata = true;
      const date = new Date(dateTime);

      // YYYY-MM-DD 형식
      result.date = date.toISOString().split('T')[0];

      // HH:mm 형식
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      result.time = `${hours}:${minutes}`;
    }

    const lat = exifData.latitude ?? exifData.GPSLatitude;
    const lng = exifData.longitude ?? exifData.GPSLongitude;

    if (lat !== undefined && lng !== undefined && !isNaN(lat) && !isNaN(lng)) {
      result.hasMetadata = true;
      const address = await reverseGeocodeAddress(lat, lng);
      result.location = {
        latitude: lat,
        longitude: lng,
        address,
      };
    }

    return result;
  } catch (error) {
    Sentry.captureException(error, {
      level: 'error',
      tags: {
        context: 'post-editor',
        operation: 'extract-exif-metadata',
      },
    });
    console.error('EXIF 메타데이터 추출 실패:', error);
    return { hasMetadata: false };
  }
}

/**
 * Data URL에서 EXIF 메타데이터를 추출합니다.
 * @param dataUrl Base64 data URL
 * @returns EXIF 메타데이터
 */
export async function extractExifFromDataUrl(
  dataUrl: string,
): Promise<ExifMetadata> {
  try {
    // exifr은 data URL을 직접 파싱할 수 있음
    const exifData = await exifr.parse(dataUrl, {
      gps: true,
    });

    if (!exifData) {
      return { hasMetadata: false };
    }

    const result: ExifMetadata = { hasMetadata: false };

    // 날짜/시간 추출
    const dateTime =
      exifData.DateTimeOriginal || exifData.CreateDate || exifData.DateTime;

    if (dateTime) {
      result.hasMetadata = true;
      const date = new Date(dateTime);
      result.date = date.toISOString().split('T')[0];
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      result.time = `${hours}:${minutes}`;
    }

    // GPS 정보 추출
    const lat = exifData.latitude ?? exifData.GPSLatitude;
    const lng = exifData.longitude ?? exifData.GPSLongitude;

    if (lat !== undefined && lng !== undefined && !isNaN(lat) && !isNaN(lng)) {
      result.hasMetadata = true;
      const address = await reverseGeocodeAddress(lat, lng);
      result.location = {
        latitude: lat,
        longitude: lng,
        address,
      };
    }

    return result;
  } catch (error) {
    Sentry.captureException(error, {
      level: 'error',
      tags: {
        context: 'post-editor',
        operation: 'extract-data-url-exif-metadata',
      },
    });
    console.error('Data URL에서 EXIF 메타데이터 추출 실패:', error);
    return { hasMetadata: false };
  }
}

/**
 * 여러 이미지 파일에서 EXIF 메타데이터를 추출합니다.
 * @param files 이미지 파일 배열
 * @returns 각 파일의 EXIF 메타데이터 배열
 */
export async function extractMultipleExifMetadata(
  files: File[],
): Promise<Array<{ file: File; metadata: ExifMetadata }>> {
  const promises = files.map(async (file) => ({
    file,
    metadata: await extractExifMetadata(file),
  }));

  return Promise.all(promises);
}
