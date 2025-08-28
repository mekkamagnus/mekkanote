/**
 * State: Monad for managing immutable state transitions
 * Guarantees that state is never mutated accidentally
 */

export interface State<S, A> {
  run(initialState: S): readonly [A, S]
  map<B>(f: (a: A) => B): State<S, B>
  flatMap<B>(f: (a: A) => State<S, B>): State<S, B>
}

class StateImpl<S, A> implements State<S, A> {
  constructor(private readonly computation: (state: S) => readonly [A, S]) {}

  run(initialState: S): readonly [A, S] {
    return this.computation(initialState)
  }

  map<B>(f: (a: A) => B): State<S, B> {
    return new StateImpl((state: S) => {
      const [value, newState] = this.run(state)
      return [f(value), newState] as const
    })
  }

  flatMap<B>(f: (a: A) => State<S, B>): State<S, B> {
    return new StateImpl((state: S) => {
      const [value, newState] = this.run(state)
      return f(value).run(newState)
    })
  }
}

export const State = {
  // Pure value that doesn't modify state
  of: <S, A>(value: A): State<S, A> =>
    new StateImpl((state: S) => [value, state]),

  // Get the current state
  get: <S>(): State<S, S> =>
    new StateImpl((state: S) => [state, state]),

  // Set the state
  put: <S>(newState: S): State<S, void> =>
    new StateImpl(() => [undefined as void, newState]),

  // Modify the state
  modify: <S>(f: (state: S) => S): State<S, void> =>
    new StateImpl((state: S) => [undefined as void, f(state)]),

  // Modify state and return a value
  modifyGet: <S, A>(f: (state: S) => readonly [A, S]): State<S, A> =>
    new StateImpl(f),

  // Run multiple state operations in sequence
  sequence: <S, A>(states: readonly State<S, A>[]): State<S, readonly A[]> =>
    new StateImpl((initialState: S) => {
      let currentState = initialState
      const results: A[] = []

      for (const state of states) {
        const [value, newState] = state.run(currentState)
        results.push(value)
        currentState = newState
      }

      return [results, currentState] as const
    }),

  // Execute all states and collect results (parallel execution)
  all: <S, A>(states: readonly State<S, A>[]): State<S, readonly A[]> =>
    State.sequence(states), // Same as sequence for state operations

  // Conditional state execution
  when: <S>(predicate: (state: S) => boolean, action: State<S, void>): State<S, void> =>
    new StateImpl((state: S) => {
      if (predicate(state)) {
        return action.run(state)
      }
      return [undefined as void, state] as const
    }),
}

// Utility functions for common state operations
export const stateUtils = {
  // Modify a specific property of the state
  modifyProperty: <S, K extends keyof S>(
    key: K,
    f: (value: S[K]) => S[K],
  ): State<S, void> =>
    State.modify((state: S) => ({ ...state, [key]: f(state[key]) })),

  // Set a specific property of the state
  setProperty: <S, K extends keyof S>(key: K, value: S[K]): State<S, void> =>
    State.modify((state: S) => ({ ...state, [key]: value })),

  // Get a specific property from the state
  getProperty: <S, K extends keyof S>(key: K): State<S, S[K]> =>
    State.get<S>().map((state: S) => state[key]),

  // Update nested state using lens
  updateWith: <S, A>(lens: Lens<S, A>, f: (a: A) => A): State<S, void> =>
    State.modify(lens.modify(f)),

  // Set nested state using lens
  setWith: <S, A>(lens: Lens<S, A>, value: A): State<S, void> =>
    State.modify(lens.set(value)),

  // Get nested state using lens
  getWith: <S, A>(lens: Lens<S, A>): State<S, A> =>
    State.get<S>().map(lens.get),
}

// Import Lens type
import { Lens } from './lens.ts'

// StateTaskEither: Combination of State and TaskEither for stateful async operations
import { TaskEither } from './task-either.ts'

export interface StateTaskEither<S, E, A> {
  run(initialState: S): TaskEither<E, readonly [A, S]>
  map<B>(f: (a: A) => B): StateTaskEither<S, E, B>
  flatMap<B>(f: (a: A) => StateTaskEither<S, E, B>): StateTaskEither<S, E, B>
  mapError<F>(f: (e: E) => F): StateTaskEither<S, F, A>
}

class StateTaskEitherImpl<S, E, A> implements StateTaskEither<S, E, A> {
  constructor(
    private readonly computation: (state: S) => TaskEither<E, readonly [A, S]>,
  ) {}

  run(initialState: S): TaskEither<E, readonly [A, S]> {
    return this.computation(initialState)
  }

  map<B>(f: (a: A) => B): StateTaskEither<S, E, B> {
    return new StateTaskEitherImpl((state: S) =>
      this.run(state).map(([value, newState]) => [f(value), newState] as const)
    )
  }

  flatMap<B>(f: (a: A) => StateTaskEither<S, E, B>): StateTaskEither<S, E, B> {
    return new StateTaskEitherImpl((state: S) =>
      this.run(state).flatMap(([value, newState]) =>
        f(value).run(newState)
      )
    )
  }

  mapError<F>(f: (e: E) => F): StateTaskEither<S, F, A> {
    return new StateTaskEitherImpl((state: S) =>
      this.run(state).mapLeft(f)
    )
  }
}

export const StateTaskEither = {
  // Lift a pure value
  of: <S, E, A>(value: A): StateTaskEither<S, E, A> =>
    new StateTaskEitherImpl((state: S) =>
      TaskEither.of([value, state] as const)
    ),

  // Lift a TaskEither into StateTaskEither
  lift: <S, E, A>(taskEither: TaskEither<E, A>): StateTaskEither<S, E, A> =>
    new StateTaskEitherImpl((state: S) =>
      taskEither.map(value => [value, state] as const)
    ),

  // Lift a State into StateTaskEither
  liftState: <S, E, A>(stateOp: State<S, A>): StateTaskEither<S, E, A> =>
    new StateTaskEitherImpl((state: S) =>
      TaskEither.of(stateOp.run(state))
    ),

  // Get the current state
  get: <S, E>(): StateTaskEither<S, E, S> =>
    new StateTaskEitherImpl((state: S) =>
      TaskEither.of([state, state] as const)
    ),

  // Set the state
  put: <S, E>(newState: S): StateTaskEither<S, E, void> =>
    new StateTaskEitherImpl(() =>
      TaskEither.of([undefined as void, newState] as const)
    ),

  // Modify the state
  modify: <S, E>(f: (state: S) => S): StateTaskEither<S, E, void> =>
    new StateTaskEitherImpl((state: S) =>
      TaskEither.of([undefined as void, f(state)] as const)
    ),

  // Error handling
  left: <S, E>(error: E): StateTaskEither<S, E, never> =>
    new StateTaskEitherImpl(() => TaskEither.left(error)),
}