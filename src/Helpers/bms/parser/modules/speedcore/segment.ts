import DataStructure, { Façade } from '@Bms/parser/utils/dataStructure';

export const Segment: Façade<SpeedSegment> = DataStructure<SpeedSegment>({
    t: 'number',
    x: 'number',
    dx: 'number',
});

export interface SpeedSegment {
    t: number;
    x: number;
    /** t당 x의 변화량 */
    dx: number;
    /** 세그먼트가 t를 포함하는지 여부 */
    inclusive: boolean;
}
