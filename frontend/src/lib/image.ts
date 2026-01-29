// import { getPlaiceholder } from 'plaiceholder';

// export const getBlurImg = async (imgSrc: string) => {
//   try {
//     const buffer = await fetch(imgSrc).then(async (res) =>
//       Buffer.from(await res.arrayBuffer()),
//     );
//     const { base64 } = await getPlaiceholder(buffer, { size: 10 });
//     return base64;
//   } catch {}
// };

export const randomBaseImage = (id: string) => {
  // id 문자열의 각 문자 코드를 합산하여 인덱스 계산
  const charSum = id
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const index = (charSum % 8) + 1; // 1부터 8 사이의 숫자
  return `/gemini_base${index}.png`;
};
