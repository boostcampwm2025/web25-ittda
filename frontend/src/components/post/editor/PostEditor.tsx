'use client';

import { useState, useRef } from 'react';
import { GripVertical } from 'lucide-react';
import PostEditorHeader from './PostEditorHeader';
import PostTitleInput from './PostTitleInput';
import { Emotion, FieldType, MemoryRecord } from '@/lib/types/post';
import DatePickerDrawer from './core/DatePickerDrawer';
import TimePickerDrawer from './core/TimePickerDrawer';
import Toolbar from './Toolbar';
import TagDrawer from './tag/TagDrawer';
import RatingDrawer from './rating/RatingPickerDrawer';
import PhotoDrawer from './photo/PhotoDrawer';
import { RatingField } from './rating/RatingField';
import { TagField } from './tag/TagField';
import { PhotoField } from './photo/PhotoField';
import { ContentField, DateField, TimeField } from './core/CoreField';
import { formatDateDot, formatTime } from '@/lib/date';
import { EmotionField } from './emotion/EmotionField';
import EmotionDrawer from './emotion/EmotionDrawer';
import { TableField } from './table/TableField';

interface PostEditorProps {
  mode: 'add' | 'edit';
  initialPost?: MemoryRecord;
}

export default function PostEditor({ mode, initialPost }: PostEditorProps) {
  const [title, setTitle] = useState(initialPost?.title ?? '');
  const [fieldOrder, setFieldOrder] = useState<FieldType[]>(
    initialPost?.fieldOrder ?? ['date', 'time', 'content'],
  );

  const [date, setDate] = useState(
    initialPost?.data?.date ?? formatDateDot(new Date()),
  );
  const [time, setTime] = useState(
    initialPost?.data?.time ?? formatTime(new Date()),
  );
  const [content, setContent] = useState(initialPost?.data?.content ?? '');
  const [photos, setPhotos] = useState<string[]>(
    initialPost?.data?.photos ?? [],
  );
  const [emotion, setEmotion] = useState<Emotion | null>(
    initialPost?.data?.emotion ?? null,
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(
    initialPost?.data?.tags ?? [],
  );
  const [rating, setRating] = useState(
    initialPost?.data?.rating ?? { value: 0, max: 5 },
  );
  const [table, setTable] = useState<string[][] | null>(
    initialPost?.data?.table ?? null,
  );

  const [activeDrawer, setActiveDrawer] = useState<
    'date' | 'time' | 'tag' | 'rating' | 'photo' | 'emotion' | null
  >(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragItem = useRef<number | null>(null);
  const [isDraggingIndex, setIsDraggingIndex] = useState<number | null>(null);

  const ensureFieldInOrder = (type: FieldType) => {
    if (!fieldOrder.includes(type)) {
      setFieldOrder((prev) => [...prev, type]);
    }
  };

  const removeFieldFromLayout = (type: FieldType) => {
    setFieldOrder((prev) => prev.filter((item) => item !== type));
  };

  const handleDragStart = (index: number) => {
    dragItem.current = index;
    setIsDraggingIndex(index);
  };

  const handleDragEnter = (index: number) => {
    if (dragItem.current === null || dragItem.current === index) return;
    const newOrder = [...fieldOrder];
    const draggedItemContent = newOrder.splice(dragItem.current, 1)[0];
    newOrder.splice(index, 0, draggedItemContent);
    dragItem.current = index;
    setFieldOrder(newOrder);
  };

  const handleDragEnd = () => {
    dragItem.current = null;
    setIsDraggingIndex(null);
  };

  // 사진 업로드 핸들러
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setPhotos((prev) => [...prev, event.target!.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
      ensureFieldInOrder('photos');
    }
  };

  // 테이블 추가 핸들러
  const handleAddTable = () => {
    if (!table) {
      // 초기 2x2 테이블 생성
      setTable([
        ['', ''],
        ['', ''],
      ]);
    }
    ensureFieldInOrder('table');
  };

  const handleSave = async () => {
    try {
      const payload = {
        title,
        date,
        time,
        photos,
        selectedTags,
        rating,
        fieldOrder,
        content,
        table,
      };
      // TODO : API 호출
    } finally {
    }
  };

  const renderField = (type: FieldType) => {
    switch (type) {
      case 'date':
        return (
          <DateField date={date} onClick={() => setActiveDrawer('date')} />
        );
      case 'time':
        return (
          <TimeField time={time} onClick={() => setActiveDrawer('time')} />
        );
      case 'content':
        return <ContentField value={content} onChange={setContent} />;
      case 'photos':
        return (
          <PhotoField
            photos={photos}
            onClick={() => setActiveDrawer('photo')}
          />
        );
      case 'emotion':
        return (
          <EmotionField
            emotion={emotion}
            onClick={() => setActiveDrawer('emotion')}
            onRemove={() => {
              setEmotion(null);
              removeFieldFromLayout('emotion');
            }}
          />
        );
      case 'tags':
        return (
          <TagField
            tags={selectedTags}
            onRemove={(tag) => {
              const newTags = selectedTags.filter((t) => t !== tag);
              setSelectedTags(newTags);
              if (newTags.length === 0) removeFieldFromLayout('tags');
            }}
            onAdd={() => setActiveDrawer('tag')}
          />
        );
      case 'table':
        return (
          <TableField
            data={table}
            onUpdate={(newData) => {
              setTable(newData);
              if (!newData) removeFieldFromLayout('table');
            }}
          />
        );
      case 'rating':
        return (
          <RatingField
            value={rating.value}
            max={rating.max}
            onClick={() => setActiveDrawer('rating')}
            onRemove={() => {
              setRating({ ...rating, value: 0 });
              removeFieldFromLayout('rating');
            }}
          />
        );
      default:
        return null;
    }
  };

  const renderActiveDrawer = () => {
    switch (activeDrawer) {
      case 'date':
        return (
          <DatePickerDrawer
            currentDate={date}
            onSelect={(d) => {
              setDate(d);
              ensureFieldInOrder('date');
            }}
            onClose={() => setActiveDrawer(null)}
          />
        );
      case 'time':
        return (
          <TimePickerDrawer
            currentTime={time}
            onSave={(t) => {
              setTime(t);
              ensureFieldInOrder('time');
            }}
            onClose={() => setActiveDrawer(null)}
          />
        );
      case 'tag':
        return (
          <TagDrawer
            tags={selectedTags}
            previousTags={['식단', '운동']}
            onUpdateTags={(newTags) => {
              setSelectedTags(newTags);
              if (newTags.length > 0) {
                ensureFieldInOrder('tags');
              } else {
                removeFieldFromLayout('tags');
              }
            }}
            onClose={() => setActiveDrawer(null)}
          />
        );
      case 'rating':
        return (
          <RatingDrawer
            rating={rating}
            onUpdateRating={(newRating) => {
              setRating(newRating);
              if (newRating.value > 0) {
                ensureFieldInOrder('rating');
              } else {
                removeFieldFromLayout('rating');
              }
            }}
            onClose={() => setActiveDrawer(null)}
          />
        );
      case 'photo':
        return (
          <PhotoDrawer
            photos={photos}
            onUploadClick={() => fileInputRef.current?.click()}
            onRemovePhoto={(idx) => {
              const newPhotos = photos.filter((_, i) => i !== idx);
              setPhotos(newPhotos);
              if (newPhotos.length === 0) removeFieldFromLayout('photos');
            }}
            onRemoveAll={() => {
              setPhotos([]);
              removeFieldFromLayout('photos');
            }}
            onClose={() => setActiveDrawer(null)}
          />
        );
      case 'emotion':
        return (
          <EmotionDrawer
            selectedEmotion={emotion}
            onSelect={(emo) => {
              setEmotion(emo);
              ensureFieldInOrder('emotion');
            }}
            onClose={() => setActiveDrawer(null)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full flex flex-col min-h-screen bg-white dark:bg-[#121212]">
      <PostEditorHeader
        mode={mode}
        onBack={() => window.history.back()}
        onSave={handleSave}
      />
      <main className="px-6 py-6 space-y-8 pb-48 overflow-y-auto">
        <PostTitleInput value={title} onChange={setTitle} />
        <div className="flex flex-col gap-4">
          {fieldOrder.map((type, index) => (
            <div
              key={type}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragEnter={() => handleDragEnter(index)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => e.preventDefault()}
              className={`relative pl-10 transition-all group/field ${isDraggingIndex === index ? 'opacity-40 scale-105 z-10' : 'opacity-100'}`}
            >
              <div className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-full opacity-30 group-hover/field:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                <GripVertical className="w-4 h-4 text-gray-400" />
              </div>
              {renderField(type)}
            </div>
          ))}
        </div>
      </main>
      <Toolbar
        onTagClick={() => setActiveDrawer('tag')}
        onRatingClick={() => setActiveDrawer('rating')}
        onPhotoClick={() => setActiveDrawer('photo')}
        onEmotionClick={() => setActiveDrawer('emotion')}
        onTableClick={handleAddTable}
      />
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        multiple
        accept="image/*"
        onChange={handlePhotoUpload}
      />
      {renderActiveDrawer()}
    </div>
  );
}
