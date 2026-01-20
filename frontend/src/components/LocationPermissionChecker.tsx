'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { useLocationPermissionStore } from '@/store/useLocationPermissionStore';
import LocationPermissionModal from './LocationPermissionModal';
import { toast } from 'sonner';

// SSR에서는 false, 클라이언트에서는 true 반환
const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export default function LocationPermissionChecker() {
  const isHydrated = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const { hasAskedPermission, checkPermission } = useLocationPermissionStore();
  const [showRequestModal, setShowRequestModal] = useState(false);

  useEffect(() => {
    if (!isHydrated) return;

    const checkAndShowModal = async () => {
      // 현재 권한 상태 확인
      const status = await checkPermission();

      // 이미 granted 상태면 아무것도 표시 안 함
      if (status === 'granted') {
        return;
      }

      // denied 상태면 토스트로 안내
      if (status === 'denied') {
        toast.error('위치 권한이 필요해요', {
          description: '브라우저 설정에서 위치 권한을 허용해주세요',
          duration: 4000,
        });
        return;
      }

      // 이미 모달을 통해 물어본 적이 있으면 스킵
      if (hasAskedPermission) return;

      // prompt 상태이거나 unknown이면 권한 요청 모달 표시
      setShowRequestModal(true);
    };

    // 약간의 딜레이 후 체크 (앱 초기 로딩이 완료된 후)
    const timer = setTimeout(checkAndShowModal, 1000);
    return () => clearTimeout(timer);
  }, [isHydrated, hasAskedPermission, checkPermission]);

  if (!isHydrated || !showRequestModal) return null;

  return (
    <LocationPermissionModal
      isOpen={true}
      onClose={() => setShowRequestModal(false)}
    />
  );
}
