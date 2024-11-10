import { match } from '../../utils/match';
import { assign } from '../../utils/lodash';
import { BMSChart } from '../../bms/chart';

export interface ISongInfoData {
    title: string;
    artist: string;
    genre: string;
    subtitles: string[];
    subartists: string[];
    difficulty: number;
    level: number;
}

/**
 * SongInfo는 곡 정보(예: 제목, 아티스트, 장르)를 나타냅니다.
 *
 * ## 예제
 *
 * 다음과 같은 BMS가 있다고 가정해봅시다:
 *
 * ```
 * #TITLE Exargon [HYPER]
 * ```
 *
 * 이를 Compiler를 사용해 BMSChart로 파싱한 후,
 * `fromBMSChart()`를 사용하여 SongInfo를 생성할 수 있습니다:
 *
 * 그런 다음 속성에 접근하여 곡 정보를 조회할 수 있습니다.
 *
 */
export class SongInfo implements ISongInfoData {
    title: string;
    artist: string;
    genre: string;
    subtitles: string[];
    subartists: string[];
    difficulty: number;
    level: number;
    /**
     * 주어진 데이터로 SongInfo를 생성합니다.
     * @param info 이 인스턴스에 설정할 속성들
     */
    constructor(info: { [propertyName: string]: any }) {
        /** 곡 제목 */
        this.title = 'NO TITLE';
        /** 곡 아티스트 */
        this.artist = 'NO ARTIST';
        /** 곡 장르 */
        this.genre = 'NO GENRE';
        /**
         * 곡의 부제목, 요소당 한 줄씩.
         * 부제목은 NORMAL, HYPER, ANOTHER와 같이 난이도 이름을 나타내는 데 사용할 수 있습니다.
         * @type {string[]}
         */
        this.subtitles = [];
        /**
         * 곡의 다른 아티스트, 요소당 한 명씩.
         * @type {string[]}
         */
        this.subartists = [];
        /**
         * 난이도.
         * 숫자의 의미는 BMS의 [`#DIFFICULTY`](http:*hitkey.nekokan.dyndns.info/cmds.htm#DIFFICULTY) 헤더와 동일합니다.
         *
         * | 난이도 | 의미      |
         * | ------:|:--------:|
         * |      1 | BEGINNER |
         * |      2 | NORMAL   |
         * |      3 | HYPER    |
         * |      4 | ANOTHER  |
         * |      5 | INSANE   |
         */
        this.difficulty = 0;
        /**
         * 곡의 레벨.
         * BMS 차트에서 변환할 때, 이 값은 `#PLAYLEVEL` 헤더의 값입니다.
         */
        this.level = 0;
        if (info) assign(this, info);
    }

    /**
     * {BMSChart}에서 새로운 {SongInfo} 객체를 생성합니다.
     * @param chart {SongInfo}를 생성할 {BMSChart}
     */
    static fromBMSChart(chart: BMSChart) {
        void BMSChart;
        const info: Partial<ISongInfoData> = {};
        let title = chart.headers.get('title');
        const artist = chart.headers.get('artist');
        const genre = chart.headers.get('genre');
        const difficulty = +chart.headers.get('difficulty')! || 0;
        const level = +chart.headers.get('playlevel')! || 0;
        let subtitles = chart.headers.getAll('subtitle');
        const subartists = chart.headers.getAll('subartist');
        if (typeof title === 'string' && !subtitles) {
            const extractSubtitle = function (m: string[]) {
                title = m[1];
                subtitles = [m[2]];
            };
            match(title)
                .when(/^(.*\S)\s*-(.+?)-$/, extractSubtitle)
                .when(/^(.*\S)\s*～(.+?)～$/, extractSubtitle)
                .when(/^(.*\S)\s*\((.+?)\)$/, extractSubtitle)
                .when(/^(.*\S)\s*\[(.+?)\]$/, extractSubtitle)
                .when(/^(.*\S)\s*<(.+?)>$/, extractSubtitle);
        }
        if (title) info.title = title;
        if (artist) info.artist = artist;
        if (genre) info.genre = genre;
        if (subtitles) info.subtitles = subtitles;
        if (subartists) info.subartists = subartists;
        if (difficulty) info.difficulty = difficulty;
        if (level) info.level = level;
        return new SongInfo(info);
    }
}
