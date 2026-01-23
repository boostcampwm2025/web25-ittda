import ProfileAllTagsHeaderActions from './_components/ProfileAllTagsHeaderActions';
import TagList from './_components/TagList';

const data = {
  nickname: '도비',
  tags: {
    recent: [
      { tag: '아침', count: 1 },
      { tag: '좋은글', count: 1 },
      { tag: '점심', count: 1 },
      { tag: '커피', count: 1 },
      { tag: '식사', count: 1 },
    ],
    frequent: [
      { tag: '산책', count: 12 },
      { tag: '성수동', count: 8 },
      { tag: '맛집', count: 7 },
      { tag: '가족', count: 5 },
      { tag: '주말', count: 4 },
    ],
    all: [
      { tag: '산책', count: 12 },
      { tag: '성수동', count: 8 },
      { tag: '맛집', count: 7 },
      { tag: '가족', count: 5 },
      { tag: '아침', count: 1 },
      { tag: '좋은글', count: 1 },
      { tag: '점심', count: 1 },
      { tag: '커피', count: 1 },
      { tag: '식사', count: 1 },
      { tag: '주말', count: 4 },
      { tag: '독서', count: 3 },
      { tag: '영화', count: 6 },
      { tag: '데이트', count: 9 },
      { tag: '운동', count: 2 },
      { tag: '여행', count: 11 },
    ],
  },
};

export default function ProfileAllTagsPage() {
  return (
    <div className="w-full flex flex-col min-h-screen dark:bg-[#121212] dark:text-white bg-white text-itta-black">
      <ProfileAllTagsHeaderActions />

      <div className="p-5">
        <div className="rounded-xl p-6 transition-colors dark:bg-white/5 bg-gray-50">
          <p className="text-[14px] leading-relaxed mb-1 dark:text-gray-400 text-gray-500">
            <span className="font-bold">{data.nickname}</span> 님은
          </p>
          <p className="text-[14px] leading-relaxed dark:text-gray-400 text-gray-500">
            <span className="font-black text-itta-black dark:text-white">
              {data.tags.all.length}
            </span>
            &nbsp;개의 태그를 사용하고 있어요.
          </p>
        </div>

        <TagList tags={data.tags} />
      </div>
    </div>
  );
}
