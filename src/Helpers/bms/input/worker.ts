// src/worker.ts
class WorkerHandler {
    constructor() {
        self.onmessage = (event: MessageEvent<WorkerMessage>) => this.processKeydown(event.data);
    }

    private processKeydown(data: WorkerMessage): void {
        const { key, startTime } = data;
        const result = `${key} 키 입력 감지됨 (Worker)`;

        // Web Worker의 결과와 시작 시간을 메인 스레드로 전송
        self.postMessage({ result, startTime } as WorkerResponse);
    }
}

// 인터페이스 정의
interface WorkerMessage {
    key: string;
    startTime: number;
}

interface WorkerResponse {
    result: string;
    startTime: number;
}

// Web Worker 인스턴스 생성
const worker = new WorkerHandler();
let code = worker.toString();
code = code.substring(code.indexOf('{') + 1, code.lastIndexOf('}'));

const blob = new Blob([code], { type: 'application/javascript' });
const inputWorker = URL.createObjectURL(blob);
export default inputWorker;
