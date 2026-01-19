// luxon.d.ts 대신 @types/luxon 패키지 설치로 변경됨
// 이유는 너무 luxon의 제한적인 기능만 가져와서

// declare module 'luxon' {
//   export type DateTimeOptions = {
//     zone?: string;
//   };

//   export class DateTime {
//     static fromISO(text: string, opts?: DateTimeOptions): DateTime;
//     startOf(unit: 'day'): DateTime;
//     plus(duration: { days: number }): DateTime;
//     toJSDate(): Date;
//     readonly isValid: boolean;
//   }
// }
