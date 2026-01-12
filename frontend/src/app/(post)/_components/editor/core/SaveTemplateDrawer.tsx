'use client';

import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from '@/components/ui/drawer';

interface SaveTemplateDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, desc: string) => void;
}

export default function SaveTemplateDrawer({
  isOpen,
  onClose,
  onSave,
}: SaveTemplateDrawerProps) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  const isValid = name.trim().length > 0;

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="dark:bg-[#1E1E1E] bg-white rounded-t-[40px]">
        <div className="w-full p-8 pb-12">
          <DrawerHeader className="text-left p-0 mb-8">
            <p className="text-left text-[10px] font-bold text-[#10B981] uppercase tracking-widest leading-none mb-1">
              SAVE TEMPLATE
            </p>
            <DrawerTitle className="text-left text-lg font-bold dark:text-white text-[#333]">
              현재 레이아웃 저장
            </DrawerTitle>
          </DrawerHeader>

          <div className="space-y-6 mb-10">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">
                템플릿 이름
              </label>
              <input
                autoFocus
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: 나의 데일리 기록"
                className="w-full border-b-2 bg-transparent py-3 text-lg font-bold transition-all outline-none dark:border-white/5 dark:focus:border-[#10B981] dark:text-white border-gray-100 focus:border-[#10B981] text-[#333333]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">
                설명 (선택사항)
              </label>
              <input
                type="text"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="어떤 구성을 위한 템플릿인가요?"
                className="w-full border-b bg-transparent py-2 text-sm font-medium transition-all outline-none dark:border-white/5 dark:focus:border-[#10B981] dark:text-gray-400 border-gray-100 focus:border-[#10B981] text-gray-600"
              />
            </div>
          </div>

          <DrawerFooter className="flex-row gap-4 p-0">
            <button
              onClick={onClose}
              className="flex-1 py-4 rounded-2xl font-bold text-sm dark:bg-white/5 dark:text-gray-500 bg-gray-50 text-gray-400 active:scale-95 transition-all"
            >
              취소
            </button>
            <button
              disabled={!isValid}
              onClick={() => {
                onSave(name, desc);
                setName('');
                setDesc('');
                onClose();
              }}
              className={`flex-[2] py-4 rounded-2xl font-bold text-sm shadow-xl transition-all flex items-center justify-center gap-2 ${
                isValid
                  ? 'bg-[#10B981] text-white active:scale-95'
                  : 'bg-gray-100 text-gray-300'
              }`}
            >
              <CheckCircle2 className="w-5 h-5" />
              저장하기
            </button>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
