import { elapsedTime, HighresTimeType, startTime } from '@apigames/highres-timer';
import { MainThread } from './input/index';
import { Timer } from 'Helpers/timer';
// The GameController takes care of communications between each game
// component, and takes care of the Game loop.
export class GameController {
    private _endGameLoop!: () => boolean;
    public _inputThread: MainThread;
    public inputKeys: string[] = [];

    public _startTime: HighresTimeType | undefined;
    public _startDate: Date | undefined;
    public _nowTime: number | undefined;
    public _stopTime: number | undefined;

    public _message: string = '';
    public _workerMessage: string = '';
    gameInputCallback: (message: string, keys: string[]) => void;
    gameProgressCallback: () => void;
    constructor(inputCallBack: (message: string, keys: string[]) => void, progressCallback: () => void) {
        this.gameInputCallback = inputCallBack;
        this.gameProgressCallback = progressCallback;
        this._inputThread = new MainThread((e, keys) => {
            this.getInput(e, keys);
        });
    }

    getInput(e: string, keys: string[]) {
        const tmpDate = new Date(this._startDate!.getTime() + this._nowTime!);

        this._message = `[${tmpDate} .${tmpDate.getMilliseconds()}ms] 입력된 키: ${JSON.stringify(keys)}`;
        this._workerMessage = e;
        this.inputKeys = keys;
        Timer.end('down');
        this.gameInputCallback(e, keys);
    }

    start() {
        this._startTime = startTime();
        const tmpDate = new Date(); // 현재 시간
        tmpDate.setMilliseconds(0); // 밀리초를 0으로 초기화
        tmpDate.setSeconds(0, 0); // 초와 밀리초를 0으로 초기화

        // 1. 밀리초와 나노초 값 (예제 값)
        const milliSecAdd = this._startTime[0]; // 밀리초
        const nanoAdd = this._startTime[1]; // 나노초

        // 2. 밀리초 추가
        tmpDate.setMilliseconds(tmpDate.getMilliseconds() + milliSecAdd);

        // 3. 나노초 추가 (밀리초 이하를 추가)
        const nanoRemainder = nanoAdd % 1_000_000; // 나노초 중 밀리초 이하
        const nanoToMilliseconds = Math.floor(nanoAdd / 1_000_000); // 밀리초로 변환
        tmpDate.setMilliseconds(tmpDate.getMilliseconds() + nanoToMilliseconds); // 밀리초 추가

        this._startDate = tmpDate;
        console.log(`Final Date: ${tmpDate} ${nanoRemainder}ns`);
        let stopped = false;
        const frame = () => {
            if (stopped) return;
            this._update();
            requestAnimationFrame(frame);
        };
        requestAnimationFrame(frame);
        this._endGameLoop = () => {
            stopped = true;
            if (this._startTime) this._stopTime = elapsedTime(this._startTime);
            console.log(this._stopTime);
            return true;
        };
    }

    destroy() {
        this._endGameLoop();
        this._inputThread.terminateWorker();
    }

    _update() {
        this._nowTime = elapsedTime(this._startTime!);
        this.gameProgressCallback();
    }
}

export default GameController;
