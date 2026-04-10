import { reverseGeocodeAddress } from '@/hooks/useGeolocation';
import * as exifr from 'exifr';

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
// EXIF 데이터를 포함할 수 있는 포맷만 파싱 시도
const EXIF_SUPPORTED_TYPES = ['image/jpeg', 'image/jpg', 'image/tiff', 'image/heic', 'image/heif'];

export async function extractExifMetadata(file: File): Promise<ExifMetadata> {
  // 지원하지 않는 포맷은 파싱 없이 즉시 반환 (PNG, WebP 등은 EXIF가 없음)
  if (file.type && !EXIF_SUPPORTED_TYPES.includes(file.type.toLowerCase())) {
    return { hasMetadata: false };
  }

  try {
    const exifData = await exifr.parse(file, {
      gps: true,
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
  } catch {
    // EXIF 파싱 실패는 정상 케이스 (EXIF 없는 이미지, 미지원 포맷 등)
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
  } catch {
    // EXIF 파싱 실패는 정상 케이스
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
