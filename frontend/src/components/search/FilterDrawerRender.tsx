import EmotionDrawer from '@/app/(post)/_components/editor/emotion/EmotionDrawer';
import DateDrawer from '../DateDrawer';
import TagSearchDrawer from '@/app/(search)/_components/TagSearchDrawer';

export type FilterDrawerType = 'tag' | 'date' | 'location' | 'emotion' | null;

interface FilterDrawerProps {
  activeDrawer: FilterDrawerType;
  close: () => void;
  tags: string[];
  emotions: string[];
  dateRange: { start: string | null; end: string | null };
  onUpdateUrl: (params: Record<string, string | null>) => void;
  frequentTags?: string[];
}

// 필터링 시 필요한 드로어 가져오는 함수
export function FilterDrawerRenderer({
  activeDrawer,
  close,
  tags,
  emotions,
  dateRange,
  onUpdateUrl,
  frequentTags,
}: FilterDrawerProps) {
  if (!activeDrawer) return;
  switch (activeDrawer) {
    case 'tag':
      return (
        <TagSearchDrawer
          allTags={frequentTags && frequentTags.length > 0 ? frequentTags : []}
          selectedTags={tags}
          onToggleTag={(tag) => {
            const next = tags.includes(tag)
              ? tags.filter((t) => t !== tag)
              : [...tags, tag];
            onUpdateUrl({ tags: next.join(',') });
          }}
          onReset={() => onUpdateUrl({ tags: null })}
          onClose={close}
        />
      );

    case 'emotion':
      return (
        <EmotionDrawer
          isOpen={true}
          selectedEmotion={emotions}
          onSelect={(e) => {
            const next = emotions.includes(e)
              ? emotions.filter((x) => x !== e)
              : [...emotions, e];
            onUpdateUrl({ emotions: next.join(',') });
          }}
          onReset={() => onUpdateUrl({ emotions: null })}
          onClose={close}
          mode="search"
        />
      );

    case 'date':
      return (
        <DateDrawer
          mode="range"
          currentRange={dateRange}
          onSelectRange={(r) => {
            onUpdateUrl({ start: r.start, end: r.end });
            close();
          }}
          onClose={close}
        />
      );
    default:
      return null;
  }
}
