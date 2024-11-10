/**
 * TimeSignatures는 마디 번호로 색인된 박자 값들의 모음입니다.
 *
 * 마디 번호는 0부터 시작합니다.
 * 기본적으로 각 마디는 1의 마디 크기를 가지며,
 * 이는 일반적인 4/4 박자표를 나타냅니다.
 *
 * Compiler를 사용해 BMSChart로 파싱한 후,
 * TimeSignatures 객체에 접근할 수 있습니다:
 *
 * 또한 생성자를 사용하여 TimeSignatures를 처음부터 생성할 수도 있습니다.
 *
 * 이 클래스의 가장 유용한 사용법은
 * 마디와 분수를 비트 번호로 변환하는 것입니다.
 *
 * ```js
 * timeSignatures.measureToBeat(0, 0.000) // =>  0.0
 * timeSignatures.measureToBeat(0, 0.500) // =>  2.0
 * timeSignatures.measureToBeat(1, 0.000) // =>  4.0
 * timeSignatures.measureToBeat(1, 0.500) // =>  5.5
 * timeSignatures.measureToBeat(2, 0.000) // =>  7.0
 * timeSignatures.measureToBeat(2, 0.500) // =>  9.5
 * timeSignatures.measureToBeat(3, 0.000) // => 12.0
 * ```
 */
export class TimeSignatures {
    private _values: { [measure: number]: number };
    constructor() {
        this._values = {};
    }

    /**
     * 지정된 마디의 크기를 설정합니다.
     * @param measure 마디 번호로, 0부터 시작합니다.
     * @param value 마디 크기.
     *  예를 들어, 1.0 크기는 일반적인 4/4 박자를 나타내며,
     *  0.75 크기는 3/4 또는 6/8 박자를 나타냅니다.
     */
    set(measure: number, value: number) {
        this._values[measure] = value;
    }

    /**
     * 지정된 마디의 크기를 가져옵니다.
     * @param measure 마디 번호를 나타냅니다.
     * @returns 마디의 크기.
     *  기본적으로 마디는 크기 1을 가집니다.
     */
    get(measure: number): number {
        return this._values[measure] || 1;
    }

    /**
     * 지정된 마디의 비트 수를 가져옵니다.
     *
     * 한 비트가 4/4 박자에서 4분 음표와 동일하므로,
     * 이는 `(timeSignatures.get(measure) * 4)`와 동일합니다.
     * @param measure 마디 번호를 나타냅니다.
     * @returns 마디의 비트 단위 크기.
     */
    getBeats(measure: number): number {
        return this.get(measure) * 4;
    }

    /**
     * 마디 번호와 해당 마디 내의 분수를 비트 번호로 변환합니다.
     *
     * @param measure 마디 번호.
     * @param fraction 마디의 분수,
     * @returns 마디 0부터의 비트 수.
     */
    measureToBeat(measure: number, fraction: number): number {
        let sum = 0;
        for (let i = 0; i < measure; i++) sum += this.getBeats(i);
        return sum + this.getBeats(measure) * fraction;
    }
}
