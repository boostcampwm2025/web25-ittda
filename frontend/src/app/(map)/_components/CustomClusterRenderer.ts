import { Renderer } from '@googlemaps/markerclusterer';

export class CustomClusterRenderer implements Renderer {
  public render(
    { count, position }: { count: number; position: google.maps.LatLng },
    stats: unknown,
    map: google.maps.Map,
  ): google.maps.marker.AdvancedMarkerElement {
    // 게시글 수에 따라 색상 결정 (많을수록 진한 녹색)
    const getColor = (count: number) => {
      if (count < 5) return '#A7F3D0'; // 연한 녹색
      if (count < 10) return '#6EE7B7'; // 중간 연한 녹색
      if (count < 20) return '#34D399'; // 중간 녹색
      if (count < 50) return '#10B981'; // 진한 녹색
      return '#059669'; // 매우 진한 녹색
    };

    const color = getColor(count);

    // Map 아이콘 SVG
    const svg = `
      <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
      </svg>
    `;

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
        width: 56px;
        height: 56px;
        border: 4px solid ${color};
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      ">
        <div style="
          color: #4B5563;
        ">
          ${svg}
        </div>
      </div>
      <div style="
        position: absolute;
        top: -8px;
        right: -8px;
        background-color: #EF4444;
        color: white;
        font-size: 0.75rem;
        font-weight: 700;
        border-radius: 9999px;
        min-width: 24px;
        height: 24px;
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
