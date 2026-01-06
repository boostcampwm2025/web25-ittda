import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { LocationMode, LocationPicker } from './LocationPicker';
import { LocationValue } from '@/lib/types/recordField';

interface Props {
  mode: LocationMode;
  onSelect: (data: LocationValue) => void;
  onClose: () => void;
}

export default function LocationDrawer({ mode, onSelect, onClose }: Props) {
  return (
    <Drawer open onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-w-2xl mx-auto">
        <DrawerHeader className="border-b">
          <DrawerTitle className="text-center">
            {mode === 'search' ? '검색 지역 설정' : '장소 선택'}
          </DrawerTitle>
        </DrawerHeader>
        <LocationPicker mode={mode} onSelect={onSelect} />
      </DrawerContent>
    </Drawer>
  );
}
