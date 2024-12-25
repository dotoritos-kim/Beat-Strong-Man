export class RAFMonitor {
    private lastTimestamp: number | null = null;
    private rafId: number | null = null;
    private isRAFRunning: boolean = true;

    /**
     * requestAnimationFrame 동작 검증 시작
     */
    startMonitoring(checkInterval: number = 1000): void {
        this.isRAFRunning = true;
        this.lastTimestamp = performance.now();

        const checkRAF = () => {
            const currentTime = performance.now();
            // 일정 시간 내에 갱신되지 않으면 비활성화로 판단
            if (this.lastTimestamp && currentTime - this.lastTimestamp > checkInterval) {
                this.isRAFRunning = false;
                console.warn('requestAnimationFrame seems to be paused.');
            } else {
                this.isRAFRunning = true;
            }

            this.lastTimestamp = currentTime;
            if (this.isRAFRunning) {
                this.rafId = requestAnimationFrame(checkRAF);
            }
        };

        this.rafId = requestAnimationFrame(checkRAF);
    }

    /**
     * 모니터링 종료
     */
    stopMonitoring(): void {
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
        }
        this.isRAFRunning = false;
        this.lastTimestamp = null;
        this.rafId = null;
    }

    /**
     * requestAnimationFrame 상태 반환
     */
    isRunning(): boolean {
        return this.isRAFRunning;
    }
}
