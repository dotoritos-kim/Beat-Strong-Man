import _ from 'lodash';
import * as BMS from '@Bms/parser/index';
import { invariant } from '@epic-web/invariant';
import {
    NotechartInput,
    PlayerOptions,
    GameEvent,
    GameNote,
    SoundedEvent,
    NoteInfo,
    NotechartImages,
    GameLandmine,
} from '@Bms/audio/judgements/types';

export * from '@Bms/audio/judgements/types';

/**
 * Notechart 클래스는 단일 플레이어의 노트 차트에 대한 모든 정보를 관리하여
 * 게임에서 필요로 하는 정보를 제공합니다.
 */
export class Notechart {
    private _timing: BMS.Timing;
    private _keysounds: BMS.KeySounds;
    private _positioning: BMS.Positioning;
    private _spacing: BMS.Spacing;

    private _duration: number;
    private _notes: GameNote[];
    private _autos: SoundedEvent[];
    private _landmines: GameNote[];
    private _barLines: GameEvent[];
    private _samples: string[];
    private _infos: Map<GameNote, NoteInfo>;
    private _songInfo: BMS.SongInfo;
    private _images: NotechartImages | undefined;

    expertJudgmentWindow: [number, number];

    constructor(data: NotechartInput, playerOptions: Partial<PlayerOptions> = {}) {
        let {
            notes: bmsNotes,
            timing,
            keysounds,
            songInfo,
            positioning,
            spacing,
            barLines,
            images,
            expertJudgmentWindow,
            landmineNotes = [],
        } = data;

        invariant(bmsNotes, 'Expected "data.notes"');
        invariant(timing, 'Expected "data.timing"');
        invariant(keysounds, 'Expected "data.keysounds"');
        invariant(songInfo, 'Expected "data.songInfo"');
        invariant(positioning, 'Expected "data.positioning"');
        invariant(spacing, 'Expected "data.spacing"');
        invariant(barLines, 'Expected "data.barLines"');

        this.expertJudgmentWindow = expertJudgmentWindow;

        bmsNotes = this._preTransform(bmsNotes, playerOptions);

        this._timing = timing;
        this._positioning = positioning;
        this._spacing = spacing;
        this._keysounds = keysounds;
        this._duration = 0;
        this._notes = this._generatePlayableNotesFromBMS(bmsNotes);
        this._landmines = this._generatePlayableNotesFromBMS(landmineNotes);
        this._autos = this._generateAutoKeysoundEventsFromBMS(bmsNotes);
        this._barLines = this._generateBarLineEvents(barLines);
        this._samples = this._generateKeysoundFiles(keysounds);
        this._infos = new Map<GameNote, NoteInfo>(this._notes.map((note) => [note, this._getNoteInfo(note)] as [GameNote, NoteInfo]));
        this._songInfo = songInfo;
        this._images = images;
    }

    /**
     * 노트 이벤트 배열을 반환합니다.
     */
    get notes() {
        return this._notes;
    }

    /**
     * 지뢰 이벤트 배열을 반환합니다.
     */
    get landmines() {
        return this._landmines;
    }

    /**
     * 자동 키 사운드 이벤트 배열을 반환합니다.
     */
    get autos() {
        return this._autos;
    }

    /**
     * 사용할 모든 샘플 파일 배열을 반환합니다.
     */
    get samples() {
        return this._samples;
    }

    /**
     * 키 사운드 ID에서 파일 이름으로 매핑하는 객체를 반환합니다.
     */
    get keysounds() {
        return this._keysounds.all();
    }

    /**
     * 바 라인 이벤트를 나타내는 객체를 반환합니다.
     */
    get barLines() {
        return this._barLines;
    }

    /**
     * 이 노트차트의 모든 열 이름을 배열로 반환합니다.
     */
    get columns() {
        return ['SC', '1', '2', '3', '4', '5', '6', '7'];
    }

    /**
     * 노트차트의 전체 지속 시간(마지막 이벤트 시간)을 반환합니다.
     */
    get duration() {
        return this._duration;
    }

    /**
     * 노트차트의 곡 정보를 반환합니다.
     */
    get songInfo() {
        return this._songInfo;
    }

    /**
     * 아이캐치 이미지 반환
     */
    get eyecatchImage() {
        return (this._images && this._images.eyecatch) || 'eyecatch_image.png';
    }

    /**
     * 배경 이미지 반환
     */
    get backgroundImage() {
        return (this._images && this._images.background) || 'back_image.png';
    }

    /**
     * 특정 노트의 정보를 객체로 반환합니다.
     */
    info(note: GameNote): NoteInfo | undefined {
        return this._infos.get(note);
    }

    /**
     * 비트 수를 노래 안에서의 위치(초)로 변환합니다.
     */
    beatToSeconds(beat: number) {
        return this._timing.beatToSeconds(beat);
    }

    /**
     * 비트 수를 게임 내 위치로 변환합니다.
     */
    beatToPosition(beat: number) {
        return this._positioning.position(beat);
    }

    /**
     * 마디 수를 비트로 변환합니다.
     */
    measureToBeat(measure: number) {
        return (this._barLines[measure] || this._barLines[this._barLines.length - 1]).beat;
    }

    /**
     * 노래 안에서의 위치(초)를 비트 수로 변환합니다.
     */
    secondsToBeat(seconds: number) {
        return this._timing.secondsToBeat(seconds);
    }

    /**
     * 노래 안에서의 위치(초)를 게임 내 위치로 변환합니다.
     */
    secondsToPosition(seconds: number) {
        return this.beatToPosition(this.secondsToBeat(seconds));
    }

    /**
     * 특정 비트에서의 BPM을 찾습니다.
     */
    bpmAtBeat(beat: number) {
        return this._timing.bpmAtBeat(beat);
    }

    /**
     * 특정 비트에서의 스크롤 속도를 찾습니다.
     */
    scrollSpeedAtBeat(beat: any) {
        return this._positioning.speed(beat);
    }

    /**
     * 특정 비트에서의 노트 간격 요소를 계산합니다.
     */
    spacingAtBeat(beat: any) {
        return this._spacing.factor(beat);
    }

    /**
     * 스크래치 옵션에 따른 키 모드를 반환합니다.
     * @param scratch
     * @returns {string}
     */
    getKeyMode(scratch: string): string {
        const usedColumns: { [column: string]: boolean } = {};
        for (const note of this.notes) {
            usedColumns[note.column] = true;
        }
        if (scratch === 'off' && !usedColumns['1'] && !usedColumns['7']) return '5K';
        if (scratch === 'left' && !usedColumns['6'] && !usedColumns['7']) return '5K';
        if (scratch === 'right' && !usedColumns['1'] && !usedColumns['2']) return '5K';
        return '7K';
    }

    _preTransform(bmsNotes: BMS.BMSNote[], playerOptions: Partial<PlayerOptions>) {
        let chain = _.chain(bmsNotes);
        const keys = getKeys(bmsNotes);
        if (playerOptions.scratch === 'off') {
            chain = chain.map((note: BMS.BMSNote) => {
                if (note.column && note.column === 'SC') {
                    return Object.assign({}, note, { column: null });
                } else {
                    return note;
                }
            });
        }
        if (keys === '5K') {
            const columnsToShift = ['1', '2', '3', '4', '5', '6', '7'];
            const shiftNote = (amount: number) => (note: BMS.BMSNote) => {
                if (note.column) {
                    const index = columnsToShift.indexOf(note.column);
                    if (index > -1) {
                        const newIndex = index + amount;
                        invariant(newIndex < columnsToShift.length, '이상합니다. 열은 사용 가능한 열을 초과하여 이동할 수 없습니다.');
                        const newColumn = columnsToShift[newIndex];
                        return Object.assign({}, note, { column: newColumn });
                    }
                }
                return note;
            };
            if (playerOptions.scratch === 'off') {
                chain = chain.map(shiftNote(1));
            } else if (playerOptions.scratch === 'right') {
                chain = chain.map(shiftNote(2));
            }
        }
        return chain.value();
    }

    _generatePlayableNotesFromBMS(bmsNotes: BMS.BMSNote[]) {
        let nextId = 1;
        return bmsNotes
            .filter((note) => note.column)
            .map((note) => {
                const spec = this._generateEvent(note.beat) as GameNote;
                spec.id = nextId++;
                spec.column = note.column!;
                spec.keysound = note.keysound;
                spec.keysoundStart = note.keysoundStart;
                spec.keysoundEnd = note.keysoundEnd;
                this._updateDuration(spec);
                if (note.endBeat !== undefined) {
                    spec.end = this._generateEvent(note.endBeat);
                    this._updateDuration(spec.end);
                } else {
                    spec.end = undefined;
                }
                return spec;
            });
    }

    _generateLandminesFromBMS(bmsNotes: BMS.BMSNote[]) {
        let nextId = 1;
        return bmsNotes
            .filter((note) => note.column)
            .map((note) => {
                const spec = this._generateEvent(note.beat) as GameLandmine;
                spec.id = nextId++;
                spec.column = note.column!;
                this._updateDuration(spec);
                return spec;
            });
    }

    _updateDuration(event: GameEvent) {
        if (event.time > this._duration) this._duration = event.time;
    }

    _generateAutoKeysoundEventsFromBMS(bmsNotes: BMS.BMSNote[]) {
        return bmsNotes
            .filter((note) => !note.column)
            .map((note) => {
                const spec = this._generateEvent(note.beat) as SoundedEvent;
                spec.keysound = note.keysound;
                spec.keysoundStart = note.keysoundStart;
                spec.keysoundEnd = note.keysoundEnd;
                return spec;
            });
    }

    _generateKeysoundFiles(keysounds: BMS.KeySounds): string[] {
        const set = new Set<string>();
        for (const array of [this.notes, this.autos]) {
            for (const event_ of array) {
                const file = keysounds.get(event_.keysound);
                if (file) set.add(file);
            }
        }
        return Array.from(set);
    }

    _generateBarLineEvents(beats: number[]) {
        return beats.map((beat) => this._generateEvent(beat));
    }

    _generateEvent(beat: number): GameEvent {
        return {
            beat: beat,
            time: this.beatToSeconds(beat),
            position: this.beatToPosition(beat),
        };
    }

    _getNoteInfo(note: GameNote): NoteInfo {
        return { combos: note.end ? 2 : 1 };
    }
}

export default Notechart;

function getKeys(bmsNotes: BMS.BMSNote[]) {
    for (const note of bmsNotes) {
        if (note.column === '6' || note.column === '7') {
            return '7K';
        }
    }
    return '5K';
}
