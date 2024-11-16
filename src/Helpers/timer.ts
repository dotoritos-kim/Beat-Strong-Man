// timer.ts
import { elapsedTime, HighresTimeType, startTime } from '@apigames/highres-timer';

import { v4 as uuidv4 } from 'uuid';
export class Timer {
    public static timers: Map<string, HighresTimeType> = new Map();
    public static benchMark: Map<string, string> = new Map();
    public static warningLog: Map<string, string> = new Map();
    public static log: Map<string, string> = new Map();

    public static startTime: Date;
    public static _startDate: Date;
    public static endTime: Date;
    // 타이머 시작
    static start(label: string): void {
        const timer = startTime();
        this.timers.set(label, timer); // 타이머 객체 저장

        const tmpDate = new Date(); // 현재 시간
        tmpDate.setMilliseconds(0); // 밀리초를 0으로 초기화
        tmpDate.setSeconds(0, 0); // 초와 밀리초를 0으로 초기화

        // 1. 밀리초와 나노초 값 (예제 값)
        const milliSecAdd = timer[0]; // 밀리초
        const nanoAdd = timer[1]; // 나노초

        // 2. 밀리초 추가
        tmpDate.setMilliseconds(tmpDate.getMilliseconds() + milliSecAdd);

        // 3. 나노초 추가 (밀리초 이하를 추가)
        const nanoToMilliseconds = Math.floor(nanoAdd / 1_000_000); // 밀리초로 변환
        tmpDate.setMilliseconds(tmpDate.getMilliseconds() + nanoToMilliseconds); // 밀리초 추가

        this._startDate = tmpDate;
    }

    // 타이머 종료
    static end(label: string): void {
        const timer = this.timers.get(label);
        if (timer) {
            const duration = elapsedTime(timer); // 타이머 종료 후 경과 시간 측정
            const tmpDate = new Date(this._startDate!.getTime() + duration);
            this.endTime = tmpDate;
            this.benchMark.set(label, `${duration}`);
            const uuid = uuidv4();
            console.log(duration, duration > 0.9);
            if (duration > 0.9) this.warningLog.set(uuid, `${tmpDate.toISOString()} ${duration} ms`);
            this.log.set(uuid, `${tmpDate.toISOString()} ${duration} ms`);
            this.timers.delete(label);
        } else {
            //console.error(`No start time for label: ${label}`);
        }
    }
}

export const timer = new Timer(); // 타이머 인스턴스를 생성하여 export
