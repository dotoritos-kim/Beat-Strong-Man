import { BMSHeaders } from './headers';
import { BMSObjects } from './objects';
import { TimeSignatures } from '../modules/time_signatures';

/**
 * BMSChart는 특정 BMS 노트차트에 대한 정보를 담고 있습니다.
 * BMSChart는 컴파일 후 이미 처리된 `#RANDOM` 정보를 포함하지 않습니다.
 *
 * BMSChart 자체로는 헤더 필드와 내부 객체에 접근하는 것 외에 유용한 작업을 수행할 수 없습니다.
 *
 * BMSChart에서 정보를 추출하려면,
 * {Keysounds}, {Notes}, {Timing}과 같은 상위 클래스의 문서를 참조하십시오.
 */
export class BMSChart {
    headers: BMSHeaders;
    objects: BMSObjects;
    timeSignatures: TimeSignatures;
    constructor() {
        /**
         * 이 노트차트의 BMS 전용 헤더를 나타내는 {BMSHeaders}
         */
        this.headers = new BMSHeaders();
        /**
         * 이 노트차트의 모든 객체를 나타내는 {BMSObjects}
         */
        this.objects = new BMSObjects();
        /**
         * 이 차트의 박자 정보를 나타내는 {TimeSignatures}
         */
        this.timeSignatures = new TimeSignatures();
    }

    /**
     * 마디 번호와 분수를 비트(박) 단위로 변환합니다.
     * 한 비트는 보통 박자에서 4분 음표와 동일합니다.
     *
     * @param {number} measure 마디 번호를 나타내며, 0부터 시작합니다.
     * @param {number} fraction 해당 마디 내의 분수를 나타내며, 0에서 1까지의 범위를 가집니다.
     */
    measureToBeat(measure: number, fraction: number) {
        return this.timeSignatures.measureToBeat(measure, fraction);
    }
}
