import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { SVGProps } from 'react';
import NavItem from './NavItem';

function TestIcon(props: SVGProps<SVGSVGElement>) {
  return <svg data-testid="icon" {...props} />;
}

describe('NavItem', () => {
  it('전달받은 아이콘을 렌더링한다', () => {
    render(<NavItem icon={<TestIcon />} active={false} onClick={vi.fn()} />);

    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('클릭하면 onClick이 호출된다', async () => {
    const onClick = vi.fn();
    render(<NavItem icon={<TestIcon />} active={false} onClick={onClick} />);

    await userEvent.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('active가 true면 아이콘 strokeWidth가 2.5로 두꺼워진다', () => {
    render(<NavItem icon={<TestIcon />} active={true} onClick={vi.fn()} />);

    expect(screen.getByTestId('icon')).toHaveAttribute('stroke-width', '2.5');
  });

  it('active가 false면 아이콘 strokeWidth가 2.2로 얇아진다', () => {
    render(<NavItem icon={<TestIcon />} active={false} onClick={vi.fn()} />);

    expect(screen.getByTestId('icon')).toHaveAttribute('stroke-width', '2.2');
  });

  it('isGroup, active가 모두 true면 그룹 활성 색상 클래스가 적용된다', () => {
    render(
      <NavItem icon={<TestIcon />} active={true} onClick={vi.fn()} isGroup />,
    );

    expect(screen.getByRole('button')).toHaveClass('text-[#10B981]');
  });

  it('isGroup이 true이고 active가 false면 그룹 비활성 색상 클래스가 적용된다', () => {
    render(
      <NavItem icon={<TestIcon />} active={false} onClick={vi.fn()} isGroup />,
    );

    expect(screen.getByRole('button')).toHaveClass('text-gray-400');
  });

  it('isGroup이 아니고 active가 true면 개인 네비 활성 색상 클래스가 적용된다', () => {
    render(<NavItem icon={<TestIcon />} active={true} onClick={vi.fn()} />);

    expect(screen.getByRole('button')).toHaveClass('text-[#222222]');
  });

  it('클릭하면 ripple 효과가 나타난다', async () => {
    render(<NavItem icon={<TestIcon />} active={false} onClick={vi.fn()} />);
    const button = screen.getByRole('button');

    expect(button.querySelector('span')).not.toBeInTheDocument();

    await userEvent.click(button);

    expect(button.querySelector('span')).toBeInTheDocument();
  });

  it('tutorialId를 전달하면 data-tutorial-id 속성이 렌더링된다', () => {
    render(
      <NavItem
        icon={<TestIcon />}
        active={false}
        onClick={vi.fn()}
        tutorialId="tutorial-nav-group"
      />,
    );

    expect(screen.getByRole('button')).toHaveAttribute(
      'data-tutorial-id',
      'tutorial-nav-group',
    );
  });

  it('tutorialId를 전달하지 않으면 data-tutorial-id 속성이 없다', () => {
    render(<NavItem icon={<TestIcon />} active={false} onClick={vi.fn()} />);

    expect(screen.getByRole('button')).not.toHaveAttribute('data-tutorial-id');
  });
});
