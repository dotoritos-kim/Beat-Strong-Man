interface Clock {
    offset: number;
    delay: number;
}

/**
 * Clock 객체 배열에서 가장 신뢰할 수 있는 평균 offset을 계산합니다.
 * @param clocks Clock 객체 배열
 * @returns {number} 평균 offset 값
 */
function calculateAverageOffset(clocks: Clock[]): number {
    clocks = clocks.slice().sort((a, b) => a.offset - b.offset);
    clocks = clocks.slice(1, clocks.length - 1);
    clocks.sort((a, b) => a.delay - b.delay);

    let sum = 0;
    let count = 0;
    let hp = Math.ceil(clocks.length / 8);

    for (let i = 0; i < clocks.length; i++) {
        if (clocks[i].delay > clocks[0].delay) hp--;
        if (hp === 0) break;
        sum += clocks[i].offset;
        count += 1;
    }

    return count ? sum / count : 0; // 평균 오프셋 계산, count가 0일 경우 0 반환
}

/**
 * 서버와 동기화를 관리하는 TimeSync 클래스입니다.
 * 서버와의 동기화, 중간 결과 처리, WebSocket 메시지 처리를 제공합니다.
 */
class TimeSync {
    private ws: WebSocket;
    private clocks: Clock[] = [];
    private callback: (error: Error | null, offset?: number) => void;
    private intermediateCallback?: (offset: number) => void;

    constructor(url: string, callback: (error: Error | null, offset?: number) => void, intermediateCallback?: (offset: number) => void) {
        this.ws = new WebSocket(url);
        this.callback = callback;
        this.intermediateCallback = intermediateCallback;

        this.ws.onmessage = (e: MessageEvent) => this.handleMessage(e);
        this.ws.onclose = () => this.handleClose();
    }

    /**
     * 서버에 현재 시간을 전송하는 함수입니다.
     */
    private emit() {
        try {
            this.ws.send(`${new Date().getTime()}`);
        } catch (e) {
            // WebSocket send 중 에러 발생 시 무시
        }
    }

    /**
     * 서버로부터 수신한 메시지를 처리합니다.
     * @param e WebSocket 메시지 이벤트
     */
    private handleMessage(e: MessageEvent) {
        if (e.data === 'k') {
            this.emit();
        } else if (e.data.includes(',')) {
            this.processTimeData(e.data);
            this.emit();
        }
    }

    /**
     * 서버와의 연결이 종료될 때 호출되는 함수입니다.
     * 받은 오프셋을 기반으로 콜백을 호출합니다.
     */
    private handleClose() {
        if (this.clocks.length < 1) {
            this.callback(new Error('No offset received'));
        } else {
            this.callback(null, calculateAverageOffset(this.clocks));
        }
    }

    /**
     * 시간 데이터를 처리하여 clocks 배열에 추가합니다.
     * @param text 서버에서 받은 시간 데이터
     */
    private processTimeData(text: string) {
        const fields = text.split(',');
        if (fields.length !== 2) return;

        const a = Number(fields[0]);
        const b = Number(fields[1]);
        const c = new Date().getTime();

        if (a <= c) {
            this.clocks.push(this.convert([a, b, b, c]));
        }

        if (this.clocks.length >= 8 && this.intermediateCallback) {
            this.intermediateCallback(calculateAverageOffset(this.clocks));
        }
    }

    /**
     * 주어진 시간 배열을 기반으로 offset과 delay 값을 계산합니다.
     * @param array 시간 배열 [t1, t2, t3, t4]
     * @returns {Clock} offset과 delay 값을 포함한 객체
     */
    private convert(array: [number, number, number, number]): Clock {
        const t1 = array[0];
        const t2 = array[1];
        const t3 = array[2];
        const t4 = array[3];
        return {
            offset: (t2 - t1 + (t3 - t4)) / 2,
            delay: t4 - t1 - (t3 - t2),
        };
    }
}

// TimeSync 클래스 사용 예시
export function Sync(
    url: string,
    callback: (error: Error | null, offset?: number) => void,
    intermediateCallback?: (offset: number) => void,
): void {
    new TimeSync(url, callback, intermediateCallback);
}

export default Sync;
