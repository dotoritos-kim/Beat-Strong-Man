import Timer from './Timer';

interface AudioInterface {
    context: AudioContext;
    unmute: () => void;
}

export class Clock {
    private _context: AudioContext;
    private _offset: number[] = [];
    private _sum: number = 0;
    public time: number = 0; // Clock의 시간 값을 공개 변수로 정의

    constructor(audio: AudioInterface) {
        audio.unmute(); // 오디오 컨텍스트의 currentTime 시작

        this._context = audio.context;
        this.update();
    }

    // 매 프레임마다 호출하여 시계를 업데이트
    update(): void {
        const realTime = Timer.now() / 1000; // 시스템 시간(초)
        const delta = realTime - this._context.currentTime; // 시스템 시간과 오디오 시간의 차이
        this._offset.push(delta);
        this._sum += delta;

        // 최대 60개의 오프셋만 유지
        if (this._offset.length > 60) {
            this._sum -= this._offset.shift()!;
        }

        // 평균 오프셋을 적용하여 고정밀 시간 값 계산
        this.time = realTime - this._sum / this._offset.length;
    }
}

export default Clock;
