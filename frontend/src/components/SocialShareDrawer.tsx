'use client';

import { X, Link, Share2, Check } from 'lucide-react';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from './ui/drawer';
import { Dispatch, SetStateAction, useState } from 'react';
import {
  EmailShareButton,
  EmailIcon,
  FacebookIcon,
  FacebookShareButton,
  FacebookMessengerShareButton,
  FacebookMessengerIcon,
  LineShareButton,
  LineIcon,
  XIcon,
  TwitterShareButton,
} from 'react-share';
import Image from 'next/image';
import { useMediaResolveSingle } from '@/hooks/useMediaResolve';
import { toast } from 'sonner';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Kakao: any;
    Capacitor?: { isNativePlatform?: () => boolean };
  }
}

interface SocialShareDrawerProps {
  title: string;
  path: string;
  open: boolean;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
  record: {
    id: string;
    title: string;
    image: string | null;
    content: string;
  };
}

interface SocialNameProps {
  name: string;
}

function SocialName({ name }: SocialNameProps) {
  return (
    <div className="text-[10px] sm:text-xs pt-2 dark:text-white text-black">
      {name}
    </div>
  );
}

export default function SocialShareDrawer({
  title,
  path,
  open,
  onOpenChange,
  record,
}: SocialShareDrawerProps) {
  const { data } = useMediaResolveSingle(record.image ?? undefined);
  const [copied, setCopied] = useState(false);

  const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(path);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.info('클립보드를 지원하지 않는 환경입니다.');
      // 클립보드 API 미지원 환경에서는 무시
    }
  };

  const handleNativeShare = async () => {
    if (!navigator.share) return;
    try {
      await navigator.share({
        title: record.title || '오늘의 기록을 확인해보세요',
        text:
          record.content ||
          '기억과 맥락을 잇는 우리의 소중한 순간을 확인해보세요.',
        url: path,
      });
    } catch {
      // 사용자가 공유 취소한 경우 등 — 무시
    }
  };

  const handleKakaoShare = () => {
    if (!window.Kakao || !window.Kakao?.Share) return;

    const imageUrl = data?.url
      ? data.url
      : `${process.env.NEXT_PUBLIC_CLIENT_URL}/thumbnail.png`;

    window.Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: record.title || '오늘의 기록을 확인해보세요',
        description:
          record.content ||
          '기억과 맥락을 잇는 우리의 소중한 순간을 확인해보세요.',
        imageUrl: imageUrl,
        imageWidth: 800,
        imageHeight: 400,
        link: {
          mobileWebUrl: path,
          webUrl: path,
        },
      },
      buttons: [
        {
          title: '기록 보러가기',
          link: {
            mobileWebUrl: path,
            webUrl: path,
          },
        },
      ],
    });
  };

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="w-full px-4 sm:px-8 py-4">
          <DrawerHeader className="mb-0 pb-0 mx-0 px-0 pl-2">
            <div className="flex justify-between items-center mb-4 w-full">
              <DrawerTitle className="text-base sm:text-xl font-bold dark:text-white text-itta-black">
                공유하기
              </DrawerTitle>
              <DrawerClose className="p-2 text-gray-400">
                <X className="w-5 h-5 cursor-pointer" />
              </DrawerClose>
            </div>
          </DrawerHeader>

          {/* URL 복사 영역 */}
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 rounded-xl px-3 py-2.5 mb-4">
            <Link className="w-4 h-4 text-gray-400 shrink-0" />
            <span className="flex-1 text-xs text-gray-500 dark:text-gray-400 truncate">
              {path}
            </span>
            <button
              onClick={handleCopyLink}
              className="shrink-0 flex items-center gap-1 text-xs font-semibold text-itta-point active:opacity-70 transition-opacity"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  복사됨
                </>
              ) : (
                '복사'
              )}
            </button>
          </div>

          {/* 시스템 공유 버튼 (네이티브 앱 / navigator.share 지원 환경) */}
          {canNativeShare && (
            <button
              onClick={handleNativeShare}
              className="w-full flex items-center justify-center gap-2 py-3 mb-8 rounded-xl bg-itta-black text-white dark:bg-white dark:text-itta-black font-semibold text-sm active:scale-95 transition-all"
            >
              <Share2 className="w-4 h-4" />더 많은 앱으로 공유
            </button>
          )}

          {/* 소셜 버튼 목록 */}
          <div className="overflow-x-auto scrollbar-hide pb-4 scroll-smooth touch-pan-x overscroll-x-contain">
            <ul className="flex justify-start gap-4 sm:gap-6 min-w-max">
              <li className="flex flex-col items-center shrink-0">
                <button
                  onClick={handleKakaoShare}
                  className="flex flex-col items-center"
                  aria-label="카카오톡으로 공유하기"
                >
                  <div className="w-10 h-10 sm:w-15 sm:h-15 relative">
                    <Image
                      src="/kakao_logo.png"
                      alt="카카오톡 로고"
                      width={60}
                      height={60}
                      className="w-full h-full object-cover rounded-full"
                    />
                  </div>
                  <SocialName name="Kakao" />
                </button>
              </li>
              <li className="flex flex-col items-center shrink-0">
                <FacebookShareButton
                  url={path}
                  title={title}
                  aria-label="페이스북으로 공유하기"
                  content={record.content}
                  className="dark:text-white text-itta-black flex flex-col items-center"
                >
                  <FacebookIcon size={40} round className="sm:hidden" />
                  <FacebookIcon size={60} round className="hidden sm:block" />
                  <SocialName name="Facebook" />
                </FacebookShareButton>
              </li>
              <li className="flex flex-col items-center shrink-0">
                <FacebookMessengerShareButton
                  url={path}
                  title={title}
                  appId="521270401588372"
                  content={record.content}
                  aria-label="페이스북 메신저로 공유하기"
                  className="dark:text-white text-itta-black flex flex-col items-center"
                >
                  <FacebookMessengerIcon
                    size={40}
                    round
                    className="sm:hidden"
                  />
                  <FacebookMessengerIcon
                    size={60}
                    round
                    className="hidden sm:block"
                  />
                  <SocialName name="Messanger" />
                </FacebookMessengerShareButton>
              </li>
              <li className="flex flex-col items-center shrink-0">
                <TwitterShareButton
                  url={path}
                  title={title}
                  content={record.content}
                  aria-label="트위터로 공유하기"
                  className="dark:text-white text-itta-black flex flex-col items-center"
                >
                  <XIcon size={40} round className="sm:hidden" />
                  <XIcon size={60} round className="hidden sm:block" />
                  <SocialName name="X" />
                </TwitterShareButton>
              </li>
              <li className="flex flex-col items-center shrink-0">
                <EmailShareButton
                  url={path}
                  title={title}
                  subject={record.title}
                  body={record.content}
                  content={record.content}
                  aria-label="이메일로 공유하기"
                  className="dark:text-white text-itta-black flex flex-col items-center"
                >
                  <EmailIcon size={40} round className="sm:hidden" />
                  <EmailIcon size={60} round className="hidden sm:block" />
                  <SocialName name="Email" />
                </EmailShareButton>
              </li>
              <li className="flex flex-col items-center shrink-0">
                <LineShareButton
                  url={path}
                  title={title}
                  content={record.content}
                  aria-label="라인으로 공유하기"
                  className="dark:text-white text-itta-black flex flex-col items-center"
                >
                  <LineIcon size={40} round className="sm:hidden" />
                  <LineIcon size={60} round className="hidden sm:block" />
                  <SocialName name="Line" />
                </LineShareButton>
              </li>
            </ul>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
