/**
 * TaskEither: Combines lazy evaluation with explicit error handling for async operations
 * Following functional-patterns-guidelines.md specifications
 */

export interface TaskEither<E, A> {
  run(): Promise<Either<E, A>>
  map<B>(f: (a: A) => B): TaskEither<E, B>
  flatMap<B>(f: (a: A) => TaskEither<E, B>): TaskEither<E, B>
  mapLeft<F>(f: (e: E) => F): TaskEither<F, A>
  recover<B>(f: (e: E) => TaskEither<E, B>): TaskEither<E, A | B>
  tap(f: (a: A) => void): TaskEither<E, A>
}

export interface Either<E, A> {
  isLeft(): this is Left<E>
  isRight(): this is Right<A>
  value: E | A
}

export interface Left<E> extends Either<E, never> {
  readonly _tag: 'Left'
  readonly value: E
}

export interface Right<A> extends Either<never, A> {
  readonly _tag: 'Right'
  readonly value: A
}

class TaskEitherImpl<E, A> implements TaskEither<E, A> {
  constructor(private readonly computation: () => Promise<Either<E, A>>) {}

  async run(): Promise<Either<E, A>> {
    return await this.computation()
  }

  map<B>(f: (a: A) => B): TaskEither<E, B> {
    return new TaskEitherImpl(async () => {
      const result = await this.run()
      return result.isRight() ? Either.right(f(result.value)) : result
    })
  }

  flatMap<B>(f: (a: A) => TaskEither<E, B>): TaskEither<E, B> {
    return new TaskEitherImpl(async () => {
      const result = await this.run()
      if (result.isLeft()) return result
      return await f(result.value).run()
    })
  }

  mapLeft<F>(f: (e: E) => F): TaskEither<F, A> {
    return new TaskEitherImpl(async () => {
      const result = await this.run()
      return result.isLeft() ? Either.left(f(result.value)) : result
    })
  }

  recover<B>(f: (e: E) => TaskEither<E, B>): TaskEither<E, A | B> {
    return new TaskEitherImpl(async () => {
      const result = await this.run()
      if (result.isLeft()) {
        const recovered = await f(result.value).run()
        return recovered.isRight() ? Either.right(recovered.value) : result
      }
      return result
    })
  }

  tap(f: (a: A) => void): TaskEither<E, A> {
    return new TaskEitherImpl(async () => {
      const result = await this.run()
      if (result.isRight()) {
        f(result.value)
      }
      return result
    })
  }
}

// Either implementation
export const Either = {
  left: <E>(value: E): Either<E, never> => ({
    _tag: 'Left' as const,
    value,
    isLeft: () => true,
    isRight: () => false,
  }),

  right: <A>(value: A): Either<never, A> => ({
    _tag: 'Right' as const,
    value,
    isLeft: () => false,
    isRight: () => true,
  }),
}

// TaskEither constructors and utilities
export const TaskEither = {
  of: <A>(value: A): TaskEither<never, A> =>
    new TaskEitherImpl(async () => Either.right(value)),

  left: <E>(error: E): TaskEither<E, never> =>
    new TaskEitherImpl(async () => Either.left(error)),

  right: <A>(value: A): TaskEither<never, A> =>
    new TaskEitherImpl(async () => Either.right(value)),

  tryCatch: <E, A>(
    f: () => Promise<A>,
    onError: (error: unknown) => E,
  ): TaskEither<E, A> =>
    new TaskEitherImpl(async () => {
      try {
        const result = await f()
        return Either.right(result)
      } catch (error) {
        return Either.left(onError(error))
      }
    }),

  fromPromise: <A>(promise: Promise<A>): TaskEither<unknown, A> =>
    new TaskEitherImpl(async () => {
      try {
        const result = await promise
        return Either.right(result)
      } catch (error) {
        return Either.left(error)
      }
    }),
}

// Utility functions for common operations
export const TaskEitherUtils = {
  // File operations
  readFile: (path: string): TaskEither<string, string> =>
    TaskEither.tryCatch(
      async () => {
        const text = await Deno.readTextFile(path)
        return text
      },
      (error) => `Failed to read file: ${error}`,
    ),

  writeFile: (path: string, content: string): TaskEither<string, void> =>
    TaskEither.tryCatch(
      async () => {
        await Deno.writeTextFile(path, content)
      },
      (error) => `Failed to write file: ${error}`,
    ),

  // JSON operations
  parseJSON: <T>(json: string): TaskEither<string, T> =>
    TaskEither.tryCatch(
      async () => JSON.parse(json) as T,
      (error) => `JSON parse error: ${error}`,
    ),

  stringifyJSON: <T>(value: T): TaskEither<string, string> =>
    TaskEither.tryCatch(
      async () => JSON.stringify(value, null, 2),
      (error) => `JSON stringify error: ${error}`,
    ),

  // Retry with exponential backoff
  retry: <E, A>(
    operation: () => TaskEither<E, A>,
    maxAttempts: number,
    delayMs: number,
  ): TaskEither<E, A> =>
    new TaskEitherImpl(async () => {
      let lastError: E
      let delay = delayMs

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const result = await operation().run()
        
        if (result.isRight()) {
          return result
        }

        lastError = result.value
        
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, delay))
          delay *= 2 // Exponential backoff
        }
      }

      return Either.left(lastError!)
    }),

  // Parallel execution
  all: <E, A>(tasks: readonly TaskEither<E, A>[]): TaskEither<E, readonly A[]> =>
    new TaskEitherImpl(async () => {
      const results = await Promise.all(tasks.map(task => task.run()))
      const values: A[] = []

      for (const result of results) {
        if (result.isLeft()) {
          return result
        }
        values.push(result.value)
      }

      return Either.right(values)
    }),

  // Sequential execution
  sequence: <E, A>(tasks: readonly TaskEither<E, A>[]): TaskEither<E, readonly A[]> =>
    new TaskEitherImpl(async () => {
      const values: A[] = []

      for (const task of tasks) {
        const result = await task.run()
        if (result.isLeft()) {
          return result
        }
        values.push(result.value)
      }

      return Either.right(values)
    }),
}