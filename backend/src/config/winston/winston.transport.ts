import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { transports } from 'winston';
import type Transport from 'winston-transport';
import DailyRotateFile from 'winston-daily-rotate-file';
import { createLogFormat } from './winston.config';

type TransportFactoryOptions = {
  level: string;
  consoleLevel?: string;
  logDirectory?: string;
  enableFileTransport?: boolean;
  fileNamePattern?: string;
  datePattern?: string;
  maxSize?: string;
  maxFiles?: string;
};

const LOG_DIRECTORY_FALLBACK = path.join(process.cwd(), 'logs');
const DEFAULT_FILE_NAME_PATTERN = 'application-%DATE%.log';
const DEFAULT_DATE_PATTERN = 'YYYY-MM-DD';
const DEFAULT_MAX_SIZE = '20m';
const DEFAULT_MAX_FILES = '14d';

/**
 * 목표 디렉터리가 존재하는지 검사하고 없으면 생성한다.
 *
 * @param target 생성할 디렉터리 경로
 */
const ensureDirectory = (target: string) => {
  if (!existsSync(target)) {
    mkdirSync(target, { recursive: true });
  }
};

/**
 * 콘솔 트랜스포트를 생성한다.
 *
 * @param level 로그 레벨
 * @returns winston 콘솔 트랜스포트
 */
const createConsole = (level: string) =>
  new transports.Console({
    level,
    format: createLogFormat({ useColors: true }),
  });

/**
 * 일별 회전 파일 트랜스포트를 생성한다.
 *
 * @param options 트랜스포트 생성 옵션
 * @returns winston daily rotate file 트랜스포트
 */
const createDailyRotateFileTransport = ({
  level,
  logDirectory,
  fileNamePattern = DEFAULT_FILE_NAME_PATTERN,
  datePattern = DEFAULT_DATE_PATTERN,
  maxSize = DEFAULT_MAX_SIZE,
  maxFiles = DEFAULT_MAX_FILES,
}: TransportFactoryOptions) => {
  const dirname = logDirectory ?? LOG_DIRECTORY_FALLBACK;
  ensureDirectory(dirname);

  return new DailyRotateFile({
    level,
    dirname,
    filename: fileNamePattern,
    datePattern,
    zippedArchive: true,
    maxSize,
    maxFiles,
    format: createLogFormat(),
  });
};

/**
 * 콘솔 및 파일 트랜스포트 컬렉션을 반환한다.
 *
 * @param options 트랜스포트 생성 옵션
 * @returns 트랜스포트 배열
 */
export const createTransports = (
  options: TransportFactoryOptions,
): Transport[] => {
  const consoleLevel = options.consoleLevel ?? options.level;
  const transportsList: Transport[] = [createConsole(consoleLevel)];

  if (options.enableFileTransport ?? true) {
    transportsList.push(createDailyRotateFileTransport(options));
  }

  return transportsList;
};

export const LOG_DIRECTORY = LOG_DIRECTORY_FALLBACK;
