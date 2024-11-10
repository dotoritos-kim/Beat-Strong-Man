import { Segment, SpeedSegment } from './segment';

/**
 * Speedcore는 내부적으로 사용되는 작은 라이브러리입니다.
 * Speedcore는 단일 차원으로 키프레임된 선형 모션을 나타내며,
 * BPM 변화({Timing}), 노트 간격 계수({Spacing}), 또는 스크롤링 세그먼트({Positioning})를
 * 처리할 때 유용합니다. Speedcore는 Segment 배열로 생성됩니다.
 *
 * {Segment}는 `{ t, x, dx }`로 정의됩니다. 여기서:
 *
 * * speedcore.x(segment.t) = segment.x
 * * speedcore.t(segment.x) = segment.t
 * * speedcore.x(segment.t + dt) = segment.x + (segment.dx / dt)
 *
 * ## 설명
 *
 * 이러한 세그먼트를 템포 변경이라고 생각할 수 있습니다. 이때:
 *
 * * `t`는 곡 시작 이후 경과 시간(초)입니다.
 * * `x`는 곡 시작 이후 경과 박자입니다.
 * * `dx`는 `t`당 증가하는 `x`의 양으로, 이 경우 단위는 비트(박자) 초당입니다.
 *
 * 예를 들어, 140 BPM에서 시작하여 32 박자 후에 템포가 160 BPM으로 변경되고,
 * 128 박자 후(160번째 박자)에 템포가 다시 140 BPM으로 돌아가는 곡을 가정해 봅시다.
 *
 * 세 가지 세그먼트를 도출할 수 있습니다:
 *
 * 1. 0초일 때, 0 박자이고 초당 2.333 박자로 진행됩니다.
 * 2. 13.714초일 때, 32 박자이고 초당 2.667 박자로 진행됩니다.
 * 3. 61.714초일 때, 160 박자이고 초당 2.333 박자로 진행됩니다.
 *
 * 이 구조는 다음과 같이 표현됩니다:
 *
 * ```js
 * [ [0]: { t:  0.000,  x:   0,  dx: 2.333,  inclusive: true },
 *   [1]: { t: 13.714,  x:  32,  dx: 2.667,  inclusive: true },
 *   [2]: { t: 61.714,  x: 160,  dx: 2.333,  inclusive: true } ]
 * ```
 *
 * 이 데이터를 통해 특정 `t`에서 `x` 값을 확인할 수 있습니다.
 *
 * 예를 들어, "30초에서의 박자 수는 얼마인가?"라는 질문에 답하려면
 * `t < 30`인 `t`의 최대 값을 가진 세그먼트를 찾습니다.
 * 이 경우, 세그먼트 `[1]`입니다.
 *
 * `segment.x + (t - segment.t) * segment.dx`를 계산합니다.
 * 결과 박자 수는 (32 + (30 - 13.714) * 2.667) = 75.435입니다.
 *
 * 또한 이와 비슷한 방식으로 역방향 계산을 수행할 수도 있습니다.
 *
 * 흥미롭게도, 이러한 세그먼트를 사용하여 BPM 변화와 STOP 세그먼트의 효과를
 * 동일한 배열에서 나타낼 수 있습니다. 예를 들어, 150 BPM 곡에서
 * 32번째 박자에 2 박자 정지가 있을 경우 다음과 같이 표현할 수 있습니다:
 *
 * ```js
 * [ [0]: { t:  0.0,  x:  0,  dx: 2.5,  inclusive: true  },
 *   [1]: { t: 12.8,  x: 32,  dx: 0,    inclusive: true  },
 *   [2]: { t: 13.6,  x: 32,  dx: 2.5,  inclusive: false } ]
 * ```
 */
export class Speedcore<S extends SpeedSegment = SpeedSegment> {
    _segments: S[];
    /**
     * 주어진 세그먼트로 새로운 `Speedcore`를 생성합니다.
     */
    constructor(segments: S[]) {
        segments.forEach(Segment);
        this._segments = segments;
    }

    _reached(index: number, targetFn: (segment: S) => number, position: number) {
        if (index >= this._segments.length) return false;
        const segment = this._segments[index];
        const target = targetFn(segment);
        return segment.inclusive ? position >= target : position > target;
    }

    _segmentAt(targetFn: (segment: S) => number, position: number): S {
        for (let i = 0; i < this._segments.length; i++) {
            if (!this._reached(i + 1, targetFn, position)) return this._segments[i];
        }
        throw new Error('기준에 맞는 세그먼트를 찾을 수 없습니다 (이 오류는 발생하지 않아야 합니다)!');
    }

    segmentAtX(x: number) {
        return this._segmentAt(X, x);
    }

    segmentAtT(t: number) {
        return this._segmentAt(T, t);
    }

    /**
     * 주어진 _x_에서 _t_를 계산합니다.
     */
    t(x: number) {
        const segment = this.segmentAtX(x);
        return segment.t + (x - segment.x) / (segment.dx || 1);
    }

    /**
     * 주어진 _t_에서 _x_를 계산합니다.
     * @param {number} t
     */
    x(t: number) {
        const segment = this.segmentAtT(t);
        return segment.x + (t - segment.t) * segment.dx;
    }

    /**
     * 주어진 _t_에서 _dx_를 찾습니다.
     * @param {number} t
     */
    dx(t: number) {
        const segment = this.segmentAtT(t);
        return segment.dx;
    }
}

const T = (segment: SpeedSegment) => segment.t;
const X = (segment: SpeedSegment) => segment.x;
