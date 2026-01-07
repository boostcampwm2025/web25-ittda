'use client';

import CompactFieldRenderer from '@/app/(main)/_components/CompactFieldRenderer';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { MemoryRecord } from '@/lib/types/record';
import { AlertCircle, Clock } from 'lucide-react';
import { useState } from 'react';
import DailyDetailRecordActions from './DailyDetailRecordActions';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Member } from '@/lib/types/group';

interface DailyDetailRecordItemProps {
  record: MemoryRecord;
  groupId?: string;
  members?: Member[];
}

export default function DailyDetailRecordItem({
  record,
  groupId,
  members,
}: DailyDetailRecordItemProps) {
  const [deleteTarget, setDeleteTarget] = useState<MemoryRecord | null>(null);
  const router = useRouter();

  const handleDelete = () => {
    if (!deleteTarget) return;
    // TODO: 실제 삭제 로직 구현
    setDeleteTarget(null);
    // TODO: 삭제 후 알림 toast 필요
    // alert('기록이 삭제되었습니다.');
  };

  const handleRecordClick = (recordId: string) => {
    if (groupId) {
      router.push(`/group/${groupId}/record/${recordId}`);
    } else {
      router.push(`/record/${recordId}`);
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-[11px] font-medium text-gray-600 dark:text-gray-300 uppercase">
              {record.data.time}
            </span>
          </div>
          <div className="relative">
            <DailyDetailRecordActions
              record={record}
              onDeleteClick={setDeleteTarget}
            />
          </div>
        </div>
        <div
          onClick={() => handleRecordClick(record.id)}
          className="rounded-2xl p-5 border shadow-sm cursor-pointer active:scale-[0.99] transition-all overflow-hidden dark:bg-[#1E1E1E] dark:border-white/5 bg-white border-gray-100/60"
        >
          <div className="w-full flex justify-between items-center gap-2 mb-4">
            <h4 className="text-[15px] font-bold truncate dark:text-gray-200 text-itta-black">
              {record.title}
            </h4>

            <div className="flex -space-x-2">
              {members?.slice(0, 3).map((m) => (
                <Image
                  key={m.id}
                  src={m.avatar}
                  width={50}
                  height={50}
                  className="w-8 h-8 rounded-full border-2 shadow-sm bg-white dark:border-[#121212] border-white"
                  alt={m.name}
                />
              ))}
              {members && members.length > 3 && (
                <div className="w-8 h-8 rounded-full border-2 shadow-sm bg-gray-100 dark:bg-gray-800 dark:border-[#121212] border-white flex items-center justify-center">
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                    +{members.length - 3}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div>
            {record.fieldOrder.map((fieldType) => (
              <CompactFieldRenderer
                key={fieldType}
                type={fieldType}
                data={record.data[fieldType] as never}
              />
            ))}
          </div>
        </div>
      </div>

      <Drawer
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DrawerContent className="w-full px-8 pt-4 pb-10">
          <DrawerHeader className="flex flex-col items-center text-center space-y-4 mb-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center dark:bg-red-500/10 dark:text-red-500 bg-red-50 text-red-500">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div className="space-y-3">
              <DrawerTitle className="text-xl font-bold dark:text-white text-itta-black">
                {`'${record.title}'`}
                <br />
                기록을 삭제할까요?
              </DrawerTitle>
              <p className="text-sm text-gray-400 font-medium text-center">
                이 날의 소중한 추억이 사라집니다.
              </p>
            </div>
          </DrawerHeader>

          <div className="flex gap-4">
            <DrawerClose className="cursor-pointer flex-1 py-4 rounded-2xl text-sm font-bold transition-all dark:bg-white/5 dark:text-gray-500 bg-gray-100 text-gray-500 active:bg-gray-200">
              취소
            </DrawerClose>
            <DrawerClose
              onClick={handleDelete}
              className="cursor-pointer flex-2 py-4 rounded-2xl text-sm font-bold shadow-xl shadow-red-500/20 active:scale-95 transition-all bg-red-500 text-white"
            >
              삭제하기
            </DrawerClose>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
