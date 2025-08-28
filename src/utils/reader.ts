/**
 * Reader: Monad for dependency injection
 * Eliminates tight coupling by injecting dependencies
 */

import { TaskEither } from './task-either.ts'

export interface Reader<R, A> {
  run(deps: R): A
  map<B>(f: (a: A) => B): Reader<R, B>
  flatMap<B>(f: (a: A) => Reader<R, B>): Reader<R, B>
}

export interface ReaderTaskEither<R, E, A> {
  run(deps: R): TaskEither<E, A>
  map<B>(f: (a: A) => B): ReaderTaskEither<R, E, B>
  flatMap<B>(f: (a: A) => ReaderTaskEither<R, E, B>): ReaderTaskEither<R, E, B>
  mapError<F>(f: (e: E) => F): ReaderTaskEither<R, F, A>
  tap(f: (a: A) => Reader<R, void>): ReaderTaskEither<R, E, A>
}

class ReaderImpl<R, A> implements Reader<R, A> {
  constructor(private readonly computation: (deps: R) => A) {}

  run(deps: R): A {
    return this.computation(deps)
  }

  map<B>(f: (a: A) => B): Reader<R, B> {
    return new ReaderImpl((deps: R) => f(this.run(deps)))
  }

  flatMap<B>(f: (a: A) => Reader<R, B>): Reader<R, B> {
    return new ReaderImpl((deps: R) => f(this.run(deps)).run(deps))
  }
}

class ReaderTaskEitherImpl<R, E, A> implements ReaderTaskEither<R, E, A> {
  constructor(private readonly computation: (deps: R) => TaskEither<E, A>) {}

  run(deps: R): TaskEither<E, A> {
    return this.computation(deps)
  }

  map<B>(f: (a: A) => B): ReaderTaskEither<R, E, B> {
    return new ReaderTaskEitherImpl((deps: R) => this.run(deps).map(f))
  }

  flatMap<B>(f: (a: A) => ReaderTaskEither<R, E, B>): ReaderTaskEither<R, E, B> {
    return new ReaderTaskEitherImpl((deps: R) =>
      this.run(deps).flatMap(value => f(value).run(deps))
    )
  }

  mapError<F>(f: (e: E) => F): ReaderTaskEither<R, F, A> {
    return new ReaderTaskEitherImpl((deps: R) => this.run(deps).mapLeft(f))
  }

  tap(f: (a: A) => Reader<R, void>): ReaderTaskEither<R, E, A> {
    return new ReaderTaskEitherImpl((deps: R) =>
      this.run(deps).tap(value => {
        f(value).run(deps)
      })
    )
  }
}

export const Reader = {
  // Pure value that ignores dependencies
  of: <R, A>(value: A): Reader<R, A> =>
    new ReaderImpl(() => value),

  // Access the dependencies
  ask: <R>(): Reader<R, R> =>
    new ReaderImpl((deps: R) => deps),

  // Access part of the dependencies
  asks: <R, A>(f: (deps: R) => A): Reader<R, A> =>
    new ReaderImpl(f),

  // Local modification of dependencies
  local: <R, A>(f: (deps: R) => R, reader: Reader<R, A>): Reader<R, A> =>
    new ReaderImpl((deps: R) => reader.run(f(deps))),

  // Sequence multiple readers
  sequence: <R, A>(readers: readonly Reader<R, A>[]): Reader<R, readonly A[]> =>
    new ReaderImpl((deps: R) => readers.map(reader => reader.run(deps))),

  // All readers with same dependencies
  all: <R, A>(readers: readonly Reader<R, A>[]): Reader<R, readonly A[]> =>
    Reader.sequence(readers),
}

export const ReaderTaskEither = {
  // Pure value that ignores dependencies
  of: <R, E, A>(value: A): ReaderTaskEither<R, E, A> =>
    new ReaderTaskEitherImpl(() => TaskEither.of(value)),

  // Pure error that ignores dependencies
  left: <R, E>(error: E): ReaderTaskEither<R, E, never> =>
    new ReaderTaskEitherImpl(() => TaskEither.left(error)),

  // Access the dependencies
  ask: <R, E>(): ReaderTaskEither<R, E, R> =>
    new ReaderTaskEitherImpl((deps: R) => TaskEither.of(deps)),

  // Access part of the dependencies
  asks: <R, E, A>(f: (deps: R) => A): ReaderTaskEither<R, E, A> =>
    new ReaderTaskEitherImpl((deps: R) => TaskEither.of(f(deps))),

  // Lift a TaskEither into ReaderTaskEither
  lift: <R, E, A>(taskEither: TaskEither<E, A>): ReaderTaskEither<R, E, A> =>
    new ReaderTaskEitherImpl(() => taskEither),

  // Lift a Reader into ReaderTaskEither
  liftReader: <R, E, A>(reader: Reader<R, A>): ReaderTaskEither<R, E, A> =>
    new ReaderTaskEitherImpl((deps: R) => TaskEither.of(reader.run(deps))),

  // Error handling with dependencies
  tryCatch: <R, E, A>(
    f: (deps: R) => Promise<A>,
    onError: (error: unknown) => E,
  ): ReaderTaskEither<R, E, A> =>
    new ReaderTaskEitherImpl((deps: R) => TaskEither.tryCatch(() => f(deps), onError)),

  // Local modification of dependencies
  local: <R, E, A>(
    f: (deps: R) => R,
    readerTE: ReaderTaskEither<R, E, A>,
  ): ReaderTaskEither<R, E, A> =>
    new ReaderTaskEitherImpl((deps: R) => readerTE.run(f(deps))),

  // Sequence multiple reader task eithers
  sequence: <R, E, A>(
    readers: readonly ReaderTaskEither<R, E, A>[],
  ): ReaderTaskEither<R, E, readonly A[]> =>
    new ReaderTaskEitherImpl((deps: R) => {
      const tasks = readers.map(reader => reader.run(deps))
      return TaskEitherUtils.sequence(tasks)
    }),

  // All readers with same dependencies (parallel execution)
  all: <R, E, A>(
    readers: readonly ReaderTaskEither<R, E, A>[],
  ): ReaderTaskEither<R, E, readonly A[]> =>
    new ReaderTaskEitherImpl((deps: R) => {
      const tasks = readers.map(reader => reader.run(deps))
      return TaskEitherUtils.all(tasks)
    }),

  // Right value (alias for of)
  right: <R, E, A>(value: A): ReaderTaskEither<R, E, A> =>
    ReaderTaskEither.of(value),
}

// Common dependency injection patterns
export const readerUtils = {
  // Create a service with dependencies
  service: <R, S>(factory: (deps: R) => S): Reader<R, S> =>
    Reader.asks(factory),

  // Create async service with error handling
  serviceTE: <R, E, S>(
    factory: (deps: R) => TaskEither<E, S>,
  ): ReaderTaskEither<R, E, S> =>
    new ReaderTaskEitherImpl(factory),

  // Inject specific dependency
  inject: <R, K extends keyof R>(key: K): Reader<R, R[K]> =>
    Reader.asks((deps: R) => deps[key]),

  // Conditional execution based on dependency
  when: <R>(
    predicate: (deps: R) => boolean,
    reader: Reader<R, void>,
  ): Reader<R, void> =>
    new ReaderImpl((deps: R) => {
      if (predicate(deps)) {
        reader.run(deps)
      }
    }),

  // With dependency validation
  withValidation: <R, E>(
    validate: (deps: R) => E | null,
    reader: Reader<R, void>,
  ): ReaderTaskEither<R, E, void> =>
    new ReaderTaskEitherImpl((deps: R) => {
      const error = validate(deps)
      if (error) {
        return TaskEither.left(error)
      }
      reader.run(deps)
      return TaskEither.of(undefined as void)
    }),
}

// Import TaskEitherUtils for sequence operations
import { TaskEitherUtils } from './task-either.ts'