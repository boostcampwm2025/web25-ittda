import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { getPlaiceholder } from 'plaiceholder';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getBlurImg = async (imgSrc: string) => {
  try {
    const buffer = await fetch(imgSrc).then(async (res) =>
      Buffer.from(await res.arrayBuffer()),
    );
    const { base64 } = await getPlaiceholder(buffer, { size: 10 });
    return base64;
  } catch {}
};
