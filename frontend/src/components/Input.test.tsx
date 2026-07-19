import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { Input } from './Input';

describe('Input', () => {
  it('Left, Field, Right를 함께 렌더링한다', () => {
    render(
      <Input>
        <Input.Left>
          <span data-testid="left-icon" />
        </Input.Left>
        <Input.Field placeholder="닉네임 입력" />
        <Input.Right>
          <span data-testid="right-icon" />
        </Input.Right>
      </Input>,
    );

    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('닉네임 입력')).toBeInTheDocument();
  });

  it('Field는 기본적으로 type="text"이다', () => {
    render(<Input.Field placeholder="입력" />);

    expect(screen.getByPlaceholderText('입력')).toHaveAttribute(
      'type',
      'text',
    );
  });

  it('사용자가 입력하면 값이 반영된다', async () => {
    render(<Input.Field placeholder="입력" />);

    await userEvent.type(screen.getByPlaceholderText('입력'), '제주도 여행');

    expect(screen.getByPlaceholderText('입력')).toHaveValue('제주도 여행');
  });

  it('onChange 핸들러가 입력마다 호출된다', async () => {
    const onChange = vi.fn();
    render(<Input.Field placeholder="입력" onChange={onChange} />);

    await userEvent.type(screen.getByPlaceholderText('입력'), '가');

    expect(onChange).toHaveBeenCalled();
  });

  it('ref가 실제 input 엘리먼트를 가리킨다', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input.Field ref={ref} placeholder="입력" />);

    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    expect(ref.current?.placeholder).toBe('입력');
  });

  it('Root에 전달한 className이 기본 클래스와 함께 적용된다', () => {
    render(
      <Input className="custom-class">
        <Input.Field placeholder="입력" />
      </Input>,
    );

    const root = screen.getByPlaceholderText('입력').parentElement;
    expect(root).toHaveClass('custom-class');
    expect(root).toHaveClass('rounded-[10px]');
  });
});
