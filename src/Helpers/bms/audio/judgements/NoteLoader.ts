import _ from 'lodash';
import { Notechart } from '@Bms/audio/judgements/index';
import { PlayerOptions, NotechartInput, ExpertJudgmentWindow } from '@Bms/audio/judgements/types';
import { BMSChart, BMSNote, KeySounds, Notes, Positioning, SongInfo, Spacing, Timing } from '@Bms/parser';

/**
 * BMS 차트를 기반으로 Notechart 인스턴스를 생성합니다.
 *
 * @param bms BMS 차트 데이터
 * @param playerOptions 플레이어 설정 옵션
 * @returns Notechart 인스턴스
 */
export function fromBMSChart(bms: BMSChart, playerOptions: PlayerOptions) {
    // BMS 차트에서 노트를 생성합니다. 더블 모드인지에 따라 매핑이 달라집니다.
    const notes = Notes.fromBMSChart(bms, {
        mapping: playerOptions.double ? Notes.CHANNEL_MAPPING.IIDX_DP : Notes.CHANNEL_MAPPING.IIDX_P1,
    }).all();

    const landmineNotes = Notes.fromBMSChart(bms, {
        mapping: playerOptions.double ? Notes.CHANNEL_MAPPING.IIDX_DP_LANDMINE : Notes.CHANNEL_MAPPING.IIDX_P1_LANDMINE,
    }).all();

    // 타이밍, 키 사운드, 곡 정보, 위치 및 간격 설정을 BMS 차트에서 가져옵니다.
    const timing = Timing.fromBMSChart(bms);
    const keysounds = KeySounds.fromBMSChart(bms);
    const songInfo = SongInfo.fromBMSChart(bms);
    const positioning = Positioning.fromBMSChart(bms);
    const spacing = Spacing.fromBMSChart(bms);

    // Notechart 생성에 필요한 데이터 구성
    const data: NotechartInput = {
        notes,
        landmineNotes,
        timing,
        keysounds,
        songInfo,
        positioning,
        spacing,
        barLines: generateBarLinesFromBMS(notes, bms),
        expertJudgmentWindow: getJudgmentWindowFromBMS(bms),
    };

    // 구성된 데이터를 기반으로 Notechart 인스턴스 반환
    return new Notechart(data, playerOptions);
}

/**
 *
 * @param bms BMS 차트 데이터
 */
function getJudgmentWindowFromBMS(bms: BMSChart): ExpertJudgmentWindow {
    // 'rank' 헤더의 값에 따라 판정 창의 크기를 설정
    const rank = +bms.headers.get('rank')! || 2;
    if (rank === 0) return [8, 24]; // 매우 어려움
    if (rank === 1) return [15, 30]; // 어려움
    if (rank === 3) return [21, 60]; // 쉬움
    return [18, 40]; // 일반
}

/**
 * @param bmsNotes BMS 노트 배열
 * @param bms BMS 차트 데이터
 * @returns 바 라인의 비트 위치 배열
 */
function generateBarLinesFromBMS(bmsNotes: BMSNote[], bms: BMSChart) {
    // 차트에서 최대 비트를 가져옵니다.
    const max = _.max(bmsNotes.map((note) => note.endBeat || note.beat)) || 0;

    // 첫 번째 바 라인은 0 비트에서 시작
    const barLines = [0];
    let currentBeat = 0;
    let currentMeasure = 0;

    // 각 마디의 비트를 계산하여 바 라인을 생성
    do {
        currentBeat += bms.timeSignatures.getBeats(currentMeasure);
        currentMeasure += 1;
        barLines.push(currentBeat);
    } while (currentBeat <= max);

    // 바 라인 배열 반환
    return barLines;
}
