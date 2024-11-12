/**
 * @template S zustand store 상태
 * @template K selector가 없는 경우 default로 사용할 key
 */
export type SelectorHook<S, K extends keyof S> = {
    <U>(selector: (state: S) => U): U;
    (): S[K];
};
