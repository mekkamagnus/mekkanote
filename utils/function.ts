export function pipe<A>(a: A): A;
export function pipe<A, B>(a: A, ab: (a: A) => B): B;
export function pipe<A, B, C>(a: A, ab: (a: A) => B, bc: (b: B) => C): C;
export function pipe<A, B, C, D>(a: A, ab: (a: A) => B, bc: (b: B) => C, cd: (c: C) => D): D;
export function pipe<A, B, C, D, E>(a: A, ab: (a: A) => B, bc: (b: B) => C, cd: (c: C) => D, de: (d: D) => E): E;
export function pipe(value: any, ...fns: Function[]): unknown {
  return fns.reduce((acc, fn) => fn(acc), value);
}

// A basic implementation of flow
export const flow = <A extends ReadonlyArray<unknown>, B>(
  ...fns: [(...a: A) => any, ...Array<(a: any) => any>, (...a: any) => B]
): ((...a: A) => B) => {
  return (...args: A): B => {
    return pipe(fns[0](...args), ...fns.slice(1));
  };
};
