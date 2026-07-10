import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DateDrawer from './DateDrawer';

vi.mock('@/components/ui/drawer', () => ({
  Drawer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DrawerContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DrawerTitle: ({ children }: { children: React.ReactNode }) => (
    <h2>{children}</h2>
  ),
}));

// "오늘"을 고정해 미래 날짜 비활성화, "이 달 전체 선택" 클램핑을 결정적으로 검증한다.
describe('DateDrawer', () => {
  beforeEach(() => {
    // Date만 고정하고 setTimeout 등은 real로 유지 — 그래야 userEvent 내부 타이머와 충돌하지 않는다.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2024, 5, 15)); // 2024-06-15
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('single 모드', () => {
    it('날짜를 클릭하면 onSelectDate를 호출하고 닫히지 않는다', async () => {
      const user = userEvent.setup({ delay: null });
      const onSelectDate = vi.fn();
      const onClose = vi.fn();
      render(
        <DateDrawer
          mode="single"
          onClose={onClose}
          currentDate="2024-06-01"
          onSelectDate={onSelectDate}
        />,
      );

      await user.click(screen.getByRole('button', { name: '10' }));

      expect(onSelectDate).toHaveBeenCalledWith('2024-06-10');
      expect(onClose).not.toHaveBeenCalled();
    });

    it('"오늘로"를 클릭하면 오늘 날짜로 선택하고 닫는다', async () => {
      const user = userEvent.setup({ delay: null });
      const onSelectDate = vi.fn();
      const onClose = vi.fn();
      render(
        <DateDrawer mode="single" onClose={onClose} onSelectDate={onSelectDate} />,
      );

      await user.click(screen.getByRole('button', { name: '오늘로' }));

      expect(onSelectDate).toHaveBeenCalledWith('2024-06-15');
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('"닫기" 버튼을 클릭하면 onClose만 호출된다', async () => {
      const user = userEvent.setup({ delay: null });
      const onClose = vi.fn();
      const onSelectRange = vi.fn();
      render(
        <DateDrawer
          mode="single"
          onClose={onClose}
          onSelectRange={onSelectRange}
        />,
      );

      await user.click(screen.getByRole('button', { name: '닫기' }));

      expect(onClose).toHaveBeenCalledTimes(1);
      expect(onSelectRange).not.toHaveBeenCalled();
    });

    it('미래 날짜는 비활성화되어 클릭해도 선택되지 않는다', async () => {
      const user = userEvent.setup({ delay: null });
      const onSelectDate = vi.fn();
      render(
        <DateDrawer mode="single" onClose={vi.fn()} onSelectDate={onSelectDate} />,
      );

      const futureDay = screen.getByRole('button', { name: '20' });
      expect(futureDay).toBeDisabled();

      await user.click(futureDay);
      expect(onSelectDate).not.toHaveBeenCalled();
    });

    it('다음 달로 이동하면 헤더의 연월 표시가 바뀐다', async () => {
      const user = userEvent.setup({ delay: null });
      render(<DateDrawer mode="single" onClose={vi.fn()} />);

      expect(screen.getByText('2024년 6월')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: '다음 달' }));

      expect(screen.getByText('2024년 7월')).toBeInTheDocument();
    });
  });

  describe('range 모드', () => {
    it('두 날짜를 순서대로 클릭하면 시작/끝으로 저장하고 완료 시 전달한다', async () => {
      const user = userEvent.setup({ delay: null });
      const onSelectRange = vi.fn();
      const onClose = vi.fn();
      render(
        <DateDrawer mode="range" onClose={onClose} onSelectRange={onSelectRange} />,
      );

      await user.click(screen.getByRole('button', { name: '5' }));
      await user.click(screen.getByRole('button', { name: '10' }));
      await user.click(screen.getByRole('button', { name: '완료' }));

      expect(onSelectRange).toHaveBeenCalledWith({
        start: '2024-06-05',
        end: '2024-06-10',
      });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('끝 날짜로 시작보다 이른 날짜를 클릭하면 시작/끝을 뒤바꿔 저장한다', async () => {
      const user = userEvent.setup({ delay: null });
      const onSelectRange = vi.fn();
      render(
        <DateDrawer mode="range" onClose={vi.fn()} onSelectRange={onSelectRange} />,
      );

      await user.click(screen.getByRole('button', { name: '10' }));
      await user.click(screen.getByRole('button', { name: '5' }));
      await user.click(screen.getByRole('button', { name: '완료' }));

      expect(onSelectRange).toHaveBeenCalledWith({
        start: '2024-06-05',
        end: '2024-06-10',
      });
    });

    it('시작 날짜를 다시 클릭하면 선택이 초기화된다', async () => {
      const user = userEvent.setup({ delay: null });
      const onSelectRange = vi.fn();
      render(
        <DateDrawer mode="range" onClose={vi.fn()} onSelectRange={onSelectRange} />,
      );

      await user.click(screen.getByRole('button', { name: '10' }));
      await user.click(screen.getByRole('button', { name: '10' }));
      await user.click(screen.getByRole('button', { name: '완료' }));

      expect(onSelectRange).toHaveBeenCalledWith({ start: null, end: null });
    });

    it('"초기화" 버튼을 클릭하면 선택을 비운다', async () => {
      const user = userEvent.setup({ delay: null });
      const onSelectRange = vi.fn();
      render(
        <DateDrawer mode="range" onClose={vi.fn()} onSelectRange={onSelectRange} />,
      );

      await user.click(screen.getByRole('button', { name: '5' }));
      await user.click(screen.getByRole('button', { name: /초기화/ }));
      await user.click(screen.getByRole('button', { name: '완료' }));

      expect(onSelectRange).toHaveBeenCalledWith({ start: null, end: null });
    });

    it('"이 달 전체 선택"을 클릭하면 1일부터 오늘까지 선택한다', async () => {
      const user = userEvent.setup({ delay: null });
      const onSelectRange = vi.fn();
      render(
        <DateDrawer mode="range" onClose={vi.fn()} onSelectRange={onSelectRange} />,
      );

      await user.click(
        screen.getByRole('button', { name: /이 달 전체 선택/ }),
      );
      await user.click(screen.getByRole('button', { name: '완료' }));

      expect(onSelectRange).toHaveBeenCalledWith({
        start: '2024-06-01',
        end: '2024-06-15', // 오늘(6/15)이 이번 달 말일보다 이르므로 오늘까지
      });
    });
  });
});
