import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DatePicker from './DatePicker';

// react-day-picker는 명시적 month/defaultMonth가 없으면 "오늘"이 속한 달을 연다.
// 어떤 달이 열리든 항상 존재하는 중순의 날짜(15일)로 상호작용을 검증해
// 실행 시점(오늘 날짜)에 의존하지 않도록 한다.
describe('DatePicker', () => {
  it('선택된 날짜를 "YYYY.MM.DD" 형식으로 트리거에 표시한다', () => {
    render(<DatePicker value={new Date(2024, 5, 15)} onChange={vi.fn()} />);

    expect(screen.getByText('2024.06.15')).toBeInTheDocument();
  });

  it('트리거를 클릭하면 캘린더가 열린다', async () => {
    render(<DatePicker value={new Date(2024, 5, 15)} onChange={vi.fn()} />);

    await userEvent.click(screen.getByText('2024.06.15'));

    expect(await screen.findByText('15')).toBeInTheDocument();
  });

  it('날짜를 클릭하면 onChange가 클릭한 일자로 호출된다', async () => {
    const onChange = vi.fn();
    render(<DatePicker value={new Date(2024, 5, 1)} onChange={onChange} />);

    await userEvent.click(screen.getByText('2024.06.01'));
    await userEvent.click(await screen.findByText('15'));

    expect(onChange).toHaveBeenCalledTimes(1);
    const selected = onChange.mock.calls[0][0] as Date;
    expect(selected.getDate()).toBe(15);
  });
});
