/**
 *   - Reader: Buffer에서 BMS 파일을 읽고, 문자 집합을 감지하여
 *     해당 문자 집합으로 버퍼를 String으로 디코딩합니다.
 *   - Compiler: String에서 BMS 소스를 읽어들여
 *     BMSChart로 변환하여 BMS 노트차트의 내부 표현을 만듭니다.
 *
 *   - BMSChart: BMSHeaders, BMSObjects, TimeSignatures로 구성됩니다.
 *   - BMSHeaders: BMS 파일의 헤더 문장을 나타냅니다.
 *   - BMSObjects: BMS 파일의 객체들을 나타냅니다.
 *   - BMSObject: 개별 객체를 나타냅니다.
 *
 *   - TimeSignatures: 악보의 박자 모음을 나타내며 마디 번호와 분수를
 *     비트 번호로 변환할 수 있습니다.
 *   - Timing: 악보의 타이밍 정보를 나타내며, 음악적 시간(박자)과
 *     메트릭 시간(초) 간 변환을 제공합니다.
 *   - SongInfo: 제목, 아티스트, 장르 등 기본 곡 정보를 나타냅니다.
 *   - Notes: 노트차트 내의 사운드 객체를 나타냅니다.
 *   - Keysounds: 키사운드 ID와 파일 이름 간의 매핑을 나타냅니다.
 *   - Positioning: 박자와 게임 내 위치 간의 매핑을 나타냅니다.
 *     일부 리듬 게임은 박자당 스크롤 양을 조정할 수 있습니다.
 *   - Spacing: 박자와 노트 간격 간의 매핑을 나타냅니다.
 *     일부 리듬 게임은 노트 간격(HI-SPEED)을 동적으로 조정할 수 있습니다.
 *   - Speedcore: 선형 애니메이션을 나타냅니다.
 */

import * as Reader from './modules/reader';
import * as Compiler from './modules/compiler';
import { ReaderOptions } from './modules/reader/types';
import { BMSChart } from './bms/chart';
import { BMSHeaders } from './bms/headers';
import { BMSObjects } from './bms/objects';
import { Speedcore } from './modules/speedcore';
import { TimeSignatures } from './modules/timeSignatures';
import { Notes, BMSNote } from './modules/notes';
import { Timing, TimingAction, BaseTimingAction, BPMTimingAction, StopTimingAction } from './modules/timing';
import { ISongInfoData, SongInfo } from './modules/songInfo';
import { Keysounds } from './modules/keySounds';
import { Positioning, PositioningSegment } from './modules/positioning';
import { SpacingSegment, Spacing } from './modules/spacing';
export class BMSParser {
    chart: BMSChart | null = null;

    /**
     * URL에서 BMS 파일을 가져와 읽습니다.
     * @param url - BMS 파일이 위치한 URL
     * @param fetchOptions - fetch 요청에 사용될 옵션
     * @returns BMS 파일 내용 문자열
     */
    async fetchFromUrl(url: string, fetchOptions?: RequestInit): Promise<string> {
        const response = await fetch(url, fetchOptions);
        if (!response.ok) {
            throw new Error(`Failed to fetch file from URL: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        return this.readBuffer(buffer);
    }

    /**
     * BMS 파일 버퍼를 읽고 UTF-8 문자열로 변환합니다.
     * @param buffer - BMS 파일 버퍼
     * @returns BMS 파일 내용 문자열
     */
    async readBuffer(buffer: Buffer): Promise<string> {
        return await Reader.readAsync(buffer);
    }

    /**
     * BMS 문자열을 BMSChart 구조로 컴파일합니다.
     * @param bmsString - BMS 파일 내용 문자열
     * @returns 컴파일된 BMSChart
     */
    compileString(bmsString: string): BMSChart {
        this.chart = Compiler.compile(bmsString).chart;
        return this.chart;
    }

    /**
     * BMSChart에서 제목, 아티스트, 장르 등 곡 정보를 추출합니다.
     * @returns 곡 정보를 담고 있는 객체
     */
    getSongInfo(): SongInfo | null {
        if (!this.chart) return null;
        return SongInfo.fromBMSChart(this.chart);
    }

    /**
     * 비트와 초 간 변환을 위한 타이밍 정보를 추출합니다.
     * @returns 비트에서 초로 변환을 관리하는 Timing 객체
     */
    getTiming(): Timing | null {
        if (!this.chart) return null;
        return Timing.fromBMSChart(this.chart);
    }

    /**
     * 게임 내 위치 변환을 위한 포지셔닝 정보를 추출합니다.
     * @returns 비트에서 게임 내 위치로 변환을 관리하는 Positioning 객체
     */
    getPositioning(): Positioning | null {
        if (!this.chart) return null;
        return Positioning.fromBMSChart(this.chart);
    }

    /**
     * BMSChart에서 노트 정보를 추출합니다.
     * @returns 파싱된 노트를 담고 있는 Notes 객체
     */
    getNotes(): Notes | null {
        if (!this.chart) return null;
        return Notes.fromBMSChart(this.chart);
    }
}
export { Reader, Compiler };
export type { ReaderOptions } from './modules/reader/types';
export type { BMSNote } from './modules/notes';
export type { TimingAction, BaseTimingAction, BPMTimingAction, StopTimingAction } from './modules/timing';
export type { ISongInfoData } from './modules/songInfo';
export type { PositioningSegment } from './modules/positioning';
export type { SpacingSegment } from './modules/spacing';
