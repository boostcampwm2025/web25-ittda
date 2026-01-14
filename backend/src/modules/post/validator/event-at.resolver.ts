import { BadRequestException } from '@nestjs/common';

type ResolveEventAtOptions = {
  timezoneOffset?: string; // e.g. "+09:00"
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}(:\d{2})?$/;
const TZ_RE = /^[+-]\d{2}:\d{2}$/;

export function resolveEventAtFromBlocks(
  date: string,
  time: string,
  options: ResolveEventAtOptions = {},
): Date {
  const { timezoneOffset = '+09:00' } = options;

  if (!DATE_RE.test(date)) {
    throw new BadRequestException(`DATE must be YYYY-MM-DD (got ${date})`);
  }
  if (!TIME_RE.test(time)) {
    throw new BadRequestException(
      `TIME must be HH:mm or HH:mm:ss (got ${time})`,
    );
  }
  if (!TZ_RE.test(timezoneOffset)) {
    throw new BadRequestException(
      `timezoneOffset must be ±HH:MM (got ${timezoneOffset})`,
    );
  }

  const t = time.length === 5 ? `${time}:00` : time;
  const iso = `${date}T${t}${timezoneOffset}`;
  const d = new Date(iso);

  if (Number.isNaN(d.getTime())) {
    throw new BadRequestException(`Invalid DATE/TIME (built: ${iso})`);
  }
  return d;
}
