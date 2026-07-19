import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LocationPermissionModal from './LocationPermissionModal';

const mockUseLocationPermissionStore = vi.hoisted(() => vi.fn());

vi.mock('@/store/useLocationPermissionStore', () => ({
  useLocationPermissionStore: mockUseLocationPermissionStore,
}));

describe('LocationPermissionModal', () => {
  const requestPermission = vi.fn();
  const setHasAskedPermission = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    requestPermission.mockResolvedValue('granted');
    mockUseLocationPermissionStore.mockReturnValue({
      requestPermission,
      setHasAskedPermission,
    });
  });

  it('isOpen이 false이면 아무것도 렌더링하지 않는다', () => {
    const { container } = render(
      <LocationPermissionModal isOpen={false} onClose={vi.fn()} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('isOpen이 true이면 안내 문구를 렌더링한다', () => {
    render(<LocationPermissionModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText('위치 정보 사용 동의')).toBeInTheDocument();
  });

  it('배경을 클릭하면 hasAskedPermission을 설정하고 닫는다', async () => {
    const onClose = vi.fn();
    render(<LocationPermissionModal isOpen={true} onClose={onClose} />);

    await userEvent.click(screen.getByText('위치 정보 사용 동의'));
    // 위 클릭은 카드 내부라 전파가 막혀야 하므로, 실제 배경(overlay) 클릭을 검증
    const overlay = screen.getByText('위치 정보 사용 동의').closest(
      '.fixed',
    ) as HTMLElement;
    await userEvent.click(overlay);

    expect(setHasAskedPermission).toHaveBeenCalledWith(true);
    expect(onClose).toHaveBeenCalled();
  });

  it('"나중에" 버튼을 클릭하면 hasAskedPermission을 설정하고 닫는다', async () => {
    const onClose = vi.fn();
    render(<LocationPermissionModal isOpen={true} onClose={onClose} />);

    await userEvent.click(screen.getByRole('button', { name: '나중에' }));

    expect(setHasAskedPermission).toHaveBeenCalledWith(true);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('카드 내부를 클릭해도 닫히지 않는다', async () => {
    const onClose = vi.fn();
    render(<LocationPermissionModal isOpen={true} onClose={onClose} />);

    await userEvent.click(screen.getByText('위치 정보 사용 동의'));

    expect(onClose).not.toHaveBeenCalled();
  });

  it('"허용하기"를 클릭하면 요청 중 버튼 텍스트가 바뀌고, 완료되면 닫힌다', async () => {
    let resolveRequest: (value: string) => void;
    requestPermission.mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      }),
    );
    const onClose = vi.fn();
    render(<LocationPermissionModal isOpen={true} onClose={onClose} />);

    await userEvent.click(screen.getByRole('button', { name: '허용하기' }));

    expect(screen.getByRole('button', { name: '확인 중...' })).toBeDisabled();

    resolveRequest!('granted');

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(requestPermission).toHaveBeenCalledTimes(1);
  });
});
