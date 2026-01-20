'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type PermissionStatus = 'prompt' | 'granted' | 'denied' | 'unknown';

interface State {
  permissionStatus: PermissionStatus;
  hasAskedPermission: boolean; // 모달을 통해 이미 물어봤는지 여부
}

interface Action {
  setPermissionStatus: (status: PermissionStatus) => void;
  setHasAskedPermission: (asked: boolean) => void;
  checkPermission: () => Promise<PermissionStatus>;
  requestPermission: () => Promise<PermissionStatus>;
}

export const useLocationPermissionStore = create<State & Action>()(
  persist(
    (set, get) => ({
      permissionStatus: 'unknown',
      hasAskedPermission: false,

      setPermissionStatus: (status) => {
        set({ permissionStatus: status });
      },

      setHasAskedPermission: (asked) => {
        set({ hasAskedPermission: asked });
      },

      checkPermission: async () => {
        // 브라우저가 Permissions API를 지원하는지 확인
        if (!navigator.permissions) {
          return 'unknown';
        }

        try {
          const result = await navigator.permissions.query({
            name: 'geolocation',
          });
          const status = result.state as PermissionStatus;
          set({ permissionStatus: status });
          return status;
        } catch {
          return 'unknown';
        }
      },

      requestPermission: async () => {
        return new Promise((resolve) => {
          if (!navigator.geolocation) {
            set({ permissionStatus: 'denied' });
            resolve('denied');
            return;
          }

          navigator.geolocation.getCurrentPosition(
            () => {
              set({ permissionStatus: 'granted', hasAskedPermission: true });
              resolve('granted');
            },
            (error) => {
              if (error.code === error.PERMISSION_DENIED) {
                set({ permissionStatus: 'denied', hasAskedPermission: true });
                resolve('denied');
              } else {
                // 다른 에러(위치 불가능, 타임아웃 등)는 권한과 무관
                set({ hasAskedPermission: true });
                resolve(get().permissionStatus);
              }
            },
            {
              enableHighAccuracy: false,
              timeout: 10000,
              maximumAge: Infinity,
            },
          );
        });
      },
    }),
    { name: 'location-permission-storage' },
  ),
);
