import { AppError } from '../models/app_error.ts';

export enum LogLevel {
  Info = 'info',
  Warn = 'warn',
  Error = 'error',
  Debug = 'debug',
}

export interface Logger {
  info<T extends object>(context: T, message: string): void;
  error<T extends object>(context: T, message: string): void;
  warn<T extends object>(context: T, message: string): void;
  debug<T extends object>(context: T, message: string): void;
}

const log = (level: LogLevel, context: object, message: string) => {
  const logObject = {
    level,
    time: new Date().toISOString(),
    pid: Deno.pid,
    hostname: Deno.hostname(),
    msg: message,
    context,
  };
  console.log(JSON.stringify(logObject));
};

export const logger: Logger = {
  info: (context, message) => log(LogLevel.Info, context, message),
  warn: (context, message) => log(LogLevel.Warn, context, message),
  error: (context, message) => log(LogLevel.Error, context, message),
  debug: (context, message) => log(LogLevel.Debug, context, message),
};
