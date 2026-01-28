import { useState, useEffect } from 'react';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  loading: boolean;
  error: string | null;
}

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  reverseGeocode?: boolean; // 역지오코딩 활성화 여부
}

/**
 * 사용자의 현재 위치를 가져오는 커스텀 훅
 *
 * @param options - Geolocation API 옵션
 * @returns 위치 정보 (위도, 경도, 주소, 로딩 상태, 에러)
 *
 * @example
 * ```tsx
 * const { latitude, longitude, address, loading, error } = useGeolocation({
 *   reverseGeocode: true
 * });
 *
 * if (loading) return <div>위치 가져오는 중...</div>;
 * if (error) return <div>에러: {error}</div>;
 *
 * return <div>{address || `${latitude}, ${longitude}`}</div>;
 * ```
 */
export function useGeolocation(options: UseGeolocationOptions = {}) {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 0,
    reverseGeocode = true,
  } = options;

  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    address: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    // Geolocation API 지원 여부 확인
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: '브라우저가 위치 정보를 지원하지 않습니다.',
      }));
      return;
    }

    // 현재 위치 가져오기
    const handleSuccess = async (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;

      setState((prev) => ({
        ...prev,
        latitude,
        longitude,
        loading: reverseGeocode, // 역지오코딩 중이면 계속 로딩
      }));

      // 역지오코딩 (좌표 → 주소)
      if (reverseGeocode) {
        try {
          const address = await reverseGeocodeAddress(latitude, longitude);
          setState((prev) => ({
            ...prev,
            address,
            loading: false,
          }));
        } catch (error) {
          console.error('역지오코딩 실패:', error);
          // 역지오코딩 실패해도 좌표는 표시
          setState((prev) => ({
            ...prev,
            address: null,
            loading: false,
            // 좌표는 이미 설정되어 있으므로 에러를 null로 유지
          }));
        }
      } else {
        setState((prev) => ({
          ...prev,
          loading: false,
        }));
      }
    };

    const handleError = (error: GeolocationPositionError) => {
      let errorMessage = '위치 정보를 가져올 수 없습니다.';

      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = '위치 권한이 거부되었습니다.';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = '위치 정보를 사용할 수 없습니다.';
          break;
        case error.TIMEOUT:
          errorMessage = '위치 정보 요청 시간이 초과되었습니다.';
          break;
      }

      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
    };

    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy,
      timeout,
      maximumAge,
    });
  }, [enableHighAccuracy, timeout, maximumAge, reverseGeocode]);

  return state;
}

/**
 * Google Maps JavaScript API의 Geocoder를 사용하여 좌표를 주소로 변환
 * (리퍼러 제한이 있는 API 키로도 작동)
 */
export async function reverseGeocodeAddress(
  latitude: number,
  longitude: number,
): Promise<string> {
  // Google Maps API가 로드될 때까지 대기
  await waitForGoogleMaps();

  // API가 로드되지 않았으면 에러
  if (typeof google === 'undefined' || !google.maps) {
    throw new Error('Google Maps API failed to load');
  }

  return new Promise((resolve, reject) => {
    const geocoder = new google.maps.Geocoder();
    const latlng = { lat: latitude, lng: longitude };

    geocoder.geocode(
      { location: latlng, language: 'ko' },
      (results, status) => {
        if (status === 'OK' && results && results.length > 0) {
          const addressComponents = results[0].address_components;

          // 시/도, 동 정보 추출
          const city = addressComponents.find(
            (c) =>
              c.types.includes('locality') ||
              c.types.includes('administrative_area_level_1'),
          )?.long_name;

          const neighborhood = addressComponents.find(
            (c) =>
              c.types.includes('sublocality_level_2') ||
              c.types.includes('sublocality_level_3') ||
              c.types.includes('sublocality_level_4'),
          )?.long_name;

          // 주소 조합 (시, 동만 표시, 중복 제거)
          const parts = [city, neighborhood].filter(
            (part, index, array) => part && array.indexOf(part) === index, // 중복 제거
          );
          resolve(parts.join(' ') || results[0].formatted_address);
        } else {
          console.error('Geocoding failed:', status);
          reject(new Error(`Geocoding failed with status: ${status}`));
        }
      },
    );
  });
}

/**
 * Google Maps API가 로드될 때까지 대기
 */
function waitForGoogleMaps(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof google !== 'undefined' && google.maps) {
      resolve();
      return;
    }

    const checkInterval = setInterval(() => {
      if (typeof google !== 'undefined' && google.maps) {
        clearInterval(checkInterval);
        resolve();
      }
    }, 100);

    // 10초 후 타임아웃
    setTimeout(() => {
      clearInterval(checkInterval);
      resolve();
    }, 10000);
  });
}
