export type Some<A> = {
  readonly _tag: 'Some';
  readonly value: A;
};

export type None = {
  readonly _tag: 'None';
};

export type Option<A> = Some<A> | None;

export const some = <A>(a: A): Option<A> => ({ _tag: 'Some', value: a });

export const none: Option<never> = { _tag: 'None' };

export const isSome = <A>(ma: Option<A>): ma is Some<A> => ma._tag === 'Some';

export const isNone = <A>(ma: Option<A>): ma is None => ma._tag === 'None';
