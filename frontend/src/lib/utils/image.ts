/**
 * 이미지 파일(File) 객체로부터 원본 이미지의 가로, 세로 추출
 * * @param {File} file - 분석할 이미지 파일 객체 (PNG, JPG, WebP 등)
 * @returns {Promise<{ width: number; height: number }>} 이미지의 너비와 높이를 포함한 객체를 반환하는 Promise
 * * @description
 * 1. URL.createObjectURL을 통해 파일의 임시 경로 생성
 * 2. 브라우저의 Image 객체를 사용하여 이미지를 가상으로 로드
 * 3. 로드가 완료되면 가로/세로 값을 추출하고, 생성했던 임시 URL을 해제하여 메모리 관리
 */
export const getImageDimensions = (
  file: File,
): Promise<{ width: number; height: number }> => {
  return new Promise((resolve) => {
    const img = new Image();

    img.onload = () => {
      // 이미지 로드가 완료되면 실제 너비와 높이 resolve
      resolve({ width: img.width, height: img.height });

      // 사용이 끝난 Object URL을 해제 = 메모리 누수 방지
      URL.revokeObjectURL(img.src);
    };

    // 파일 객체를 브라우저에서 접근 가능한 임시 URL로 변환
    img.src = URL.createObjectURL(file);
  });
};
