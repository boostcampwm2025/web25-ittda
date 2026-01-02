import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { getPlaiceholder } from 'plaiceholder';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
