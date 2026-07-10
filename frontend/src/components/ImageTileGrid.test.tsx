import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ImageTileGrid from './ImageTileGrid';

vi.mock('./AssetImage', () => ({
  default: ({
    alt,
    priorityLoad,
  }: {
    alt: string;
    priorityLoad?: boolean;
  }) => (
    <img
      data-testid="asset-image"
      alt={alt}
      data-priority={String(!!priorityLoad)}
    />
  ),
}));

function urls(n: number) {
  return Array.from({ length: n }, (_, i) => `img-${i + 1}`);
}

describe('ImageTileGrid', () => {
  it('이미지가 없으면 아무것도 렌더링하지 않는다', () => {
    const { container } = render(<ImageTileGrid images={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('이미지가 1개면 큰 이미지 1개를 렌더링한다', () => {
    render(<ImageTileGrid images={urls(1)} priorityLoad />);

    const images = screen.getAllByTestId('asset-image');
    expect(images).toHaveLength(1);
    expect(images[0]).toHaveAttribute('data-priority', 'true');
  });

  it('이미지가 2개면 2개를 나란히 렌더링하고 첫 번째만 priority를 받는다', () => {
    render(<ImageTileGrid images={urls(2)} priorityLoad />);

    const images = screen.getAllByTestId('asset-image');
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveAttribute('data-priority', 'true');
    expect(images[1]).toHaveAttribute('data-priority', 'false');
  });

  it('이미지가 3개면 메인 1개 + 서브 2개를 렌더링한다', () => {
    render(<ImageTileGrid images={urls(3)} />);

    const images = screen.getAllByTestId('asset-image');
    expect(images).toHaveLength(3);
    expect(images[0]).toHaveAttribute('alt', '메인 이미지');
  });

  it('이미지가 4개면 2x2로 4개를 모두 렌더링한다', () => {
    render(<ImageTileGrid images={urls(4)} />);

    expect(screen.getAllByTestId('asset-image')).toHaveLength(4);
  });

  it('이미지가 5개면 메인 1개 + 나머지 4개를 렌더링하고 오버레이는 없다', () => {
    render(<ImageTileGrid images={urls(5)} />);

    expect(screen.getAllByTestId('asset-image')).toHaveLength(5);
    expect(screen.queryByText(/^\+\d+$/)).toBeNull();
  });

  it('이미지가 정확히 6개면 6번째까지만 렌더링하고 오버레이는 없다', () => {
    render(<ImageTileGrid images={urls(6)} />);

    expect(screen.getAllByTestId('asset-image')).toHaveLength(6);
    expect(screen.queryByText(/^\+\d+$/)).toBeNull();
  });

  it('이미지가 7개 이상이면 6번째까지만 렌더링하고 남은 개수를 오버레이로 표시한다', () => {
    render(<ImageTileGrid images={urls(10)} />);

    expect(screen.getAllByTestId('asset-image')).toHaveLength(6);
    expect(screen.getByText('+4')).toBeInTheDocument();
  });
});
