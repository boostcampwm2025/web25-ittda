import { describe, it, expect, vi, afterEach } from 'vitest';

const exifrParseMock = vi.fn();
vi.mock('exifr', () => ({
  parse: (...args: unknown[]) => exifrParseMock(...args),
}));

const reverseGeocodeMock = vi.fn();
vi.mock('@/hooks/useGeolocation', () => ({
  reverseGeocodeAddress: (...args: unknown[]) => reverseGeocodeMock(...args),
}));

import {
  extractExifMetadata,
  extractMultipleExifMetadata,
} from './exifExtractor';

function makeFile(type: string) {
  return new File(['content'], 'photo', { type });
}

describe('extractExifMetadata', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('EXIF를 지원하지 않는 포맷(PNG)이면 파싱 없이 즉시 반환한다', async () => {
    const result = await extractExifMetadata(makeFile('image/png'));

    expect(result).toEqual({ hasMetadata: false });
    expect(exifrParseMock).not.toHaveBeenCalled();
  });

  it('EXIF 데이터가 없으면 hasMetadata: false를 반환한다', async () => {
    exifrParseMock.mockResolvedValue(null);

    const result = await extractExifMetadata(makeFile('image/jpeg'));

    expect(result).toEqual({ hasMetadata: false });
  });

  it('날짜 정보가 있으면 date/time을 채운다', async () => {
    exifrParseMock.mockResolvedValue({
      DateTimeOriginal: new Date('2024-06-15T09:05:00'),
    });

    const result = await extractExifMetadata(makeFile('image/jpeg'));

    expect(result.hasMetadata).toBe(true);
    expect(result.date).toBe('2024-06-15');
    expect(result.time).toBe('09:05');
  });

  it('GPS 정보가 있고 역지오코딩에 성공하면 location을 채운다', async () => {
    exifrParseMock.mockResolvedValue({ latitude: 37.5, longitude: 127.0 });
    reverseGeocodeMock.mockResolvedValue('서울특별시 강남구');

    const result = await extractExifMetadata(makeFile('image/jpeg'));

    expect(result.hasMetadata).toBe(true);
    expect(result.location).toEqual({
      latitude: 37.5,
      longitude: 127.0,
      address: '서울특별시 강남구',
    });
  });

  it('GPS 정보는 있지만 역지오코딩에 실패하면 주소 없이 좌표만 채운다', async () => {
    exifrParseMock.mockResolvedValue({ latitude: 37.5, longitude: 127.0 });
    reverseGeocodeMock.mockRejectedValue(new Error('geocode 실패'));

    const result = await extractExifMetadata(makeFile('image/jpeg'));

    expect(result.location).toEqual({
      latitude: 37.5,
      longitude: 127.0,
      address: '',
    });
  });

  it('파싱 중 예외가 발생하면 hasMetadata: false를 반환한다', async () => {
    exifrParseMock.mockRejectedValue(new Error('parse 실패'));

    const result = await extractExifMetadata(makeFile('image/jpeg'));

    expect(result).toEqual({ hasMetadata: false });
  });
});

describe('extractMultipleExifMetadata', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('여러 파일의 메타데이터를 병렬로 추출해 파일과 함께 반환한다', async () => {
    exifrParseMock
      .mockResolvedValueOnce({ DateTimeOriginal: new Date('2024-01-01T00:00:00') })
      .mockResolvedValueOnce(null);

    const files = [makeFile('image/jpeg'), makeFile('image/jpeg')];
    const results = await extractMultipleExifMetadata(files);

    expect(results).toHaveLength(2);
    expect(results[0].file).toBe(files[0]);
    expect(results[0].metadata.hasMetadata).toBe(true);
    expect(results[1].metadata).toEqual({ hasMetadata: false });
  });
});
