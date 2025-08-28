/**
 * Validation: Applicative functor for error accumulation
 * Collects all validation errors rather than failing on the first one
 */

export interface Validation<E, A> {
  isSuccess(): this is Success<A>
  isFailure(): this is Failure<E>
  flatMap<B>(f: (a: A) => Validation<E, B>): Validation<E, B>
  map<B>(f: (a: A) => B): Validation<E, B>
  mapError<F>(f: (errors: readonly E[]) => readonly F[]): Validation<F, A>
  getOrElse(defaultValue: A): A
  getErrors(): readonly E[]
}

export interface Success<A> extends Validation<never, A> {
  readonly _tag: 'Success'
  readonly value: A
}

export interface Failure<E> extends Validation<E, never> {
  readonly _tag: 'Failure'
  readonly errors: readonly E[]
}

class ValidationImpl<E, A> implements Validation<E, A> {
  constructor(
    private readonly _tag: 'Success' | 'Failure',
    private readonly data: A | readonly E[],
  ) {}

  isSuccess(): this is Success<A> {
    return this._tag === 'Success'
  }

  isFailure(): this is Failure<E> {
    return this._tag === 'Failure'
  }

  flatMap<B>(f: (a: A) => Validation<E, B>): Validation<E, B> {
    if (this.isFailure()) {
      return this as unknown as Validation<E, B>
    }
    return f((this as Success<A>).value)
  }

  map<B>(f: (a: A) => B): Validation<E, B> {
    if (this.isFailure()) {
      return this as unknown as Validation<E, B>
    }
    return Validation.success(f((this as Success<A>).value))
  }

  mapError<F>(f: (errors: readonly E[]) => readonly F[]): Validation<F, A> {
    if (this.isSuccess()) {
      return this as unknown as Validation<F, A>
    }
    return Validation.failure(f((this as Failure<E>).errors))
  }

  getOrElse(defaultValue: A): A {
    return this.isSuccess() ? (this as Success<A>).value : defaultValue
  }

  getErrors(): readonly E[] {
    return this.isFailure() ? (this as Failure<E>).errors : []
  }
}

export const Validation = {
  success: <A>(value: A): Validation<never, A> => 
    new ValidationImpl('Success', value),

  failure: <E>(errors: readonly E[]): Validation<E, never> =>
    new ValidationImpl('Failure', errors),

  failureOf: <E>(error: E): Validation<E, never> =>
    new ValidationImpl('Failure', [error]),

  // Applicative operations for combining validations
  all: <E, A>(validations: readonly Validation<E, A>[]): Validation<E, readonly A[]> => {
    const errors: E[] = []
    const values: A[] = []

    for (const validation of validations) {
      if (validation.isFailure()) {
        errors.push(...validation.getErrors())
      } else {
        values.push(validation.value)
      }
    }

    return errors.length > 0 
      ? Validation.failure(errors)
      : Validation.success(values)
  },

  // Apply function in success context, combining errors
  apply: <E, A, B>(
    validationF: Validation<E, (a: A) => B>,
    validationA: Validation<E, A>,
  ): Validation<E, B> => {
    if (validationF.isFailure() && validationA.isFailure()) {
      return Validation.failure([...validationF.getErrors(), ...validationA.getErrors()])
    } else if (validationF.isFailure()) {
      return validationF as unknown as Validation<E, B>
    } else if (validationA.isFailure()) {
      return validationA as unknown as Validation<E, B>
    } else {
      return Validation.success(validationF.value(validationA.value))
    }
  },
}

// Lifting functions for multiple arguments
export const lift2 = <E, A, B, C>(f: (a: A) => (b: B) => C) =>
  (va: Validation<E, A>) =>
  (vb: Validation<E, B>): Validation<E, C> =>
    Validation.apply(Validation.apply(Validation.success(f), va), vb)

export const lift3 = <E, A, B, C, D>(f: (a: A) => (b: B) => (c: C) => D) =>
  (va: Validation<E, A>) =>
  (vb: Validation<E, B>) =>
  (vc: Validation<E, C>): Validation<E, D> =>
    Validation.apply(
      Validation.apply(Validation.apply(Validation.success(f), va), vb),
      vc,
    )

export const lift4 = <E, A, B, C, D, F>(f: (a: A) => (b: B) => (c: C) => (d: D) => F) =>
  (va: Validation<E, A>) =>
  (vb: Validation<E, B>) =>
  (vc: Validation<E, C>) =>
  (vd: Validation<E, D>): Validation<E, F> =>
    Validation.apply(
      Validation.apply(
        Validation.apply(Validation.apply(Validation.success(f), va), vb),
        vc,
      ),
      vd,
    )

// Common validation utilities
export const ValidationUtils = {
  required: <T, E>(value: T | null | undefined, error: E): Validation<E, T> =>
    value != null ? Validation.success(value) : Validation.failureOf(error),

  nonEmpty: <E>(value: string, error: E): Validation<E, string> =>
    value.length > 0 ? Validation.success(value) : Validation.failureOf(error),

  minLength: <E>(value: string, min: number, error: E): Validation<E, string> =>
    value.length >= min ? Validation.success(value) : Validation.failureOf(error),

  maxLength: <E>(value: string, max: number, error: E): Validation<E, string> =>
    value.length <= max ? Validation.success(value) : Validation.failureOf(error),

  email: <E>(value: string, error: E): Validation<E, string> => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(value) ? Validation.success(value) : Validation.failureOf(error)
  },

  uuid: <E>(value: string, error: E): Validation<E, string> => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidRegex.test(value) ? Validation.success(value) : Validation.failureOf(error)
  },

  securePath: <E>(value: string, error: E): Validation<E, string> => {
    // Prevent directory traversal attacks
    const dangerousPatterns = ['../', '..\\', '//', '\\\\']
    const hasDangerousPattern = dangerousPatterns.some(pattern => value.includes(pattern))
    
    return !hasDangerousPattern && !value.startsWith('/') 
      ? Validation.success(value) 
      : Validation.failureOf(error)
  },

  positive: <E>(value: number, error: E): Validation<E, number> =>
    value > 0 ? Validation.success(value) : Validation.failureOf(error),

  range: <E>(value: number, min: number, max: number, error: E): Validation<E, number> =>
    value >= min && value <= max ? Validation.success(value) : Validation.failureOf(error),
}