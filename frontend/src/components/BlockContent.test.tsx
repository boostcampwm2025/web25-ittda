import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BlockContent from './BlockContent';
import type { Block } from '@/lib/types/record';

vi.mock('./ImageCarousel', () => ({
  default: ({ images }: { images: string[] }) => (
    <div data-testid="carousel" data-count={images.length} />
  ),
}));

vi.mock('./ImageTileGrid', () => ({
  default: ({ images }: { images: string[] }) => (
    <div data-testid="tile-grid" data-count={images.length} />
  ),
}));

function block(overrides: Partial<Block>): Block {
  return {
    id: 'block-1',
    type: 'TEXT',
    value: { text: '' },
    layout: { row: 0, col: 0, span: 1 },
    ...overrides,
  } as Block;
}

describe('BlockContent', () => {
  it('value가 없으면 아무것도 렌더링하지 않는다', () => {
    const { container } = render(
      <BlockContent block={block({ value: undefined as never })} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('알 수 없는 타입이면 아무것도 렌더링하지 않는다', () => {
    const { container } = render(
      <BlockContent
        block={block({ type: 'UNKNOWN' as never, value: { text: 'x' } })}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('DATE 블록을 렌더링한다', () => {
    render(
      <BlockContent
        block={block({ type: 'DATE', value: { date: '2024-06-15' } })}
      />,
    );
    expect(screen.getByText('2024-06-15')).toBeInTheDocument();
  });

  it('타입은 DATE지만 value 형태가 다르면 아무것도 렌더링하지 않는다', () => {
    const { container } = render(
      <BlockContent block={block({ type: 'DATE', value: { text: 'x' } })} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('TIME 블록을 12시간 형식으로 변환해 렌더링한다', () => {
    render(
      <BlockContent block={block({ type: 'TIME', value: { time: '14:30' } })} />,
    );
    expect(screen.getByText('오후 02:30')).toBeInTheDocument();
  });

  it('TEXT 블록을 렌더링한다', () => {
    render(
      <BlockContent
        block={block({ type: 'TEXT', value: { text: '오늘의 기록' } })}
      />,
    );
    expect(screen.getByText('오늘의 기록')).toBeInTheDocument();
  });

  it('TAG 블록의 태그 목록을 렌더링한다', () => {
    render(
      <BlockContent
        block={block({ type: 'TAG', value: { tags: ['여행', '맛집'] } })}
      />,
    );
    expect(screen.getByText('여행')).toBeInTheDocument();
    expect(screen.getByText('맛집')).toBeInTheDocument();
  });

  it('TAG가 빈 배열이면 아무것도 렌더링하지 않는다', () => {
    const { container } = render(
      <BlockContent block={block({ type: 'TAG', value: { tags: [] } })} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('RATING 블록을 렌더링한다', () => {
    render(
      <BlockContent block={block({ type: 'RATING', value: { rating: 4 } })} />,
    );
    expect(screen.getByText('4 / 5')).toBeInTheDocument();
  });

  it('LOCATION 블록은 placeName이 있으면 placeName을 우선 표시한다', () => {
    render(
      <BlockContent
        block={block({
          type: 'LOCATION',
          value: {
            lat: 0,
            lng: 0,
            address: '서울시 강남구',
            placeName: '스타벅스',
          },
        })}
      />,
    );
    expect(screen.getByText('스타벅스')).toBeInTheDocument();
  });

  it('LOCATION 블록은 placeName이 없으면 address를 표시한다', () => {
    render(
      <BlockContent
        block={block({
          type: 'LOCATION',
          value: { lat: 0, lng: 0, address: '서울시 강남구' },
        })}
      />,
    );
    expect(screen.getByText('서울시 강남구')).toBeInTheDocument();
  });

  it('MOOD 블록을 렌더링한다', () => {
    render(
      <BlockContent block={block({ type: 'MOOD', value: { mood: '행복' } })} />,
    );
    expect(screen.getByText('행복')).toBeInTheDocument();
  });

  it('TABLE 블록을 렌더링한다', () => {
    render(
      <BlockContent
        block={block({
          type: 'TABLE',
          value: { rows: 1, cols: 2, cells: [['A', 'B']] },
        })}
      />,
    );
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
  });

  it('MEDIA 블록을 렌더링한다', () => {
    render(
      <BlockContent
        block={block({
          type: 'MEDIA',
          value: { title: '인터스텔라', type: 'MOVIE', externalId: '1' },
        })}
      />,
    );
    expect(screen.getByText('인터스텔라')).toBeInTheDocument();
    expect(screen.getByText('MOVIE')).toBeInTheDocument();
  });

  describe('IMAGE 블록', () => {
    it('이미지가 없으면 아무것도 렌더링하지 않는다', () => {
      const { container } = render(
        <BlockContent block={block({ type: 'IMAGE', value: {} })} />,
      );
      expect(container).toBeEmptyDOMElement();
    });

    it('resolvedUrls가 있으면 우선 사용한다', () => {
      render(
        <BlockContent
          block={block({
            type: 'IMAGE',
            value: {
              mediaIds: ['m1'],
              tempUrls: ['temp1'],
              resolvedUrls: ['r1', 'r2'],
            },
          })}
          imageLayout="carousel"
        />,
      );
      expect(screen.getByTestId('carousel')).toHaveAttribute(
        'data-count',
        '2',
      );
    });

    it('resolvedUrls가 없으면 mediaIds 기반 proxy URL을 사용한다', () => {
      render(
        <BlockContent
          block={block({
            type: 'IMAGE',
            value: { mediaIds: ['m1', 'm2'], tempUrls: ['temp1'] },
          })}
          imageLayout="carousel"
        />,
      );
      expect(screen.getByTestId('carousel')).toHaveAttribute(
        'data-count',
        '2',
      );
    });

    it('mediaIds도 없으면 tempUrls를 사용한다', () => {
      render(
        <BlockContent
          block={block({
            type: 'IMAGE',
            value: { tempUrls: ['temp1', 'temp2', 'temp3'] },
          })}
          imageLayout="carousel"
        />,
      );
      expect(screen.getByTestId('carousel')).toHaveAttribute(
        'data-count',
        '3',
      );
    });

    it('layout이 tile이면 ImageTileGrid를 렌더링한다', () => {
      render(
        <BlockContent
          block={block({ type: 'IMAGE', value: { tempUrls: ['t1'] } })}
          imageLayout="tile"
        />,
      );
      expect(screen.getByTestId('tile-grid')).toBeInTheDocument();
      expect(screen.queryByTestId('carousel')).toBeNull();
    });

    describe('layout이 responsive이면', () => {
      const originalInnerWidth = window.innerWidth;

      afterEach(() => {
        window.innerWidth = originalInnerWidth;
      });

      it('데스크탑 너비(>=640)면 tile을 사용한다', () => {
        window.innerWidth = 1024;
        render(
          <BlockContent
            block={block({ type: 'IMAGE', value: { tempUrls: ['t1'] } })}
            imageLayout="responsive"
          />,
        );
        expect(screen.getByTestId('tile-grid')).toBeInTheDocument();
      });

      it('모바일 너비(<640)면 carousel을 사용한다', () => {
        window.innerWidth = 375;
        render(
          <BlockContent
            block={block({ type: 'IMAGE', value: { tempUrls: ['t1'] } })}
            imageLayout="responsive"
          />,
        );
        expect(screen.getByTestId('carousel')).toBeInTheDocument();
      });

      it('resize 이벤트에 따라 레이아웃이 전환된다', () => {
        window.innerWidth = 375;
        render(
          <BlockContent
            block={block({ type: 'IMAGE', value: { tempUrls: ['t1'] } })}
            imageLayout="responsive"
          />,
        );
        expect(screen.getByTestId('carousel')).toBeInTheDocument();

        window.innerWidth = 1024;
        fireEvent(window, new Event('resize'));

        expect(screen.getByTestId('tile-grid')).toBeInTheDocument();
        expect(screen.queryByTestId('carousel')).toBeNull();
      });
    });
  });
});
