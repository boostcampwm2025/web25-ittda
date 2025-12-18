import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/*
TailwindCSS 클래스 문자열을 안전하게 합치고, 중복 충돌을 해결하는 도우미

clsx)
여러 개의 클래스 이름을 조건부로 합쳐주는 라이브러리.
null, undefined, false 같은 값은 자동으로 무시.

예: clsx("btn", isActive && "btn-active", false && "hidden") 
// 결과: "btn btn-active"

twMerge)
TailwindCSS 전용 클래스 충돌 해결 라이브러리.
같은 속성 계열 클래스가 중복되면 마지막 값으로 덮어쓰기.

예:twMerge("p-2 p-4") // 결과: "p-4"
twMerge("text-sm text-lg") // 결과: "text-lg"

cn(classname) 함수)
clsx와 twMerge를 결합한 헬퍼.
조건부 클래스 병합 + Tailwind 충돌 해결을 동시에 수행.
*/
