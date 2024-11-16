import { Timer } from 'Helpers/timer';
import worker from './worker';

export class MainThread {
    private worker: Worker;
    private keyQueue: { key: string; timestamp: number }[]; // 키 입력 큐
    private isProcessing: boolean; // 큐 처리 여부
    private updateOutput: (message: string, keys: string[]) => void; // 출력 상태 업데이트 함수
    private keysPressed = new Map<string, boolean>();

    private now = 0;
    private delta = 0;
    private then = Date.now();
    private frames = 0;
    private oldtime = 0;
    private fps = 240;

    private simultaneousKeys = new Map<string, boolean>();
    constructor(updateOutput: (message: string, keys: string[]) => void) {
        this.worker = new Worker(worker);
        this.keyQueue = [];
        this.isProcessing = false;
        this.updateOutput = updateOutput;

        // Web Worker의 메시지를 받을 리스너 설정
        this.worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
            this.handleWorkerResponse(event.data);
        };

        // 키보드 이벤트 리스너 등록
        document.addEventListener('keydown', (event) => this.handleKeydown(event));
        document.addEventListener('keyup', (event) => this.handleKeyUp(event));
    }

    private handleKeydown(event: KeyboardEvent): void {
        const key = event.key;
        const timestamp = performance.now();
        this.keyQueue.push({ key, timestamp }); // 키와 타임스탬프를 큐에 저장
        Timer.start('down');
        // 큐 처리 시작
        if (!this.isProcessing) {
            this.processQueue('down');
        }
    }
    private handleKeyUp(event: KeyboardEvent): void {
        const key = event.key;
        const timestamp = performance.now();
        this.keyQueue.push({ key, timestamp }); // 키와 타임스탬프를 큐에 저장
        this.keysPressed.delete(key);
        // 큐 처리 시작
        if (!this.isProcessing) {
            this.processQueue('up');
        }
    }

    private async processQueue(type: 'down' | 'up'): Promise<void> {
        this.isProcessing = true;

        while (this.keyQueue.length > 0) {
            while (this.keyQueue.length > 0) {
                this.simultaneousKeys.set(this.keyQueue.shift()!.key, true);
            }

            const pressCheckKeys = this.simultaneousKeys
                .keys()
                .toArray()
                .filter((value) => {
                    if (this.keysPressed.get(value)) {
                        return false;
                    } else {
                        return true;
                    }
                });
            if (pressCheckKeys.length > 0) {
                const keys = pressCheckKeys.join(', ');
                const workerStartTime = performance.now();

                // Web Worker로 키 이벤트 전달
                this.worker.postMessage({ key: keys, startTime: workerStartTime } as WorkerMessage);

                if (type === 'down') {
                    this.simultaneousKeys.forEach((value, key) => {
                        this.keysPressed.set(key, true);
                    });
                }
                if (type === 'up') {
                    pressCheckKeys.forEach((value) => {
                        this.simultaneousKeys.delete(value);
                    });
                }
                // 메인 스레드의 레이턴시 측정
                const mainResult = `${keys} 키 ${type} 감지됨. 현재: ${[...this.simultaneousKeys.entries()]}`;
                this.logOutput(mainResult, 0, '메인 스레드', this.simultaneousKeys.keys().toArray());
            }
        }

        this.isProcessing = false;
    }

    private handleWorkerResponse(data: WorkerResponse): void {
        const { result, startTime } = data;
        const workerLatency = performance.now() - startTime;
        this.logOutput(result, workerLatency, 'Web Worker', [result]);
    }

    private logOutput(message: string, latency: number, source: string, keys: string[]): void {
        const currentDate = new Date();
        const formattedTime = currentDate.toLocaleTimeString('ko-KR', { hour12: true });
        const microTime = (performance.now() % 1000).toFixed(3);

        const log = `[${formattedTime}.${microTime}] ${message}\n${source} 입력 처리 레이턴시: ${Timer.benchMark.get('down')} ms\n`;
        this.updateOutput(log, keys);
    }

    // Web Worker 종료 메서드 추가
    public terminateWorker(): void {
        this.worker.terminate();
        document.removeEventListener('keypress', (event) => this.handleKeydown(event));
        document.removeEventListener('keyup', (event) => this.handleKeydown(event));

        console.log('Web Worker가 종료되었습니다.');
    }
}

interface WorkerMessage {
    key: string;
    startTime: number;
}

interface WorkerResponse {
    result: string;
    startTime: number;
}
