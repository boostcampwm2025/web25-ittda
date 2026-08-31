import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FloatingScrollButton from './FloatingScrollButton';

describe('FloatingScrollButton', () => {
  it('show가 false면 렌더링하지 않는다', () => {
    const { container } = render(
      <FloatingScrollButton show={false} onClick={vi.fn()} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('show가 true면 "맨 위로 이동" 버튼을 렌더링한다', () => {
    render(<FloatingScrollButton show={true} onClick={vi.fn()} />);

    expect(
      screen.getByRole('button', { name: '맨 위로 이동' }),
    ).toBeInTheDocument();
  });

  it('클릭하면 onClick이 호출된다', async () => {
    const onClick = vi.fn();
    render(<FloatingScrollButton show={true} onClick={onClick} />);

    await userEvent.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
