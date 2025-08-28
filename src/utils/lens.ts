/**
 * Lens: Functional optics for immutable state updates
 * Eliminates verbose object spreading for nested updates
 */

export interface Lens<S, A> {
  get(source: S): A
  set(value: A): (source: S) => S
  modify(f: (a: A) => A): (source: S) => S
  compose<B>(other: Lens<A, B>): Lens<S, B>
}

export interface Optional<S, A> {
  getOption(source: S): Option<A>
  set(value: A): (source: S) => S
  modify(f: (a: A) => A): (source: S) => S
  compose<B>(other: Optional<A, B>): Optional<S, B>
  composeOptional<B>(other: Optional<A, B>): Optional<S, B>
}

export interface Option<A> {
  isSome(): this is Some<A>
  isNone(): this is None
  map<B>(f: (a: A) => B): Option<B>
  flatMap<B>(f: (a: A) => Option<B>): Option<B>
  filter(predicate: (a: A) => boolean): Option<A>
  getOrElse(defaultValue: A): A
  fold<B>(onNone: () => B, onSome: (a: A) => B): B
}

export interface Some<A> extends Option<A> {
  readonly _tag: 'Some'
  readonly value: A
}

export interface None extends Option<never> {
  readonly _tag: 'None'
}

// Lens implementation
class LensImpl<S, A> implements Lens<S, A> {
  constructor(
    private readonly getter: (source: S) => A,
    private readonly setter: (value: A) => (source: S) => S,
  ) {}

  get(source: S): A {
    return this.getter(source)
  }

  set(value: A): (source: S) => S {
    return this.setter(value)
  }

  modify(f: (a: A) => A): (source: S) => S {
    return (source: S) => this.set(f(this.get(source)))(source)
  }

  compose<B>(other: Lens<A, B>): Lens<S, B> {
    return new LensImpl(
      (source: S) => other.get(this.get(source)),
      (value: B) => (source: S) => this.modify(other.set(value))(source),
    )
  }
}

// Optional implementation
class OptionalImpl<S, A> implements Optional<S, A> {
  constructor(
    private readonly getOption: (source: S) => Option<A>,
    private readonly setter: (value: A) => (source: S) => S,
  ) {}

  getOption(source: S): Option<A> {
    return this.getOption(source)
  }

  set(value: A): (source: S) => S {
    return this.setter(value)
  }

  modify(f: (a: A) => A): (source: S) => S {
    return (source: S) => {
      const option = this.getOption(source)
      return option.isSome() ? this.set(f(option.value))(source) : source
    }
  }

  compose<B>(other: Lens<A, B>): Optional<S, B> {
    return new OptionalImpl(
      (source: S) => this.getOption(source).map(other.get),
      (value: B) => (source: S) =>
        this.modify((a: A) => other.set(value)(a))(source),
    )
  }

  composeOptional<B>(other: Optional<A, B>): Optional<S, B> {
    return new OptionalImpl(
      (source: S) => this.getOption(source).flatMap(other.getOption),
      (value: B) => (source: S) =>
        this.modify((a: A) => other.set(value)(a))(source),
    )
  }
}

// Option implementation
class OptionImpl<A> implements Option<A> {
  constructor(private readonly _tag: 'Some' | 'None', private readonly value?: A) {}

  isSome(): this is Some<A> {
    return this._tag === 'Some'
  }

  isNone(): this is None {
    return this._tag === 'None'
  }

  map<B>(f: (a: A) => B): Option<B> {
    return this.isSome() ? Option.some(f(this.value!)) : Option.none()
  }

  flatMap<B>(f: (a: A) => Option<B>): Option<B> {
    return this.isSome() ? f(this.value!) : Option.none()
  }

  filter(predicate: (a: A) => boolean): Option<A> {
    return this.isSome() && predicate(this.value!) ? this : Option.none()
  }

  getOrElse(defaultValue: A): A {
    return this.isSome() ? this.value! : defaultValue
  }

  fold<B>(onNone: () => B, onSome: (a: A) => B): B {
    return this.isSome() ? onSome(this.value!) : onNone()
  }
}

// Public constructors and utilities
export const Lens = {
  // Create a lens for a property
  of: <S, K extends keyof S>(key: K): Lens<S, S[K]> =>
    new LensImpl(
      (source: S) => source[key],
      (value: S[K]) => (source: S) => ({ ...source, [key]: value }),
    ),

  // Create a lens with custom getter/setter
  make: <S, A>(
    getter: (source: S) => A,
    setter: (value: A) => (source: S) => S,
  ): Lens<S, A> =>
    new LensImpl(getter, setter),

  // Identity lens
  identity: <S>(): Lens<S, S> =>
    new LensImpl(
      (source: S) => source,
      (value: S) => () => value,
    ),

  // Array index lens (safe)
  index: <A>(i: number): Optional<readonly A[], A> =>
    new OptionalImpl(
      (source: readonly A[]) => 
        i >= 0 && i < source.length ? Option.some(source[i]!) : Option.none(),
      (value: A) => (source: readonly A[]) =>
        i >= 0 && i < source.length
          ? [...source.slice(0, i), value, ...source.slice(i + 1)]
          : source,
    ),

  // Array find lens
  find: <A>(predicate: (a: A) => boolean): Optional<readonly A[], A> =>
    new OptionalImpl(
      (source: readonly A[]) => {
        const item = source.find(predicate)
        return item !== undefined ? Option.some(item) : Option.none()
      },
      (value: A) => (source: readonly A[]) => {
        const index = source.findIndex(predicate)
        return index >= 0
          ? [...source.slice(0, index), value, ...source.slice(index + 1)]
          : source
      },
    ),
}

export const Optional = {
  // Create optional from nullable property
  fromNullable: <S, A>(getter: (source: S) => A | null | undefined): Optional<S, A> =>
    new OptionalImpl(
      (source: S) => {
        const value = getter(source)
        return value != null ? Option.some(value) : Option.none()
      },
      () => (source: S) => source, // Can't set null/undefined values
    ),

  // Create optional with custom getter/setter
  make: <S, A>(
    getOption: (source: S) => Option<A>,
    setter: (value: A) => (source: S) => S,
  ): Optional<S, A> =>
    new OptionalImpl(getOption, setter),
}

export const Option = {
  some: <A>(value: A): Option<A> => new OptionImpl('Some', value),
  none: <A = never>(): Option<A> => new OptionImpl('None'),
  
  fromNullable: <A>(value: A | null | undefined): Option<A> =>
    value != null ? Option.some(value) : Option.none(),

  // Utility for array operations
  all: <A>(options: readonly Option<A>[]): Option<readonly A[]> => {
    const values: A[] = []
    
    for (const option of options) {
      if (option.isNone()) {
        return Option.none()
      }
      values.push(option.value)
    }
    
    return Option.some(values)
  },

  // First some value
  first: <A>(options: readonly Option<A>[]): Option<A> => {
    for (const option of options) {
      if (option.isSome()) {
        return option
      }
    }
    return Option.none()
  },
}

// Utility functions for common lens operations
export const lensUtils = {
  // Update nested object immutably
  updateIn: <S, A>(source: S, path: readonly string[], f: (a: A) => A): S => {
    if (path.length === 0) {
      return f(source as unknown as A) as unknown as S
    }
    
    const [head, ...tail] = path
    const lens = Lens.of(head as keyof S)
    
    return lens.modify((nested: S[keyof S]) =>
      lensUtils.updateIn(nested, tail, f)
    )(source)
  },

  // Set nested value immutably
  setIn: <S, A>(source: S, path: readonly string[], value: A): S => {
    if (path.length === 0) {
      return value as unknown as S
    }
    
    const [head, ...tail] = path
    const lens = Lens.of(head as keyof S)
    
    return lens.modify((nested: S[keyof S]) =>
      lensUtils.setIn(nested, tail, value)
    )(source)
  },

  // Get nested value safely
  getIn: <S>(source: S, path: readonly string[]): Option<unknown> => {
    if (path.length === 0) {
      return Option.some(source)
    }
    
    const [head, ...tail] = path
    const value = (source as any)[head]
    
    return value != null 
      ? lensUtils.getIn(value, tail)
      : Option.none()
  },
}