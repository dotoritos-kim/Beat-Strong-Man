import { Timer } from 'Helpers/timer';
import worker from './worker';
import { UpdateOutputCallback, KeyState, WorkerResponse, KeyEventType, WorkerMessage } from './types';
export class MainThread {
    private worker: Worker;
    private updateOutput: UpdateOutputCallback;
    private lastProcessTime: number;
    private processingInterval: number;

    private keyStates: Map<string, KeyState>;
    private pressedKeys: Set<string>;
    private heldKeys: Set<string>;

    private readonly keys: string[] = ['a', 's', 'd', 'f', ' ', 'k', 'l', ';'];

    constructor(updateOutput: UpdateOutputCallback) {
        this.worker = new Worker(worker);
        this.updateOutput = updateOutput;
        this.lastProcessTime = 0;
        this.processingInterval = 0.001;

        this.keyStates = new Map();
        this.pressedKeys = new Set();
        this.heldKeys = new Set();

        this.initializeKeyStates(); // 키 상태 초기화

        this.setupWorkerMessageHandler();
        this.setupKeyboardListeners();
        this.startKeyPressLoop();
    }

    private initializeKeyStates(): void {
        this.keys.forEach((key) => {
            this.keyStates.set(key, {
                isPressed: false,
                downTime: 0,
                upTime: 0,
                pressTime: 0,
                isHeld: false,
                stateDescription: 'Released',
            });
        });
    }

    private setupWorkerMessageHandler(): void {
        this.worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
            this.handleWorkerResponse(event.data);
        };
    }

    private setupKeyboardListeners(): void {
        document.addEventListener('keydown', this.handleKeydown.bind(this));
        document.addEventListener('keyup', this.handleKeyup.bind(this));
    }

    private handleKeydown(event: KeyboardEvent): void {
        const key = event.key;
        const now = performance.now(); // 현재 시간 기록

        if (!this.keys.includes(key)) return;

        const state = this.keyStates.get(key)!;
        if (!state.isPressed) {
            state.isPressed = true;
            state.downTime = now; // 새로운 downTime 기록
            state.upTime = 0; // upTime 초기화
            state.pressTime = now;
            state.isHeld = false;
            state.stateDescription = 'Pressed';
            this.pressedKeys.add(key);
            this.processKeys('down', new Set([key]));
        } else if (!state.isHeld && now - state.pressTime > 1) {
            state.isHeld = true;
            state.stateDescription = 'Held';
            this.heldKeys.add(key);
        }
    }

    private handleKeyup(event: KeyboardEvent): void {
        const key = event.key;
        const now = performance.now(); // 현재 시간 기록

        if (!this.keys.includes(key)) return;

        const state = this.keyStates.get(key)!;

        state.isPressed = false;
        state.pressTime = 0;
        state.isHeld = false;
        state.stateDescription = 'Released';
        state.upTime = now; // 새로운 upTime 기록

        this.pressedKeys.delete(key);
        this.heldKeys.delete(key);

        const keyStateEntry = { key, state };
        this.updateOutput(`키 "${key}"가 up 이벤트로 해제되었습니다. (눌린 시간: ${now - state.downTime}ms)`, [key], [keyStateEntry]);

        // up 이벤트 처리
        this.processKeys('up', new Set([key]));
    }

    private startKeyPressLoop(): void {
        const processPress = () => {
            if (this.heldKeys.size > 0) {
                this.processKeys('press', this.heldKeys);
            }
            requestAnimationFrame(processPress);
        };
        requestAnimationFrame(processPress);
    }

    private processKeys(type: KeyEventType, keys: Set<string>): void {
        const now = performance.now();
        if (now - this.lastProcessTime < this.processingInterval) {
            return;
        }
        this.lastProcessTime = now;

        if (keys.size > 0) {
            const keyArray = Array.from(keys);
            this.worker.postMessage({
                type,
                keys: keyArray,
                startTime: now,
                allPressedKeys: Array.from(this.pressedKeys),
            } as WorkerMessage);

            const mainResult = `${keyArray.join(', ')} 키 ${type} 감지됨`;
            this.logOutput(mainResult, 0, '메인 스레드', keyArray);
        }

        const keyStates = Array.from(this.keyStates.entries()).map(([key, state]) => ({
            key,
            state,
        }));

        this.updateOutput(`현재 ${keys.size}개의 키가 ${type} 상태입니다.`, keys.size > 0 ? Array.from(keys) : [], keyStates);
    }

    private handleWorkerResponse(data: WorkerResponse): void {
        const { result, startTime, type, keys } = data;
        const latency = performance.now() - startTime;
        this.logOutput(result, latency, 'Web Worker', keys);
    }

    private logOutput(message: string, latency: number, source: string, keys: string[]): void {
        const now = new Date();
        const time = now.toLocaleTimeString('ko-KR', { hour12: true });
        const ms = (performance.now() % 1000).toFixed(3);

        const log = `[${time}.${ms}] ${message}\n${source} 입력 처리 레이턴시: ${Timer.benchMark.get('down')} ms\n`;
        this.updateOutput(log, keys, []);
    }

    public terminateWorker(): void {
        this.worker.terminate();
        document.removeEventListener('keydown', this.handleKeydown.bind(this));
        document.removeEventListener('keyup', this.handleKeyup.bind(this));
    }
}
