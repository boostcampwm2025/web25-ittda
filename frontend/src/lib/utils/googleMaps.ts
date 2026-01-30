/**
 * 지오코딩 및 장소 검색 관련 유틸리티
 */

// 장소 검색 (키워드 -> 장소 목록)
export const searchPlacesByKeyword = (
  service: google.maps.places.PlacesService,
  query: string,
  location?: google.maps.LatLng,
): Promise<google.maps.places.PlaceResult[]> => {
  return new Promise((resolve, reject) => {
    const request: google.maps.places.TextSearchRequest = {
      query,
      location,
    };

    service.textSearch(request, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        // deprecated 속성 제거하여 경고 방지
        const cleanResults = results.map((result) => {
          const { opening_hours, ...rest } = result;
          return rest;
        });
        resolve(cleanResults);
      } else if (
        status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS
      ) {
        resolve([]);
      } else {
        reject(new Error(`Places Search failed: ${status}`));
      }
    });
  });
};
