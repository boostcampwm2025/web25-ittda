import os from 'node:os';
import type { TransformableInfo } from 'logform';
import { format, addColors } from 'winston';

type LogFormatterOptions = {
  useColors?: boolean;
};

const { combine, timestamp, errors, splat, printf } = format;
const DEFAULT_TIMESTAMP_FORMAT = 'YYYY-MM-DDTHH:mm:ss';

const LOG_LEVEL_COLORS: Record<string, string> = {
  error: 'red bold',
  warn: 'yellow',
  info: 'blue',
  http: 'cyan',
  verbose: 'white',
  debug: 'magenta',
  silly: 'gray',
};

addColors(LOG_LEVEL_COLORS);
const levelColorizer = format.colorize();

/**
 * winston 포맷 구성을 생성한다.
 *
 * @param options 포맷 옵션
 * @param options.useColors 컬러 사용 여부
 * @returns winston 포맷 컴바이너
 */
export const createLogFormat = (options: LogFormatterOptions = {}) => {
  const { useColors = false } = options;

  return combine(
    timestamp({ format: DEFAULT_TIMESTAMP_FORMAT }),
    errors({ stack: true }),
    splat() /* 추가 인수를 배열로 포맷팅 (...args) */,
    printf(
      (info: TransformableInfo & { context?: unknown; stack?: string }) => {
        const {
          level,
          message,
          timestamp: time,
          stack,
          context,
          ...rest
        } = info;

        const levelLabel = formatLevelLabel(level, useColors);
        const timeLabel = resolveTimestamp(time);
        const base = `[${levelLabel}] ${timeLabel}`;

        const contextLabel = stringifyContext(context);
        const payload = resolvePayload(message, stack);
        const metadata = stringifyMetadata(rest as Record<string, unknown>);

        return `${base}${contextLabel ? ` ${contextLabel}` : ''} ${payload}${metadata}${os.EOL}${os.EOL}`;
      },
    ),
  );
};

/**
 * 실행 환경을 기반으로 기본 로그 레벨을 결정한다.
 *
 * @returns 로그 레벨 문자열 (개발 모드일 때는 debug(기본값), 운영 모드일 때는 info)
 */
export const resolveLogLevel = (): string => {
  return (
    process.env.LOG_LEVEL ??
    (process.env.NODE_ENV === 'production' ? 'info' : 'debug')
  );
};

/**
 * 로깅 컨텍스트 정보를 문자열로 변환한다.
 *
 * @param input 컨텍스트 값 (undefined 또는 null일 때는 빈 문자열 반환)
 * @returns 문자열화된 컨텍스트
 */
const stringifyContext = (input: unknown): string => {
  if (input === undefined || input === null) {
    return '';
  }

  return typeof input === 'string' ? input : JSON.stringify(input);
};

/**
 * 로깅 메타데이터를 문자열로 직렬화한다.
 *
 * @param metadata 로그 메타데이터 객체
 * @returns 직렬화된 메타데이터 문자열
 */
const stringifyMetadata = (metadata: Record<string, unknown>): string => {
  const entries = Object.entries(metadata);

  if (entries.length === 0) {
    return '';
  }

  return ` ${JSON.stringify(Object.fromEntries(entries))}`;
};

const formatLevelLabel = (level: unknown, useColors: boolean): string => {
  const baseLevel = normalizeLevel(level);
  const normalized = baseLevel.toUpperCase();

  if (!useColors) {
    return normalized;
  }

  return levelColorizer.colorize(baseLevel, normalized);
};

/**
 * 로그 레벨을 정규화한다.
 *
 * @param level 로그 레벨
 * @returns 정규화된 로그 레벨
 */
const normalizeLevel = (level: unknown): string => {
  if (typeof level === 'string' && level.length > 0) {
    return level;
  }

  if (level === null || level === undefined) {
    return 'UNKNOWN';
  }

  if (typeof level === 'object' && 'toString' in level) {
    const value = (level as { toString: () => unknown }).toString();
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }
  }

  return 'UNKNOWN';
};

const resolveTimestamp = (time?: unknown): string => {
  if (typeof time === 'string' && time.length > 0) {
    return time;
  }

  return new Date().toISOString().slice(0, 19);
};

const resolvePayload = (message: unknown, stack?: string): string => {
  if (typeof stack === 'string') {
    return stack;
  }
  if (typeof message === 'string') {
    return message;
  }
  return JSON.stringify(message);
};
