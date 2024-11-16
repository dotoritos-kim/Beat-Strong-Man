import _ from 'lodash';
import WaveFactory from './WaveFactory';
import { isBad } from '../judgements/Store';

export interface Note {
    keysound: string; // 키사운드 파일명
    keysoundStart?: number; // 키사운드 시작 위치
    keysoundEnd?: number; // 키사운드 종료 위치
    time: number; // 노트 발생 시간
    [key: string]: any; // 추가적인 속성
}

export type AutoplayEntry = Note;

// 플레이어의 오디오 재생 옵션을 정의
export interface PlayAudioOptions {
    play: {
        notechart: {
            keysounds: any;
            autos: AutoplayEntry[];
            notes: AutoplayEntry[];
        };
        options: {
            autosound: boolean;
        };
    };
    samples: any;
    master: any;
    waveFactory?: WaveFactory;
    volume: number;
}

// 사운드 알림을 정의하는 인터페이스
export interface SoundNotification {
    type: 'hit' | 'break' | 'free';
    note: any;
    judgment?: any;
}

// 자동 재생을 위한 함수
function autoPlay(array: AutoplayEntry[]) {
    array = _.sortBy(array, 'time');
    let i = 0;
    return {
        next(time: number): AutoplayEntry[] {
            const out: AutoplayEntry[] = [];
            for (; i < array.length && time >= array[i].time; i++) {
                out.push(array[i]);
            }
            return out;
        },
    };
}

// 플레이어의 오디오 제어를 위한 클래스
export class PlayController {
    private _waveFactory: WaveFactory;
    private _autos: ReturnType<typeof autoPlay>;
    private _notes: ReturnType<typeof autoPlay>;
    private _played: Map<any, any>;
    private _autosound: boolean;

    constructor({ play, samples, master, waveFactory, volume }: PlayAudioOptions) {
        const notechart = play.notechart;
        this._waveFactory = waveFactory || new WaveFactory(master, samples, notechart.keysounds, { volume });
        this._autos = autoPlay(notechart.autos);
        this._notes = autoPlay(notechart.notes);
        this._played = new Map();
        this._autosound = !!play.options.autosound;
    }

    update(time: number, state: any) {
        this._playAutokeysounds(time);
        this._playAutosounds(time, state);
        this._handleSoundNotifications((state && state.notifications.sounds) || []);
    }

    private _playAutokeysounds(time: number) {
        for (const auto of this._autos.next(time + 1 / 30)) {
            this._waveFactory.playAuto(auto, auto.time - time);
        }
    }

    private _playAutosounds(time: number, state: any) {
        const autosounds = this._notes.next(time + 1 / 30);
        const poor = state && state.stats.poor;
        const shouldPlay = this._autosound && !poor;
        if (!shouldPlay) return;
        for (const note of autosounds) {
            this._hitNote(note, note.time - time);
        }
    }

    private _handleSoundNotifications(soundNotifications: SoundNotification[]) {
        for (const notification of soundNotifications) {
            const { type, note } = notification;
            if (type === 'hit') {
                this._hitNote(note, 0, notification.judgment);
            } else if (type === 'break') {
                this._breakNote(note);
            } else if (type === 'free') {
                this._waveFactory.playFree(note, 0);
            }
        }
    }

    private _hitNote(note: any, delay: number, judgment?: any) {
        let instance = this._played.get(note);
        if (!instance) {
            instance = this._waveFactory.playNote(note, delay);
            this._played.set(note, instance);
        }
        if (instance) {
            if (isBad(judgment)) {
                instance.bad();
            }
        }
    }

    private _breakNote(note: any) {
        const instance = this._played.get(note);
        if (instance) {
            instance.stop();
        }
    }
}

export default PlayController;
