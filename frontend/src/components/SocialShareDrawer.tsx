'use client';

import { X } from 'lucide-react';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from './ui/drawer';
import { Dispatch, SetStateAction } from 'react';
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

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Kakao: any;
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
  return <div className="text-xs pt-2 dark:text-white text-black">{name}</div>;
}

export default function SocialShareDrawer({
  title,
  path,
  open,
  onOpenChange,
  record,
}: SocialShareDrawerProps) {
  const { data } = useMediaResolveSingle(record.image ?? undefined);

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
        <DrawerContent className="w-full px-8 py-4">
          <DrawerHeader className="mb-0 pb-0 mx-0 px-0">
            <div className="flex justify-between items-center mb-10 w-full">
              <DrawerTitle className="text-lg font-bold dark:text-white text-itta-black">
                sns로 공유하기
              </DrawerTitle>
              <DrawerClose className="p-2 text-gray-400">
                <X className="w-5 h-5 cursor-pointer" />
              </DrawerClose>
            </div>
          </DrawerHeader>

          <div className="overflow-x-auto scrollbar-hide pb-4 scroll-smooth touch-pan-x overscroll-x-contain">
            <ul className="flex justify-start gap-6 min-w-max">
              <li className="flex flex-col items-center shrink-0">
                <button
                  onClick={handleKakaoShare}
                  className="flex flex-col items-center"
                  aria-label="카카오톡으로 공유하기"
                >
                  <div className="w-15 h-15 relative">
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
                  <FacebookIcon size={60} round />
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
                  <FacebookMessengerIcon size={60} round />
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
                  <XIcon size={60} round />
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
                  <EmailIcon size={60} round />
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
                  <LineIcon size={60} round />
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
