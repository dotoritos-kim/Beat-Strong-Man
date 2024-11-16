import _ from 'lodash';
import Notechart from './';

export enum Judgment {
    Missed = -1,
    Unjudged = 0,
    PGREAT = 1,
    GREAT = 2,
    Good = 3,
    Offbeat = 4,
}

export type JudgedJudgment = Exclude<Judgment, Judgment.Unjudged>;

export const UNJUDGED = Judgment.Unjudged;
export const MISSED = Judgment.Missed;

export type Timegate = {
    value: Judgment;
    timegate: number;
    endTimegate: number;
};
export type Timegates = Timegate[];

// 일반적인 시간 게이트 설정
const NORMAL_TIMEGATES: Timegates = [
    { value: 1, timegate: 0.02, endTimegate: 0.04 },
    { value: 2, timegate: 0.05, endTimegate: 0.1 },
    { value: 3, timegate: 0.1, endTimegate: 0.2 },
    { value: 4, timegate: 0.2, endTimegate: 0.2 },
];

// 입문자 단계별 시간 게이트 설정 (난이도에 따라 다름)
const TRANSITIONAL_BEGINNER_LV5_TIMEGATES: Timegates = [
    { value: 1, timegate: 0.021, endTimegate: 0.042 },
    { value: 2, timegate: 0.06, endTimegate: 0.12 },
    { value: 3, timegate: 0.12, endTimegate: 0.2 },
    { value: 4, timegate: 0.2, endTimegate: 0.2 },
];
const TRANSITIONAL_BEGINNER_LV4_TIMEGATES: Timegates = [
    { value: 1, timegate: 0.022, endTimegate: 0.044 },
    { value: 2, timegate: 0.07, endTimegate: 0.14 },
    { value: 3, timegate: 0.14, endTimegate: 0.2 },
    { value: 4, timegate: 0.2, endTimegate: 0.2 },
];
const TRANSITIONAL_BEGINNER_LV3_TIMEGATES: Timegates = [
    { value: 1, timegate: 0.023, endTimegate: 0.046 },
    { value: 2, timegate: 0.08, endTimegate: 0.16 },
    { value: 3, timegate: 0.16, endTimegate: 0.2 },
    { value: 4, timegate: 0.2, endTimegate: 0.2 },
];
const ABSOLUTE_BEGINNER_TIMEGATES: Timegates = [
    { value: 1, timegate: 0.024, endTimegate: 0.048 },
    { value: 2, timegate: 0.1, endTimegate: 0.18 },
    { value: 3, timegate: 0.18, endTimegate: 0.2 },
    { value: 4, timegate: 0.2, endTimegate: 0.2 },
];

export interface IJudge {
    getTimegates(gameTime: number | null, noteTime: number | null): Timegates;
}

// 고정된 시간 게이트 설정을 사용하는 판정 클래스
class FixedTimegatesJudge implements IJudge {
    constructor(private timegates: Timegates) {}
    getTimegates(_gameTime: number | null, _noteTime: number | null) {
        return this.timegates;
    }
}

// 튜토리얼 모드에서의 판정 클래스
class TutorialJudge implements IJudge {
    getTimegates(_gameTime: number | null, noteTime: number | null) {
        if (!noteTime || noteTime < 100) {
            return ABSOLUTE_BEGINNER_TIMEGATES;
        } else {
            return NORMAL_TIMEGATES;
        }
    }
}

const NORMAL_JUDGE = new FixedTimegatesJudge(NORMAL_TIMEGATES);

/**
 * 노트 차트와 설정에 따라 적절한 판정 클래스를 반환합니다.
 * @param notechart Notechart 인스턴스
 * @param tutorial 튜토리얼 모드 여부
 * @returns IJudge 인스턴스
 */
export function getJudgeForNotechart(notechart: Notechart, { tutorial = false }): IJudge {
    const info = notechart.songInfo;
    const insane = info.difficulty >= 5;
    if (tutorial) {
        return new TutorialJudge();
    }
    if (insane) {
        return NORMAL_JUDGE;
    }
    if (info.level === 1 || info.level === 2) {
        return new FixedTimegatesJudge(ABSOLUTE_BEGINNER_TIMEGATES);
    }
    if (info.level === 3) {
        return new FixedTimegatesJudge(TRANSITIONAL_BEGINNER_LV3_TIMEGATES);
    }
    if (info.level === 4) {
        return new FixedTimegatesJudge(TRANSITIONAL_BEGINNER_LV4_TIMEGATES);
    }
    if (info.level === 5) {
        return new FixedTimegatesJudge(TRANSITIONAL_BEGINNER_LV5_TIMEGATES);
    }
    return NORMAL_JUDGE;
}

/**
 * gameTime과 noteTime을 받아 적절한 판정을 반환합니다.
 *
 *  1 - PGREAT
 *  2 - GREAT
 *  3 - GOOD
 *  4 - OFFBEAT
 *  0 - (판정 안됨)
 * -1 - MISSED
 */
export function judgeTimeWith(f: (timegate: Timegate) => number) {
    return function judgeTimeWithF(gameTime: number, noteTime: number, judge: IJudge = NORMAL_JUDGE): Judgment {
        const timegates = judge.getTimegates(gameTime, noteTime);
        const delta = Math.abs(gameTime - noteTime);
        for (let i = 0; i < timegates.length; i++) {
            if (delta < f(timegates[i])) return timegates[i].value;
        }
        return gameTime < noteTime ? UNJUDGED : MISSED;
    };
}

// 기본 및 종료 시간에 따른 판정 함수 정의
export const judgeTime = judgeTimeWith((t) => t.timegate);
export const judgeEndTime = judgeTimeWith((t) => t.endTimegate);

/**
 * 특정 판정에 대한 시간 게이트를 반환합니다.
 */
export function timegate(judgment: Judgment, judge = NORMAL_JUDGE) {
    return _.find(judge.getTimegates(null, null), { value: judgment })!.timegate;
}

/**
 * 판정이 나쁜 (박자 벗어남) 경우 여부를 반환합니다.
 */
export function isBad(judgment: Judgment) {
    return judgment >= 4;
}

/**
 * 특정 판정이 콤보를 끊는지 여부를 반환합니다.
 */
export function breaksCombo(judgment: Judgment) {
    return judgment === MISSED || isBad(judgment);
}

/**
 * 판정에 따른 점수 가중치를 반환합니다.
 */
export function weight(judgment: Judgment) {
    if (judgment === 1) return 100;
    if (judgment === 2) return 80;
    if (judgment === 3) return 50;
    return 0;
}
