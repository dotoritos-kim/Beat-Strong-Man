import { MainThread } from './input';
import Timer from './play/Timer';
import Clock from './play/index';

// 게임 타이머는 노래 진행 상황을 추적하는 역할을 합니다.
// AudioContext와 연결되어야 하는 클래스입니다.
export class BMS {
    private _clock: Clock;
    private _input: MainThread;
    private _now: () => number;
    private _lastRecordedTimeSinceStart: number;
    private startTime: number | null;
    private _pauseAtTimerValue: number;
    private _unpausedTimeSinceStart: number;
    private _unpausedTimerValue: number;
    public readyFraction: number;
    public gettingStarted: boolean;
    public time: number;

    // 콜백 목록
    private _callbacks: Function[];

    constructor(clock: Clock, input: MainThread) {
        this._clock = clock;
        this._input = input; // 이미 MainThread를 받으므로 new하지 않음
        this._now = Timer.synchronized();
        this._lastRecordedTimeSinceStart = 0;
        this.startTime = null;
        this._pauseAtTimerValue = Infinity;
        this._unpausedTimeSinceStart = 0;
        this._unpausedTimerValue = 0;
        this.readyFraction = 0;
        this.gettingStarted = false;
        this.time = 0;

        // 콜백 배열 초기화
        this._callbacks = [];
    }

    // 게임이 시작되었으면 true, 그렇지 않으면 false를 반환합니다.
    get started(): boolean {
        return this.startTime !== null;
    }

    // 타이머를 업데이트합니다. 이 메서드는 게임 루프에서 호출되어야 합니다.
    public update() {
        this._checkStartGame();
        // 게임 시작 이후의 시간을 초 단위로 기록합니다.
        this.time = this._calculateTime();

        // 콜백 실행
        this._callbacks.forEach((callback) => callback(this.time));
    }

    // 게임 시작 여부를 확인합니다.
    private _checkStartGame() {
        if (this.started) return;
    }

    // 게임 시작 대기 시간을 계산합니다.
    private _getWait(): number {
        const t = this._now() / 1000;
        return Math.ceil(t) - t;
    }

    // 현재 시간을 계산합니다.
    private _calculateTime(): number {
        // 게임 초기화 시 타이머를 -0.333초로 설정합니다.
        // 플레이어가 시작 버튼을 누르면 1초 동안 가속하여 정상 속도에 도달합니다.
        // delta는 시작 이후 경과 시간을 의미합니다.
        let delta = this.startTime === null ? 0 : this._clock.time - this.startTime;
        if (delta < 0) delta = 0;

        if (delta < 1) {
            return (Math.pow(delta, 6) - 1) / 6 - 1 / 30;
        } else {
            const timeSinceStart = delta - 31 / 30;
            this._lastRecordedTimeSinceStart = timeSinceStart;
            const projectedTimerValue = this._unpausedTimerValue + (timeSinceStart - this._unpausedTimeSinceStart);
            return Math.min(projectedTimerValue, this._pauseAtTimerValue);
        }
    }

    // 특정 시간에 타이머를 일시 정지합니다.
    public pauseAt(timerValueToPause: number) {
        if (this._unpausedTimerValue + (this._lastRecordedTimeSinceStart - this._unpausedTimeSinceStart) >= this._pauseAtTimerValue) {
            this._unpausedTimerValue = this._pauseAtTimerValue;
            this._unpausedTimeSinceStart = this._lastRecordedTimeSinceStart;
        }
        this._pauseAtTimerValue = timerValueToPause;
    }

    // 외부에서 콜백을 구독할 수 있도록 추가
    public addCallback(callback: (time: number) => void) {
        this._callbacks.push(callback);
    }

    // 게임 시작 시점을 외부에서 설정할 수 있도록 메서드 추가
    public startGame() {
        if (!this.started) {
            this.startTime = this._clock.time + this._getWait();
        }
    }

    // 입력을 즉시 처리하는 메서드 (특정 입력 이벤트를 처리)
    public handleInput(inputName: string, inputValue: boolean) {
        // 입력값을 처리하는 로직을 여기에 추가
        console.log(`입력 처리: ${inputName} = ${inputValue}`);

        // 입력에 대한 즉시 처리를 외부로 전달 (콜백 등)
        this._callbacks.forEach((callback) => callback(this.time));
    }
}

export default BMS;
