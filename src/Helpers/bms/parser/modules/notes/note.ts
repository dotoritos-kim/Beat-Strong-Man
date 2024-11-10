import DataStructure from 'data-structure';
/** 노트차트의 개별 노트 */
export interface BMSNote {
    beat: number;
    endBeat?: number;
    column?: string;
    keysound: string;

    /**
     * [bmson] 사운드 파일에서 재생을 시작할 시간(초).
     */
    keysoundStart?: number;

    /**
     * [bmson] 사운드 파일에서 재생을 중지할 시간(초).
     * `undefined`일 경우, 사운드 파일이 끝까지 재생됨을 의미합니다.
     */
    keysoundEnd?: number;
}

export const Note = DataStructure<BMSNote>({
    beat: 'number',
    endBeat: DataStructure.maybe<number>('number'),
    column: DataStructure.maybe<string>('string'),
    keysound: 'string',
});
