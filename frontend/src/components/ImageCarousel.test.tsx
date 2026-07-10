import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ImageCarousel from './ImageCarousel';

function getLightbox() {
  return screen.getByRole('button', { name: '닫기' }).closest('.fixed') as HTMLElement;
}

vi.mock('./AssetImage', () => ({
  default: ({ alt }: { alt: string }) => (
    <img data-testid="asset-image" alt={alt} />
  ),
}));

function urls(n: number) {
  return Array.from({ length: n }, (_, i) => `img-${i + 1}`);
}

describe('ImageCarousel', () => {
  it('이미지가 없으면 아무것도 렌더링하지 않는다', () => {
    const { container } = render(<ImageCarousel images={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  describe('이미지가 1개일 때', () => {
    it('이미지 1개만 렌더링하고 인디케이터는 없다', () => {
      render(<ImageCarousel images={urls(1)} />);

      expect(screen.getAllByTestId('asset-image')).toHaveLength(1);
      expect(screen.queryByLabelText(/Go to image/)).toBeNull();
    });

    it('클릭하면 라이트박스가 열린다', async () => {
      render(<ImageCarousel images={urls(1)} />);

      await userEvent.click(screen.getByTestId('asset-image'));

      expect(within(getLightbox()).getByText('1 / 1')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: '닫기' }),
      ).toBeInTheDocument();
    });

    it('닫기 버튼을 클릭하면 라이트박스가 닫힌다', async () => {
      render(<ImageCarousel images={urls(1)} />);

      await userEvent.click(screen.getByTestId('asset-image'));
      await userEvent.click(screen.getByRole('button', { name: '닫기' }));

      expect(screen.queryByText('1 / 1')).toBeNull();
    });
  });

  describe('이미지가 여러 개일 때', () => {
    it('이미지 개수만큼 렌더링하고 인디케이터도 함께 렌더링한다', () => {
      render(<ImageCarousel images={urls(3)} />);

      expect(screen.getAllByTestId('asset-image')).toHaveLength(3);
      expect(screen.getByLabelText('Go to image 1')).toBeInTheDocument();
      expect(screen.getByLabelText('Go to image 3')).toBeInTheDocument();
      expect(screen.getByText('1 / 3')).toBeInTheDocument();
    });

    it('인디케이터를 클릭하면 해당 인덱스로 이동한다', async () => {
      render(<ImageCarousel images={urls(3)} />);

      await userEvent.click(screen.getByLabelText('Go to image 2'));

      expect(screen.getByText('2 / 3')).toBeInTheDocument();
    });

    it('드래그하지 않고 클릭하면 라이트박스가 열린다', async () => {
      render(<ImageCarousel images={urls(3)} />);

      fireEvent.mouseDown(screen.getAllByTestId('asset-image')[0], {
        clientX: 100,
      });
      fireEvent.mouseUp(screen.getAllByTestId('asset-image')[0]);
      fireEvent.click(screen.getAllByTestId('asset-image')[0]);

      expect(screen.getAllByText('1 / 3')).toHaveLength(2); // 카운터 + 라이트박스
    });

    it('임계값 이상 드래그하면 다음 이미지로 이동하고, 클릭해도 라이트박스는 열리지 않는다', () => {
      render(<ImageCarousel images={urls(3)} />);
      const image = screen.getAllByTestId('asset-image')[0];

      fireEvent.mouseDown(image, { clientX: 200 });
      fireEvent.mouseMove(image, { clientX: 100 }); // 왼쪽으로 100px 드래그
      fireEvent.mouseUp(image);
      fireEvent.click(image);

      expect(screen.getByText('2 / 3')).toBeInTheDocument();
      // 라이트박스가 열렸다면 "2 / 3"이 카운터+라이트박스 2곳에 나타난다
      expect(screen.getAllByText('2 / 3')).toHaveLength(1);
    });
  });

  describe('ImageLightbox', () => {
    it('배경을 클릭하면 닫힌다', async () => {
      render(<ImageCarousel images={urls(2)} />);
      await userEvent.click(screen.getAllByTestId('asset-image')[0]);
      const backdrop = getLightbox();
      expect(within(backdrop).getByText('1 / 2')).toBeInTheDocument();

      await userEvent.click(backdrop);

      expect(screen.queryByRole('button', { name: '닫기' })).toBeNull();
    });

    it('ESC 키를 누르면 닫힌다', async () => {
      render(<ImageCarousel images={urls(2)} />);
      await userEvent.click(screen.getAllByTestId('asset-image')[0]);
      expect(within(getLightbox()).getByText('1 / 2')).toBeInTheDocument();

      await userEvent.keyboard('{Escape}');

      expect(screen.queryByRole('button', { name: '닫기' })).toBeNull();
    });

    it('오른쪽 화살표 키로 다음 이미지, 왼쪽 화살표 키로 이전 이미지로 이동한다', async () => {
      render(<ImageCarousel images={urls(3)} />);
      await userEvent.click(screen.getAllByTestId('asset-image')[0]);
      expect(within(getLightbox()).getByText('1 / 3')).toBeInTheDocument();

      await userEvent.keyboard('{ArrowRight}');
      expect(within(getLightbox()).getByText('2 / 3')).toBeInTheDocument();

      await userEvent.keyboard('{ArrowLeft}');
      expect(within(getLightbox()).getByText('1 / 3')).toBeInTheDocument();
    });

    it('열려 있는 동안 body 스크롤을 잠그고, 닫히면 원래대로 복원한다', async () => {
      render(<ImageCarousel images={urls(2)} />);
      const originalOverflow = document.body.style.overflow;

      await userEvent.click(screen.getAllByTestId('asset-image')[0]);
      expect(document.body.style.overflow).toBe('hidden');

      await userEvent.keyboard('{Escape}');
      expect(document.body.style.overflow).toBe(originalOverflow);
    });

    it('하단 인디케이터를 클릭하면 해당 이미지로 이동한다', async () => {
      render(<ImageCarousel images={urls(3)} />);
      await userEvent.click(screen.getAllByTestId('asset-image')[0]);

      await userEvent.click(screen.getByLabelText('3번째 이미지'));

      expect(screen.getByText('3 / 3')).toBeInTheDocument();
    });
  });
});
