export default function WritingRecordStatistics() {
  const writingData = {
    writtenRecords: 172,
    addedImage: 146, // 이미지
  };

  return (
    <>
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-[13px] font-bold dark:text-white text-itta-black">
          작성 기록 통계
        </h2>
      </div>

      <div className="py-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-medium dark:text-gray-300 text-[#555555]">
              작성한 기록
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-[16px] font-semibold dark:text-white text-[#222222]">
                {writingData.writtenRecords}
              </span>
              <span className="text-[12px] font-medium text-gray-400">개</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-medium dark:text-gray-300 text-[#555555]">
              추가한 이미지
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-[16px] font-semibold dark:text-white text-[#222222]">
                {writingData.addedImage}
              </span>
              <span className="text-[12px] font-medium text-gray-400">개</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
