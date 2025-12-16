export default function SimpleMemo() {
  return (
    <div className="border border-itta-gray2 px-5.5 py-4.5 text-sm min-w-0">
      <p
        className="max-w-full leading-normal line-clamp-4"
        style={{
          display: '-webkit-box',
          WebkitLineClamp: 4,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        여기는 오늘 작성한 메모를 출력하는 곳입니다. 여기는 오늘 작성한 메모를
        출력하는 곳입니다. 여기는 오늘 작성한 메모를 출력하는 곳입니다. 여기는
        오늘 작성한 메모를 출력하는 곳입니다.
      </p>
    </div>
  );
}
