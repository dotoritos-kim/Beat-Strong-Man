import * as BMS from '@Bms/parser/index';

/**
 * NotechartInput 인터페이스는 노트 차트 생성에 필요한 모든 입력 데이터를 정의합니다.
 */
export interface NotechartInput {
    notes: BMS.BMSNote[]; // 게임 내에서 플레이 가능한 모든 노트
    landmineNotes?: BMS.BMSNote[]; // 지뢰 노트(옵션)
    timing: BMS.Timing; // 타이밍 정보를 담은 객체
    keysounds: BMS.KeySounds; // 키 사운드 데이터
    songInfo: BMS.SongInfo; // 곡 정보
    positioning: BMS.Positioning; // 노트 위치 정보
    spacing: BMS.Spacing; // 노트 간격 정보

    /** 마디의 비트 위치 배열 */
    barLines: number[];

    /** 이미지 참조 객체 */
    images?: NotechartImages;

    /**
     * 전문가 점수 계산을 위한 판정 창 (IIDX 스타일 EX-점수).
     * 2-튜플을 반환하며, 첫 번째는 +2 점수 (PGREAT)의 최대 오프셋,
     * 두 번째는 +1 점수 (GREAT)의 최대 오프셋입니다.
     */
    expertJudgmentWindow: ExpertJudgmentWindow;
}

/** 오프셋을 정의 */
export type ExpertJudgmentWindow = [number, number];

/** Notechart에서 사용할 이미지 참조를 정의 */
export interface NotechartImages {
    eyecatch?: string; // 아이캐치 이미지
    background?: string; // 배경 이미지
}

/** 플레이어 설정 옵션 */
export interface PlayerOptions {
    scratch: 'off' | 'left' | 'right'; // 스크래치 옵션 설정
    double?: boolean; // 더블 모드 여부
}

/** 게임 이벤트 기본 인터페이스 */
export interface GameEvent {
    beat: number; // 이벤트의 비트 위치
    time: number; // 이벤트의 시간 위치
    position: number; // 게임 내 위치
}

/** 사운드가 있는 이벤트 인터페이스 */
export interface SoundedEvent extends GameEvent {
    keysound: string; // 해당 이벤트의 키 사운드
    keysoundStart?: number; // 키 사운드 시작 위치 (옵션)
    keysoundEnd?: number; // 키 사운드 종료 위치 (옵션)
}

/** 게임 내에서 플레이할 수 있는 노트 인터페이스 */
export interface GameNote extends SoundedEvent {
    id: number; // 노트 ID
    end?: GameEvent; // 긴 노트의 경우 종료 이벤트 (옵션)
    column: string; // 노트가 위치한 열
}

/** 게임 내에서 사용되는 지뢰 노트 인터페이스 */
export interface GameLandmine extends GameEvent {
    id: number; // 지뢰 ID
    column: string; // 지뢰가 위치한 열
}

/**
 * 노트 정보 인터페이스
 * - 이 노트에서 발생할 수 있는 최대 판정 수를 정의합니다.
 * - 일반 노트는 1, 긴 노트는 2로 설정됩니다.
 */
export interface NoteInfo {
    combos: 2 | 1;
}
