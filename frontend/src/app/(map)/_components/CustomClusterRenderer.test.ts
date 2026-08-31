import { describe, it, expect } from 'vitest';
import type { Cluster } from '@googlemaps/markerclusterer';
import { pickRepresentativeMediaId } from './CustomClusterRenderer';

function buildMarker(
  overrides: { mediaId?: string; createdAt?: string } = {},
): { content: HTMLElement } {
  const el = document.createElement('div');
  if (overrides.mediaId !== undefined) {
    el.dataset.previewMediaId = overrides.mediaId;
  }
  if (overrides.createdAt !== undefined) {
    el.dataset.createdAt = overrides.createdAt;
  }
  return { content: el };
}

function buildCluster(markers: { content: HTMLElement }[]): Cluster {
  return { markers } as unknown as Cluster;
}

describe('pickRepresentativeMediaId', () => {
  it('사진이 있는 마커가 하나도 없으면 null을 반환한다', () => {
    const cluster = buildCluster([
      buildMarker({ createdAt: '2026-01-01T00:00:00.000Z' }),
      buildMarker({ createdAt: '2026-01-02T00:00:00.000Z' }),
    ]);

    expect(pickRepresentativeMediaId(cluster)).toBeNull();
  });

  it('사진이 하나만 있으면 그 사진을 반환한다', () => {
    const cluster = buildCluster([
      buildMarker({ createdAt: '2026-01-01T00:00:00.000Z' }),
      buildMarker({
        mediaId: 'media-2',
        createdAt: '2026-01-02T00:00:00.000Z',
      }),
    ]);

    expect(pickRepresentativeMediaId(cluster)).toBe('media-2');
  });

  it('사진이 여러 장이면 가장 최근(createdAt) 글의 사진을 반환한다', () => {
    const cluster = buildCluster([
      buildMarker({
        mediaId: 'media-old',
        createdAt: '2026-01-01T00:00:00.000Z',
      }),
      buildMarker({
        mediaId: 'media-newest',
        createdAt: '2026-03-01T00:00:00.000Z',
      }),
      buildMarker({
        mediaId: 'media-mid',
        createdAt: '2026-02-01T00:00:00.000Z',
      }),
    ]);

    expect(pickRepresentativeMediaId(cluster)).toBe('media-newest');
  });

  it('클러스터 자체가 비어있으면 null을 반환한다', () => {
    expect(pickRepresentativeMediaId(buildCluster([]))).toBeNull();
  });
});
