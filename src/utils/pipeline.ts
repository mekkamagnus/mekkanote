/**
 * Pipeline: Composition utilities for TaskEither chains
 * Transforms deeply nested .flatMap() chains into readable linear workflows
 */

import { TaskEither } from './task-either.ts'

export interface PipelineBuilder<E, A> {
  step<B>(f: (a: A) => TaskEither<E, B>): PipelineBuilder<E, B>
  tap(f: (a: A) => void): PipelineBuilder<E, A>
  effect(f: (a: A) => TaskEither<E, void>): PipelineBuilder<E, A>
  recover(f: (e: E) => TaskEither<E, A>): PipelineBuilder<E, A>
  build(): TaskEither<E, A>
}

class PipelineBuilderImpl<E, A> implements PipelineBuilder<E, A> {
  constructor(private readonly task: TaskEither<E, A>) {}

  step<B>(f: (a: A) => TaskEither<E, B>): PipelineBuilder<E, B> {
    return new PipelineBuilderImpl(this.task.flatMap(f))
  }

  tap(f: (a: A) => void): PipelineBuilder<E, A> {
    return new PipelineBuilderImpl(this.task.tap(f))
  }

  effect(f: (a: A) => TaskEither<E, void>): PipelineBuilder<E, A> {
    return new PipelineBuilderImpl(
      this.task.flatMap(a => 
        f(a).map(() => a)
      )
    )
  }

  recover(f: (e: E) => TaskEither<E, A>): PipelineBuilder<E, A> {
    return new PipelineBuilderImpl(this.task.recover(f))
  }

  build(): TaskEither<E, A> {
    return this.task
  }
}

export const pipe = {
  from: <E, A>(task: TaskEither<E, A>): PipelineBuilder<E, A> =>
    new PipelineBuilderImpl(task),
}

// Kleisli arrow composition utilities
export const kleisli = {
  // Compose two TaskEither-returning functions
  compose: <E, A, B, C>(
    f: (a: A) => TaskEither<E, B>,
    g: (b: B) => TaskEither<E, C>,
  ) => (a: A): TaskEither<E, C> => f(a).flatMap(g),

  // Identity function for TaskEither
  identity: <E, A>() => (a: A): TaskEither<E, A> => TaskEither.of(a),

  // Lift a regular function to work with TaskEither
  lift: <A, B>(f: (a: A) => B) =>
    <E>(a: A): TaskEither<E, B> => TaskEither.of(f(a)),

  // Conditional execution
  when: <E, A>(
    predicate: (a: A) => boolean,
    f: (a: A) => TaskEither<E, A>,
  ) => (a: A): TaskEither<E, A> =>
    predicate(a) ? f(a) : TaskEither.of(a),

  // Apply multiple functions and collect results
  parallel: <E, A, B>(
    functions: readonly ((a: A) => TaskEither<E, B>)[],
  ) => (a: A): TaskEither<E, readonly B[]> =>
    TaskEitherUtils.all(functions.map(f => f(a))),
}

// Import TaskEitherUtils for parallel execution
import { TaskEitherUtils } from './task-either.ts'