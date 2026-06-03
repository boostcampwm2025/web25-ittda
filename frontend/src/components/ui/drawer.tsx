'use client';

import * as React from 'react';
import { Drawer as DrawerPrimitive } from 'vaul';

import { cn } from '@/lib/utils';
import { pushBackHandler } from '@/components/AndroidBackHandler';

function Drawer({
  open,
  onOpenChange,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) {
  const onOpenChangeRef = React.useRef(onOpenChange);
  React.useEffect(() => {
    onOpenChangeRef.current = onOpenChange;
  });

  React.useEffect(() => {
    if (open !== true) return;

    // drawer 열릴 때 Android 백버튼 핸들러 등록 → 닫힐 때 자동 해제
    const remove = pushBackHandler(() => {
      onOpenChangeRef.current?.(false);
    });
    return remove;
  }, [open]);

  // Web/PWA: drawer 열릴 때 history entry push → 뒤로가기로 닫기 지원
  React.useEffect(() => {
    const isNative = (
      window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }
    ).Capacitor?.isNativePlatform?.();
    if (isNative || open !== true) return;

    const drawerId = Math.random().toString(36).slice(2);

    // 직전 닫기에서 남긴 placeholder entry가 있으면 재사용해 pushState 누적 방지
    if (
      (history.state as { __drawerClosed?: boolean } | null)?.__drawerClosed
    ) {
      history.replaceState({ __drawerId: drawerId }, '');
    } else {
      history.pushState({ __drawerId: drawerId }, '');
    }

    return () => {
      // 뒤로가기로 닫힌 경우: popstate가 이미 history를 소비했으므로 skip
      // 일반 닫기(X 버튼, backdrop 등): history.go(-1) 대신 replaceState 사용
      // → 동기 실행이므로 빠른 재오픈 시 async go(-1)가 새 entry를 소비하는
      //   경쟁 조건(2·4번째 열기 버그)을 방지
      if (
        (history.state as { __drawerId?: string } | null)?.__drawerId ===
        drawerId
      ) {
        history.replaceState({ __drawerClosed: true }, '');
      }
    };
  }, [open]);

  return (
    <DrawerPrimitive.Root
      data-slot="drawer"
      open={open}
      onOpenChange={onOpenChange}
      {...props}
    />
  );
}

function DrawerTrigger({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Trigger>) {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />;
}

function DrawerPortal({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Portal>) {
  return <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />;
}

function DrawerClose({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Close>) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />;
}

function DrawerOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Overlay>) {
  return (
    <DrawerPrimitive.Overlay
      data-slot="drawer-overlay"
      className={cn(
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50 backdrop-blur-sm',
        className,
      )}
      {...props}
    />
  );
}

function DrawerContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Content>) {
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    // interactiveWidget 미지원 환경에서는 window.innerHeight도 키보드와 함께 줄어들어
    // kh = innerHeight - vv.height ≈ 0 이 되므로, 직접 관측한 최대값을 기준으로 삼음.
    let baseHeight = vv.height;
    let rafId = 0;

    const onResize = () => {
      // effect 시작 시 캡처하면 drawer가 닫힌 상태일 때 null을 고정해버리므로
      // 매 이벤트마다 ref를 직접 조회해 drawer가 열린 뒤에도 동작하게 함.
      const el = contentRef.current;
      if (!el) return;

      cancelAnimationFrame(rafId);
      if (vv.height > baseHeight) baseHeight = vv.height;

      const kh = baseHeight - vv.height;

      if (kh > 60) {
        const next = `${Math.round(vv.height) - 24}px`;
        if (el.style.maxHeight !== next) el.style.maxHeight = next;
      } else if (el.style.maxHeight !== '') {
        el.style.maxHeight = '';
        // vaul도 같은 vv.resize에서 동기적으로 style.height를 잘못 설정하므로
        // RAF로 vaul의 핸들러가 끝난 뒤(한 프레임, ~16ms) height를 초기화함.
        // setTimeout(300ms) 대신 RAF를 써야 육안으로 보이는 깜빡임이 없음.
        rafId = requestAnimationFrame(() => {
          const elNow = contentRef.current;
          if (elNow) elNow.style.height = '';
        });
      }
    };

    vv.addEventListener('resize', onResize);

    return () => {
      vv.removeEventListener('resize', onResize);
      cancelAnimationFrame(rafId);
      const el = contentRef.current;
      if (el) {
        el.style.maxHeight = '';
        el.style.height = '';
      }
    };
  }, []);

  return (
    <DrawerPortal data-slot="drawer-portal">
      <DrawerOverlay />
      <DrawerPrimitive.Content
        ref={contentRef}
        data-slot="drawer-content"
        className={cn(
          'dark:bg-[#1E1E1E] bg-white max-w-4xl mx-auto',
          'group/drawer-content bg-background fixed z-50 flex h-auto flex-col',
          'data-[vaul-drawer-direction=top]:inset-x-0 data-[vaul-drawer-direction=top]:top-0 data-[vaul-drawer-direction=top]:mb-24 data-[vaul-drawer-direction=top]:max-h-[93dvh] data-[vaul-drawer-direction=top]:rounded-b-lg data-[vaul-drawer-direction=top]:border-b',
          'data-[vaul-drawer-direction=bottom]:inset-x-0 data-[vaul-drawer-direction=bottom]:bottom-0 data-[vaul-drawer-direction=bottom]:mt-24 data-[vaul-drawer-direction=bottom]:max-h-[93dvh] data-[vaul-drawer-direction=bottom]:rounded-t-[40px] data-[vaul-drawer-direction=bottom]:border-t',
          'data-[vaul-drawer-direction=right]:inset-y-0 data-[vaul-drawer-direction=right]:right-0 data-[vaul-drawer-direction=right]:w-3/4 data-[vaul-drawer-direction=right]:border-l data-[vaul-drawer-direction=right]:sm:max-w-sm',
          'data-[vaul-drawer-direction=left]:inset-y-0 data-[vaul-drawer-direction=left]:left-0 data-[vaul-drawer-direction=left]:w-3/4 data-[vaul-drawer-direction=left]:border-r data-[vaul-drawer-direction=left]:sm:max-w-sm',
          className,
        )}
        {...props}
      >
        <div className="bg-muted mx-auto mt-4 hidden h-2 w-25 shrink-0 rounded-full group-data-[vaul-drawer-direction=bottom]/drawer-content:block" />
        {children}
        <div
          aria-hidden
          className="hidden group-data-[vaul-drawer-direction=bottom]/drawer-content:block shrink-0"
          style={{ height: 'env(safe-area-inset-bottom)' }}
        />
      </DrawerPrimitive.Content>
    </DrawerPortal>
  );
}

function DrawerHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="drawer-header"
      className={cn(
        'flex flex-col gap-0.5 px-0 py-4 sm:p-4 group-data-[vaul-drawer-direction=bottom]/drawer-content:text-center group-data-[vaul-drawer-direction=top]/drawer-content:text-center md:gap-1.5 md:text-left',
        className,
      )}
      {...props}
    />
  );
}

function DrawerFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="drawer-footer"
      className={cn('mt-auto flex flex-col gap-2 p-4', className)}
      {...props}
    />
  );
}

function DrawerTitle({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Title>) {
  return (
    <DrawerPrimitive.Title
      data-slot="drawer-title"
      className={cn('text-foreground font-semibold text-base', className)}
      {...props}
    />
  );
}

function DrawerDescription({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Description>) {
  return (
    <DrawerPrimitive.Description
      data-slot="drawer-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  );
}

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
};
