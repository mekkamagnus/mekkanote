import { assertEquals, assertObjectMatch } from "https://deno.land/std@0.192.0/testing/asserts.ts";
import { describe, it, beforeEach, afterEach } from "https://deno.land/std@0.192.0/testing/bdd.ts";
import { spy } from "https://deno.land/std@0.192.0/testing/mock.ts";

import { logger, LogLevel } from './logger.ts';
import { AppError } from '../models/app_error.ts';

describe('Logger', () => {
  let consoleSpy: any;

  beforeEach(() => {
    consoleSpy = spy(console, "log");
  });

  afterEach(() => {
    consoleSpy.restore();
  });

  it('should log info messages in the correct JSON format', () => {
    const context = { userId: '123', requestId: 'abc' };
    logger.info(context, 'This is an info message');
    assertEquals(consoleSpy.calls.length, 1);
    const logObject = JSON.parse(consoleSpy.calls[0].args[0]);
    assertObjectMatch(logObject, {
      level: LogLevel.Info,
      msg: 'This is an info message',
      context: { userId: '123', requestId: 'abc' },
    });
  });

  it('should log warn messages in the correct JSON format', () => {
    const context = { warning: 'deprecated_api_usage' };
    logger.warn(context, 'This is a warning message');
    assertEquals(consoleSpy.calls.length, 1);
    const logObject = JSON.parse(consoleSpy.calls[0].args[0]);
    assertObjectMatch(logObject, {
      level: LogLevel.Warn,
      msg: 'This is a warning message',
      context: { warning: 'deprecated_api_usage' },
    });
  });

  it('should log error messages in the correct JSON format', () => {
    const context = { error: 'database_connection_failed' };
    logger.error(context, 'This is an error message');
    assertEquals(consoleSpy.calls.length, 1);
    const logObject = JSON.parse(consoleSpy.calls[0].args[0]);
    assertObjectMatch(logObject, {
      level: LogLevel.Error,
      msg: 'This is an error message',
      context: { error: 'database_connection_failed' },
    });
  });

  it('should log debug messages in the correct JSON format', () => {
    const context = { debugData: { a: 1, b: 2 } };
    logger.debug(context, 'This is a debug message');
    assertEquals(consoleSpy.calls.length, 1);
    const logObject = JSON.parse(consoleSpy.calls[0].args[0]);
    assertObjectMatch(logObject, {
      level: LogLevel.Debug,
      msg: 'This is a debug message',
      context: { debugData: { a: 1, b: 2 } },
    });
  });

  it('should correctly handle and log AppError objects', () => {
    const appError: AppError = {
      code: 'UNAUTHORIZED',
      message: 'User is not authorized',
      context: { userId: '456' },
    };
    logger.error({error: appError}, 'An application error occurred');
    assertEquals(consoleSpy.calls.length, 1);
    const logObject = JSON.parse(consoleSpy.calls[0].args[0]);
    assertObjectMatch(logObject, {
      level: LogLevel.Error,
      msg: 'An application error occurred',
      context: {
        error: {
          code: 'UNAUTHORIZED',
          message: 'User is not authorized',
          context: { userId: '456' },
        },
      },
    });
  });

  it('should handle various data types in the context object', () => {
    const context = {
      string: 'hello',
      number: 123,
      boolean: true,
      array: [1, 2, 3],
      object: { a: 1 },
    };
    logger.info(context, 'Testing various data types');
    assertEquals(consoleSpy.calls.length, 1);
    const logObject = JSON.parse(consoleSpy.calls[0].args[0]);
    assertObjectMatch(logObject, {
      level: LogLevel.Info,
      msg: 'Testing various data types',
      context: {
        string: 'hello',
        number: 123,
        boolean: true,
        array: [1, 2, 3],
        object: { a: 1 },
      },
    });
  });
});