import { Speedcore } from '../speedcore';
import { BMSChart } from '../../bms/chart';
import { SpeedSegment } from '../speedcore/segment';

/**
 * Positioning은 곡의 박자와 화면상의 위치 간의 관계를 나타내며,
 * 두 값 사이를 변환하는 방법을 제공합니다.
 *
 * 일부 리듬 게임에서는 박자당 스크롤 양이 다를 수 있습니다.
 * StepMania의 `#SCROLL` 세그먼트가 그 예입니다.
 */
export class Positioning {
    _speedcore: Speedcore;
    /**
     * 주어진 `segments`로 Positioning을 생성합니다.
     * @param segments
     */
    constructor(segments: PositioningSegment[]) {
        this._speedcore = new Speedcore(segments);
    }

    /**
     * 지정된 박자에서의 스크롤 속도를 반환합니다.
     * @param beat 박자 번호
     */
    speed(beat: number) {
        return this._speedcore.dx(beat);
    }

    /**
     * 지정된 박자에서 총 경과된 스크롤 양을 반환합니다.
     * @param beat 박자 번호
     */
    position(beat: number) {
        return this._speedcore.x(beat);
    }

    /**
     * BMSChart에서 Positioning 객체를 생성합니다.
     * @param {BMSChart} chart Positioning을 생성할 BMSChart
     */
    static fromBMSChart(chart: BMSChart) {
        void BMSChart;
        const segments: SpeedSegment[] = [];
        let x = 0;
        segments.push({
            t: 0,
            x: x,
            dx: 1,
            inclusive: true,
        });
        chart.objects.allSorted().forEach(function (object) {
            if (object.channel === 'SC') {
                const beat = chart.measureToBeat(object.measure, object.fraction);
                const dx = +chart.headers.get('scroll' + object.value)!;
                if (isNaN(dx)) return;
                const previous = segments[segments.length - 1];
                x += (beat - previous.t) * previous.dx;
                if (beat === 0 && segments.length === 1) {
                    segments[0].dx = dx;
                } else {
                    segments.push({
                        t: beat,
                        x: x,
                        dx: dx,
                        inclusive: true,
                    });
                }
            }
        });
        return new Positioning(segments);
    }
}

export interface PositioningSegment extends SpeedSegment {
    /** 박자 번호 */
    t: number;
    /** 박자 `t`에서의 총 경과된 스크롤 양 */
    x: number;
    /** 박자당 스크롤 양 */
    dx: number;
    /** 세그먼트의 일부로 시작 박자 `t`를 포함할지 여부 */
    inclusive: boolean;
}
