import { Sync } from './Sync';

/**
 * 고정밀 타이머를 제공
 * 서버와의 동기화 기능을 제공하여 전역적으로 일관된 시간을 유지할 수 있습니다.
 */
class Timer {
    private offset: number = 0;

    /**
     * 현재 시간을 반환합니다. 성능 API가 가능할 경우 고정밀 시간을 제공합니다.
     * @returns 현재 시간 (밀리초)
     */
    now(): number {
        return window.performance?.now ? window.performance.now() : Date.now();
    }

    /**
     * 서버와 동기화를 수행하여 offset을 업데이트합니다.
     * @param server 동기화할 서버 URL
     */
    async synchronize(server: string): Promise<void> {
        try {
            const result = await new Promise<number>((resolve, reject) => {
                Sync(server, (err, offset) => (err ? reject(err) : resolve(offset!)), this.onPartialResult.bind(this));
            });
            this.onFinalResult(result);
            console.info(`Synchronized time with global server! Offset = ${this.offset}`);
        } catch (err) {
            console.error('Cannot synchronize time:', err);
        }
    }

    /**
     * 동기화된 현재 시간을 반환하는 함수입니다.
     * @returns 동기화된 현재 시간을 반환하는 함수
     */
    synchronized(): () => number {
        const currentOffset = this.offset;
        return () => this.now() + currentOffset;
    }

    /**
     * 최종 결과를 사용하여 offset을 업데이트합니다.
     * @param result 서버와의 최종 동기화 결과
     */
    private onFinalResult(result: number) {
        this.offset = result + Date.now() - this.now();
    }

    /**
     * 부분 결과가 있을 때 호출되어 중간 offset을 계산합니다.
     * @param partialResult 부분 동기화 결과
     */
    private onPartialResult(partialResult: number) {
        this.offset = partialResult + Date.now() - this.now();
    }
}

// TimeSync 클래스의 인스턴스를 생성하여 사용
const timeSync = new Timer();

export { timeSync as default, Timer };
