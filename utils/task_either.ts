// utils/task_either.ts
import { Either, left, right } from './either.ts';
import { logger } from './logger.ts';
import { AppError } from '../models/app_error.ts';

export type TaskEither<E, A> = () => Promise<Either<E, A>>;

export const fromEither = <E, A>(ma: Either<E, A>): TaskEither<E, A> => () => Promise.resolve(ma);

export const tryCatch = <E, A>(
  f: () => Promise<A>,
  onRejected: (reason: unknown) => E
): TaskEither<E, A> => async () => {
  try {
    return right(await f());
  } catch (error) {
    return left(onRejected(error));
  }
};

export const tryCatchWithLogging = <A>(
  f: () => Promise<A>,
  onRejected: (reason: unknown) => AppError
): TaskEither<AppError, A> => async () => {
  try {
    return right(await f());
  } catch (error) {
    const appError = onRejected(error);
    logger.error({ error: appError }, appError.message);
    return left(appError);
  }
};
