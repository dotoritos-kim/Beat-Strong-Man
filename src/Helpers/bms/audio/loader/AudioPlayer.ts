import _ from 'lodash';
import { GameNote, SoundedEvent } from '../judgements';
import { AudioPreloader } from './AudioPreloader';

/**
 * 이진 탐색 헬퍼 함수들
 * - lowerBound: 정렬된 notes에서, note.time >= targetTime 인 첫 위치를 찾는다.
 * - upperBound: 정렬된 notes에서, note.time >  targetTime 인 첫 위치를 찾는다.
 *   (upperBound - 1)이 targetTime 이하인 마지막 위치가 됨.
 */
function lowerBound<T extends GameNote | SoundedEvent>(notes: T[], targetTime: number): number {
    let left = 0;
    let right = notes.length; // right는 '배열 끝 + 1'을 가리키는 느낌

    while (left < right) {
        const mid = (left + right) >>> 1;
        if (notes[mid].time < targetTime) {
            // 목표보다 작으면, 범위를 오른쪽으로 좁힘
            left = mid + 1;
        } else {
            // notes[mid].time >= targetTime
            right = mid;
        }
    }
    return left;
}

function findClosestNote<T extends GameNote | SoundedEvent>(notes: T[], currentTime: number, tolerance: number): T | null {
    if (notes.length === 0) return null;

    // lowerBound로 "현재시각 이상"이 되는 첫 노트 인덱스 찾기
    const idx = lowerBound(notes, currentTime);

    // 후보: idx (현재시각 이상인 첫 노트), idx-1 (현재시각 이하인 마지막 노트)
    const candidates: T[] = [];
    if (idx < notes.length) {
        candidates.push(notes[idx]);
    }
    if (idx - 1 >= 0) {
        candidates.push(notes[idx - 1]);
    }

    // 후보 중에서 currentTime과의 차이가 가장 작은 노트 찾기
    let bestNote: T | null = null;
    let bestDiff = Number.MAX_VALUE;

    for (const note of candidates) {
        const diff = Math.abs(note.time - currentTime);
        if (diff < bestDiff) {
            bestDiff = diff;
            bestNote = note;
        }
    }

    // tolerance 범위 내라면 반환, 아니면 null
    if (bestNote && bestDiff <= tolerance) {
        return bestNote;
    }
    return null;
}

/**************************************
 * 4) createClosestNoteFinder
 *    - 한 번만 노트 배열을 time 기준으로 정렬
 *    - getClosestNote로 "가장 가까운 노트 한 개" 반환
 **************************************/
export function createClosestNoteFinder<T extends GameNote | SoundedEvent>(originalNotes: T[]) {
    // time 기준으로 정렬 (처음 한 번만)
    const notes = [...originalNotes].sort((a, b) => a.time - b.time);

    return {
        /**
         * getClosestNotes
         * - currentTime과 tolerance를 기준으로 가장 가까운 노트들을 반환
         * - 이미 사용된 노트는 건너뛴다.
         */
        getClosestNotes(currentTime: number, tolerance = 0.02): T[] {
            // 사용되지 않은 노트만 대상으로 함
            const availableNotes = notes.filter((n) => !(n as any).used);

            // lowerBound를 활용해 범위 내 노트를 찾음
            const lowerIdx = lowerBound(availableNotes, currentTime - tolerance);
            const upperIdx = lowerBound(availableNotes, currentTime + tolerance);

            // tolerance 범위 내의 노트를 반환
            return availableNotes.slice(lowerIdx, upperIdx).filter((note) => {
                const diff = Math.abs(note.time - currentTime);
                return diff <= tolerance;
            });
        },

        /**
         * markNoteAsUsed
         * - 특정 노트를 사용된 것으로 표시
         */
        markNoteAsUsed(note: T) {
            (note as any).used = true; // 동적으로 플래그 추가
        },

        /**
         * resetUsedNotes
         * - 모든 노트의 사용 상태를 초기화
         */
        resetUsedNotes() {
            notes.forEach((n) => {
                delete (n as any).used; // 플래그 제거
            });
        },
    };
}

export class PlayerAudio {
    private _preloader: AudioPreloader;
    private _notes: {
        getClosestNotes(currentTime: number, tolerance?: number): GameNote[] | null;
        markNoteAsUsed(note: GameNote): void;
        resetUsedNotes(): void;
    };
    private _autos: {
        getClosestNotes(currentTime: number, tolerance?: number): SoundedEvent[] | null;
        markNoteAsUsed(note: SoundedEvent): void;
        resetUsedNotes(): void;
    };
    constructor(notes: GameNote[], autos: SoundedEvent[], preloader: AudioPreloader) {
        this._notes = createClosestNoteFinder<GameNote>(notes);
        this._autos = createClosestNoteFinder<SoundedEvent>(autos);

        this._preloader = preloader;

        console.log('[PlayerAudio] notes Finder:', this._notes);
        console.log('[PlayerAudio] autos Finder:', this._autos);
    }

    /**
     * playAutoKeySound
     * - matchedNote에 사용 플래그를 추가
     */
    playAutoKeySound(currentTime: number) {
        const matchedNotes = this._autos.getClosestNotes(currentTime, 0.02); // 여러 개의 노트 반환

        // 반환된 모든 노트 처리
        if (matchedNotes && matchedNotes.length > 0) {
            matchedNotes.forEach(async (matchedNote) => {
                if (matchedNote.used !== true) {
                    await this._preloader.playAudio(matchedNote.keysound.toLowerCase());
                    this._autos.markNoteAsUsed(matchedNote);
                }
            });
        }
    }

    playAutoNoteKeySound(currentTime: number) {
        const matchedNotes = this._notes.getClosestNotes(currentTime, 0.02); // 여러 개의 노트 반환

        // 반환된 모든 노트 처리
        if (matchedNotes && matchedNotes.length > 0) {
            matchedNotes.forEach(async (matchedNote) => {
                if (matchedNote.used !== true) {
                    await this._preloader.playAudio(matchedNote.keysound.toLowerCase());
                    this._notes.markNoteAsUsed(matchedNote);
                }
            });
        }
    }
    /**
     * resetUsedNotes
     * - 모든 노트의 사용 상태를 초기화
     */
    resetUsedNotes() {
        this._notes.resetUsedNotes();
        this._autos.resetUsedNotes();
    }
}
