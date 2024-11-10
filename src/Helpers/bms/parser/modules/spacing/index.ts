import { Speedcore } from '../speedcore';
import { BMSChart } from '../../bms/chart';
import { SpeedSegment } from '../speedcore/segment';

/**
 * Spacing은 곡의 박자와 노트 간격 간의 관계를 나타냅니다.
 *
 * Pump It Up!과 같은 일부 리듬 게임에서는
 * 노트차트에 의해 속도(노트 간격 계수)가 조정될 수 있습니다.
 * StepMania의 `#SPEED` 세그먼트가 그 예입니다.
 */
export class Spacing {
    private _speedcore?: Speedcore;
    /**
     * 주어진 `segments`로 Spacing을 생성합니다.
     */
    constructor(segments: SpacingSegment[]) {
        if (segments.length > 0) {
            this._speedcore = new Speedcore(segments);
        }
    }

    /**
     * 지정된 박자에서의 노트 간격 계수를 반환합니다.
     * @param beat 박자
     */
    factor(beat: number) {
        if (this._speedcore) {
            return this._speedcore.x(beat);
        } else {
            return 1;
        }
    }

    /**
     * BMSChart에서 Spacing 객체를 생성합니다.
     *
     * ## `#SPEED` 및 `#xxxSP`
     *
     * 속도는 키프레임으로 정의됩니다. 이 키프레임은 선형 보간됩니다.
     *
     * ```
     * #SPEED01 1.0
     * #SPEED02 2.0
     *
     * #001SP:01010202
     * ```
     *
     * 이 예에서, 노트 간격 계수는 박자 1에서 1.0배에서 시작하여
     * 박자 2에서 2.0배로 점진적으로 변화합니다.
     *
     * Spacing 객체를 반환합니다.
     *
     * @param {BMSChart} chart 차트
     */
    static fromBMSChart(chart: BMSChart) {
        void BMSChart;
        const segments: SpacingSegment[] = [];
        chart.objects.allSorted().forEach(function (object) {
            if (object.channel === 'SP') {
                const beat = chart.measureToBeat(object.measure, object.fraction);
                const factor = +chart.headers.get('speed' + object.value)!;
                if (isNaN(factor)) return;
                if (segments.length > 0) {
                    const previous = segments[segments.length - 1];
                    previous.dx = (factor - previous.x) / (beat - previous.t);
                }
                segments.push({
                    t: beat,
                    x: factor,
                    dx: 0,
                    inclusive: true,
                });
            }
        });
        if (segments.length > 0) {
            segments.unshift({
                t: 0,
                x: segments[0].x,
                dx: 0,
                inclusive: true,
            });
        }
        return new Spacing(segments);
    }
}

export interface SpacingSegment extends SpeedSegment {
    /** 박자 번호 */
    t: number;
    /** 박자 `t`에서의 간격 */
    x: number;
    /**
     * 연속적인 속도 변화를 만들기 위한 박자당 간격 계수 변화량
     */
    dx: number;
    /**
     * 세그먼트의 일부로 시작 박자 `t`를 포함할지 여부
     */
    inclusive: boolean;
}
