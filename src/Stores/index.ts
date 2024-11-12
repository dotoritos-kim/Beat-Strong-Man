import { create, StateCreator } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { SelectorHook } from './types';

export const createStore = <T extends object>(initializer: StateCreator<T, [['zustand/devtools', never], ['zustand/immer', never]]>) =>
    create<T, [['zustand/devtools', never], ['zustand/immer', never]]>(devtools(immer(initializer)));

interface BearStoreType {
    bears: number;
    increasePopulation: () => void;
    removeAllBears: () => void;
}

// 이 Store는 export 하지 않습니다.
const useBearStore = createStore<BearStoreType>((set) => ({
    bears: 0,
    increasePopulation: () => {
        set((state) => {
            state.bears += 1;
        });
    },
    removeAllBears: () => {
        set((state) => {
            state.bears = 0;
        });
    },
}));
