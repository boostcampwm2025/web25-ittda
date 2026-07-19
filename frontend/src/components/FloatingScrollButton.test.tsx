import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FloatingScrollButton from './FloatingScrollButton';

describe('FloatingScrollButton', () => {
  it('show가 false면 렌더링하지 않는다', () => {
    const { container } = render(
      <FloatingScrollButton show={false} direction="up" onClick={vi.fn()} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('direction이 up이면 "맨 위로 가기" 버튼을 렌더링한다', () => {
    render(<FloatingScrollButton show={true} direction="up" onClick={vi.fn()} />);

    expect(
      screen.getByRole('button', { name: '맨 위로 가기' }),
    ).toBeInTheDocument();
  });

  it('direction이 down이면 "맨 아래로 가기" 버튼을 렌더링한다', () => {
    render(
      <FloatingScrollButton show={true} direction="down" onClick={vi.fn()} />,
    );

    expect(
      screen.getByRole('button', { name: '맨 아래로 가기' }),
    ).toBeInTheDocument();
  });

  it('클릭하면 onClick이 호출된다', async () => {
    const onClick = vi.fn();
    render(
      <FloatingScrollButton show={true} direction="up" onClick={onClick} />,
    );

    await userEvent.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
