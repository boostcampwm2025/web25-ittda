import { Cluster, ClusterStats, Renderer } from '@googlemaps/markerclusterer';

// 클러스터에 속한 마커들의 content(PinMarker가 심어둔 data attribute)에서
// "사진이 있는 것 중 가장 최근" 하나를 골라 대표 사진으로 쓴다.
// 클러스터에 사진이 하나도 없으면 null — 기존 아이콘 폴백을 그대로 쓴다.
export function pickRepresentativeMediaId(cluster: Cluster): string | null {
  let latestMediaId: string | null = null;
  let latestCreatedAt = -Infinity;

  for (const marker of cluster.markers ?? []) {
    if (!('content' in marker) || !marker.content) continue;
    const el = marker.content as HTMLElement;
    const node = el.matches?.('[data-preview-media-id]')
      ? el
      : el.querySelector<HTMLElement>('[data-preview-media-id]');
    const mediaId = node?.dataset.previewMediaId;
    if (!mediaId) continue;

    const createdAt = new Date(node?.dataset.createdAt ?? '').getTime();
    const comparableCreatedAt = Number.isNaN(createdAt) ? 0 : createdAt;
    if (comparableCreatedAt >= latestCreatedAt) {
      latestCreatedAt = comparableCreatedAt;
      latestMediaId = mediaId;
    }
  }

  return latestMediaId;
}

export class CustomClusterRenderer implements Renderer {
  public render(
    cluster: Cluster,
    stats: ClusterStats,
    map: google.maps.Map,
  ): google.maps.marker.AdvancedMarkerElement {
    const { count, position } = cluster;

    // 게시글 수에 따라 색상 결정 (많을수록 진한 녹색)
    const getColor = (count: number) => {
      if (count < 5) return '#A7F3D0'; // 연한 녹색
      if (count < 10) return '#6EE7B7'; // 중간 연한 녹색
      if (count < 20) return '#34D399'; // 중간 녹색
      if (count < 50) return '#10B981'; // 진한 녹색
      return '#059669'; // 매우 진한 녹색
    };

    const color = getColor(count);
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    const size = isMobile ? 46 : 62;
    const badgeOffset = isMobile ? -6 : -8;
    const badgeSize = isMobile ? 20 : 24;
    const badgeFontSize = isMobile ? '0.65rem' : '0.75rem';

    // Map 아이콘 SVG (클러스터 안에 사진이 하나도 없을 때의 폴백)
    const iconSize = isMobile ? 18 : 22;
    const svg = `
      <svg width="${iconSize}" height="${iconSize}" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
      </svg>
    `;

    // 클러스터 안에서 사진이 있는 것 중 가장 최근 글의 사진을 대표로 쓴다.
    // AssetImage가 내부적으로 쓰는 것과 동일한 프록시 경로
    const representativeMediaId = pickRepresentativeMediaId(cluster);
    const inner = representativeMediaId
      ? `<img
          src="/api/media-image/${representativeMediaId}"
          alt=""
          style="width: 100%; height: 100%; object-fit: cover; transform: rotate(45deg) scale(1.25);"
        />`
      : `<div style="color: #4B5563;">${svg}</div>`;

    // 컨테이너 생성
    const content = document.createElement('div');
    content.style.position = 'relative';
    content.style.cursor = 'pointer';

    content.innerHTML = `
      <div style="
        display: flex;
        justify-content: center;
        align-items: center;
        position: relative;
        background-color: white;
        border-radius: 9999px 9999px 9999px 0;
        transform: rotate(-45deg);
        overflow: hidden;
        transition: all 300ms;
        width: ${size}px;
        height: ${size}px;
        border: 4px solid ${color};
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      ">
        ${inner}
      </div>
      <div style="
        position: absolute;
        top: ${badgeOffset}px;
        right: ${badgeOffset}px;
        background-color: #EF4444;
        color: white;
        font-size: ${badgeFontSize};
        font-weight: 700;
        border-radius: 9999px;
        min-width: ${badgeSize}px;
        height: ${badgeSize}px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 6px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        z-index: 10;
      ">
        ${count}
      </div>
    `;

    // 대표 사진 로드 실패 시 아이콘 폴백으로 교체 (image asset이 만료/삭제된 예외 상황 대비)
    if (representativeMediaId) {
      const img = content.querySelector('img');
      if (img) {
        img.onerror = () => {
          img.outerHTML = `<div style="color: #4B5563;">${svg}</div>`;
        };
      }
    }

    // AdvancedMarkerElement 생성
    const marker = new google.maps.marker.AdvancedMarkerElement({
      position,
      map,
      content,
      zIndex: 1000 + count,
    });

    return marker;
  }
}
