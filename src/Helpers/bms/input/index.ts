import worker from './worker';

export class MainThread {
    private worker: Worker;
    private keyQueue: { key: string; timestamp: number }[]; // 키 입력 큐
    private isProcessing: boolean; // 큐 처리 여부
    private updateOutput: (message: string, keys: string[]) => void; // 출력 상태 업데이트 함수
    private readonly SIMULTANEOUS_THRESHOLD = 4; // 동시 입력 간주 시간 (ms)

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
    }

    private handleKeydown(event: KeyboardEvent): void {
        const key = event.key.toLowerCase();
        const timestamp = performance.now();
        this.keyQueue.push({ key, timestamp }); // 키와 타임스탬프를 큐에 저장

        // 큐 처리 시작
        if (!this.isProcessing) {
            this.processQueue();
        }
    }

    private async processQueue(): Promise<void> {
        this.isProcessing = true;

        while (this.keyQueue.length > 0) {
            const simultaneousKeys: string[] = [];
            const baseTimestamp = this.keyQueue[0].timestamp;

            // 동시 입력 감지: 기준 타임스탬프와의 차이가 `SIMULTANEOUS_THRESHOLD` 이하인 키들 처리
            while (this.keyQueue.length > 0 && this.keyQueue[0].timestamp - baseTimestamp <= this.SIMULTANEOUS_THRESHOLD) {
                simultaneousKeys.push(this.keyQueue.shift()!.key);
            }

            const keys = simultaneousKeys.join(', ');
            const workerStartTime = performance.now();

            // Web Worker로 키 이벤트 전달
            this.worker.postMessage({ key: keys, startTime: workerStartTime } as WorkerMessage);

            // 메인 스레드의 레이턴시 측정
            const mainStartTime = performance.now();
            const mainResult = `${keys} 키 입력 감지됨 (Main Thread)`;
            const mainLatency = performance.now() - mainStartTime;
            this.logOutput(mainResult, mainLatency, '메인 스레드', simultaneousKeys);

            await this.processNextFrame();
        }

        this.isProcessing = false;
    }

    private async processNextFrame(): Promise<void> {
        return new Promise<void>((resolve) => {
            requestAnimationFrame(() => resolve());
        });
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

        const log = `[${formattedTime}.${microTime}] ${message}\n${source} 입력 처리 레이턴시: ${latency.toFixed(3)} ms\n`;
        this.updateOutput(log, keys);
    }

    // Web Worker 종료 메서드 추가
    public terminateWorker(): void {
        this.worker.terminate();
        document.removeEventListener('keydown', (event) => this.handleKeydown(event));
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
