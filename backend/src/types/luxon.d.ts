declare module 'luxon' {
  export type DateTimeOptions = {
    zone?: string;
  };

  export class DateTime {
    static fromISO(text: string, opts?: DateTimeOptions): DateTime;
    startOf(unit: 'day'): DateTime;
    plus(duration: { days: number }): DateTime;
    toJSDate(): Date;
    readonly isValid: boolean;
  }
}
