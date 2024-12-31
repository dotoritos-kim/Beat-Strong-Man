// src/worker.ts
class WorkerHandler {
    constructor() {
        self.onmessage = (event) => this.processKeyEvent(event.data);
    }

    private processKeyEvent(data: { type: string; keys: string[]; startTime: number; allPressedKeys: string[]; timestamp: string }) {
        const { type, keys, startTime, allPressedKeys, timestamp } = data;

        let result = '';
        switch (type) {
            case 'down':
                result = `${keys.join(', ')} 키 down 처리됨 (Worker). 현재 눌린 키: ${allPressedKeys.join(', ')}. 이벤트 발생 시각: ${timestamp}`;
                break;
            case 'press':
                result = `${keys.join(', ')} 키 press 처리됨 (Worker). 이벤트 발생 시각: ${timestamp}`;
                break;
            case 'up':
                result = `${keys.join(', ')} 키 up 처리됨 (Worker). 현재 눌린 키: ${allPressedKeys.join(', ')}. 이벤트 발생 시각: ${timestamp}`;
                break;
        }

        self.postMessage({
            type,
            result,
            startTime,
            keys,
            timestamp,
        });
    }
}

const worker = new WorkerHandler();
let code = worker.toString();
code = code.substring(code.indexOf('{') + 1, code.lastIndexOf('}'));

const blob = new Blob([code], { type: 'application/javascript' });
const inputWorker = URL.createObjectURL(blob);
export default inputWorker;
