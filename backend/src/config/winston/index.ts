import type { LoggerOptions } from 'winston';
import { createTransports } from './winston.transport';
import { resolveLogLevel } from './winston.config';

type CreateLoggerOptions = {
  level?: string /* 로그 레벨 */;
  consoleLevel?: string /* 콘솔 전용 로그 레벨 (기본값: 개발 모드 debug, 운영 모드 level과 동일) */;
  enableFileTransport?: boolean /* 로그 파일 전송 여부 (false면 콘솔만 작성) */;
  logDirectory?: string /* 로그 디렉토리 */;
  fileNamePattern?: string /* 로그 파일 이름 패턴 */;
  datePattern?: string /* 로그 파일 날짜 패턴 */;
  maxSize?: string /* 로그 파일 최대 크기 */;
  maxFiles?: string /* 로그 파일 최대 개수 */;
};

/**
 * winston 로거 옵션을 생성한다.
 *
 * @param options 로거 생성 옵션
 * @returns winston 로거 옵션
 */
export const createLoggerOptions = (
  options: CreateLoggerOptions = {},
): LoggerOptions => {
  const level = options.level ?? resolveLogLevel();
  const consoleLevel =
    options.consoleLevel ??
    (process.env.NODE_ENV === 'production' ? level : 'debug');

  return {
    level,
    transports: createTransports({
      level,
      consoleLevel,
      enableFileTransport: options.enableFileTransport,
      logDirectory: options.logDirectory,
      fileNamePattern: options.fileNamePattern,
      datePattern: options.datePattern,
      maxSize: options.maxSize,
      maxFiles: options.maxFiles,
    }),
  };
};

export type { CreateLoggerOptions };
export { LOG_DIRECTORY } from './winston.transport';
export { createLogFormat, resolveLogLevel } from './winston.config';
