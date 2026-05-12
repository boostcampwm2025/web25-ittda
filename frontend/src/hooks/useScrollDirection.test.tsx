import { describe, it, expect } from 'vitest';
import { render, act, screen } from '@testing-library/react';
import React from 'react';
import { useScrollDirection } from './useScrollDirection';

// renderHook은 DOM 요소 없이 실행되어 useEffect 시점에 containerRef.current가 null이 됨.
// render로 실제 DOM 요소에 ref를 연결한 뒤 scroll 이벤트를 시뮬레이션한다.
function ScrollTestComponent() {
  const { containerRef, isVisible } = useScrollDirection<HTMLDivElement>();
  return (
    <div
      data-testid="container"
      data-visible={String(isVisible)}
      ref={containerRef}
    />
  );
}

function getVisible(): boolean {
  return screen.getByTestId('container').getAttribute('data-visible') === 'true';
}

function scrollTo(scrollTop: number) {
  const el = screen.getByTestId('container');
  Object.defineProperty(el, 'scrollTop', {
    value: scrollTop,
    writable: true,
    configurable: true,
  });
  act(() => {
    el.dispatchEvent(new Event('scroll'));
  });
}

describe('useScrollDirection', () => {
  it('초기 상태는 isVisible이 true다', () => {
    render(<ScrollTestComponent />);
    expect(getVisible()).toBe(true);
  });

  it('아래로 스크롤하면 isVisible이 false가 된다', () => {
    render(<ScrollTestComponent />);
    scrollTo(100);
    expect(getVisible()).toBe(false);
  });

  it('아래로 스크롤 후 위로 스크롤하면 isVisible이 true로 돌아온다', () => {
    render(<ScrollTestComponent />);
    scrollTo(100);
    scrollTo(30);
    expect(getVisible()).toBe(true);
  });

  it('최상단(scrollTop <= 10)에서는 항상 isVisible이 true다', () => {
    render(<ScrollTestComponent />);
    scrollTo(100);
    expect(getVisible()).toBe(false);
    scrollTo(5);
    expect(getVisible()).toBe(true);
  });

  it('5px 미만 미세 스크롤은 상태를 변경하지 않는다', () => {
    render(<ScrollTestComponent />);
    scrollTo(50);
    expect(getVisible()).toBe(false);
    scrollTo(53); // 3px — 임계값 미만
    expect(getVisible()).toBe(false);
  });
});
