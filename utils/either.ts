// utils/either.ts

export type Left<E> = {
  readonly _tag: 'Left';
  readonly left: E;
};

export type Right<A> = {
  readonly _tag: 'Right';
  readonly right: A;
};

export type Either<E, A> = Left<E> | Right<A>;

export const left = <E>(e: E): Either<E, never> => ({
  _tag: 'Left',
  left: e,
});

export const right = <A>(a: A): Either<never, A> => ({
  _tag: 'Right',
  right: a,
});

export const isLeft = <E, A>(ma: Either<E, A>): ma is Left<E> => ma._tag === 'Left';

export const isRight = <E, A>(ma: Either<E, A>): ma is Right<A> => ma._tag === 'Right';
