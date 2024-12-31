// types.ts
export type KeyEventType = 'down' | 'press' | 'up';

export interface KeyState {
    isPressed: boolean;
    downTime: number;
    upTime: number;
    pressTime: number;
    isHeld: boolean;
    stateDescription: string; // 상태 설명
}

export interface WorkerMessage {
    type: KeyEventType;
    keys: string[];
    startTime: number;
    allPressedKeys: string[];
}

export interface WorkerResponse {
    type: KeyEventType;
    result: string;
    startTime: number;
    keys: string[];
}

export interface UpdateOutputCallback {
    (message: string, keys: string[], keyStates: Array<{ key: string; state: KeyState }>): void;
}
