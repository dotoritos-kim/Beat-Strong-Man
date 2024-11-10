import { Speedcore } from '../speedcore';
import { uniq, map } from '../../utils/lodash';
import { BMSChart } from '../../bms/chart';
import { SpeedSegment } from '../speedcore/segment';

const precedence = { bpm: 1, stop: 2 };

/**
 * Timing은 악보의 타이밍 정보를 나타냅니다.
 * Timing 객체는 메트릭 시간(초)과 음악 시간(박자) 간 동기화를 위한 기능을 제공합니다.
 *
 * Timing은 여러 작업(action)으로 생성됩니다:
 *
 * - BPM 변경
 * - 정지(STOP) 작업
 */
export class Timing {
    _speedcore: Speedcore<TimingSegment>;
    _eventBeats: number[];
    /**
     * 초기 BPM 및 지정된 작업으로 Timing을 생성합니다.
     *
     * 일반적으로 `Timing.fromBMSChart`를 사용하여 BMSChart에서 인스턴스를 생성합니다.
     */
    constructor(initialBPM: number, actions: TimingAction[]) {
        const state = { bpm: initialBPM, beat: 0, seconds: 0 };
        const segments: TimingSegment[] = [];
        segments.push({
            t: 0,
            x: 0,
            dx: state.bpm / 60,
            bpm: state.bpm,
            inclusive: true,
        });
        actions = actions.slice();
        actions.sort(function (a, b) {
            return a.beat - b.beat || precedence[a.type] - precedence[b.type];
        });
        actions.forEach(function (action) {
            const beat = action.beat;
            let seconds = state.seconds + ((beat - state.beat) * 60) / state.bpm;
            switch (action.type) {
                case 'bpm':
                    state.bpm = action.bpm;
                    segments.push({
                        t: seconds,
                        x: beat,
                        dx: state.bpm / 60,
                        bpm: state.bpm,
                        inclusive: true,
                    });
                    break;
                case 'stop':
                    segments.push({
                        t: seconds,
                        x: beat,
                        dx: 0,
                        bpm: state.bpm,
                        inclusive: true,
                    });
                    seconds += ((action.stopBeats || 0) * 60) / state.bpm;
                    segments.push({
                        t: seconds,
                        x: beat,
                        dx: state.bpm / 60,
                        bpm: state.bpm,
                        inclusive: false,
                    });
                    break;
                default:
                    throw new Error('인식할 수 없는 세그먼트 객체입니다!');
            }
            state.beat = beat;
            state.seconds = seconds;
        });
        this._speedcore = new Speedcore(segments);
        this._eventBeats = uniq(map(actions, (action) => action.beat));
    }

    /**
     * 주어진 박자를 초 단위로 변환합니다.
     * @param {number} beat
     */
    beatToSeconds(beat: number) {
        return this._speedcore.t(beat);
    }

    /**
     * 주어진 초를 박자로 변환합니다.
     * @param {number} seconds
     */
    secondsToBeat(seconds: number) {
        return this._speedcore.x(seconds);
    }

    /**
     * 지정된 박자의 BPM을 반환합니다.
     * @param {number} beat
     */
    bpmAtBeat(beat: number) {
        return this._speedcore.segmentAtX(beat).bpm;
    }

    /**
     * 이벤트가 있는 박자를 나타내는 배열을 반환합니다.
     */
    getEventBeats() {
        return this._eventBeats;
    }

    /**
     * BMSChart에서 Timing 인스턴스를 생성합니다.
     * @param {BMSChart} chart
     */
    static fromBMSChart(chart: BMSChart) {
        void BMSChart;
        const actions: TimingAction[] = [];
        chart.objects.all().forEach(function (object) {
            let bpm;
            const beat = chart.measureToBeat(object.measure, object.fraction);
            if (object.channel === '03') {
                bpm = parseInt(object.value, 16);
                actions.push({ type: 'bpm', beat: beat, bpm: bpm });
            } else if (object.channel === '08') {
                bpm = +chart.headers.get('bpm' + object.value)!;
                if (!isNaN(bpm)) actions.push({ type: 'bpm', beat: beat, bpm: bpm });
            } else if (object.channel === '09') {
                const stopBeats = +chart.headers.get('stop' + object.value)! / 48;
                actions.push({ type: 'stop', beat: beat, stopBeats: stopBeats });
            }
        });
        return new Timing(+chart.headers.get('bpm')! || 60, actions);
    }
}

export type TimingAction = BPMTimingAction | StopTimingAction;
export interface BaseTimingAction {
    /** 이 작업이 발생하는 위치 */
    beat: number;
}
export interface BPMTimingAction extends BaseTimingAction {
    type: 'bpm';
    /** 변경할 BPM 값 */
    bpm: number;
}
export interface StopTimingAction extends BaseTimingAction {
    type: 'stop';
    /** 멈출 박자 수 */
    stopBeats: number;
}

interface TimingSegment extends SpeedSegment {
    bpm: number;
}
