interface Note {
    keysound: string; // 키사운드 파일명
    keysoundStart?: number; // 키사운드 시작 위치
    keysoundEnd?: number; // 키사운드 종료 위치
}

interface PlayOptions {
    note: Note; // 재생할 노트 정보
    delay?: number; // 재생 지연 시간
    exclusive: boolean; // 독점 재생 여부
    slice?: any; // 추가적인 데이터
}

interface Sample {
    play: (delay: number, options: { start?: number; end?: number; group?: any }) => SoundInstance | null;
}

interface SoundInstance {
    stop: () => void; // 사운드 인스턴스를 중지하는 메서드
}

interface Master {
    group: (options: { volume?: number }) => any;
}

// 키사운드 재생을 위한 WaveFactory 클래스
export class WaveFactory {
    private _master: Master;
    private _samples: Record<string, Sample>;
    private _map: Record<string, string>;
    private _exclusiveInstances: Map<string, SoundInstance | null>;
    private _group: any;

    constructor(master: Master, samples: Record<string, Sample>, map: Record<string, string>, { volume }: { volume?: number } = {}) {
        this._master = master;
        this._samples = samples;
        this._map = map;
        this._exclusiveInstances = new Map();
        this._group = this._master.group({ volume });
    }

    // Autokeysound 노트를 제한된 폴리포니로 재생
    playAuto(note: Note, delay?: number, slice?: any) {
        return this._play({ note, delay, exclusive: true, slice });
    }

    // Hit 노트를 제한된 폴리포니로 재생하며, 인스턴스를 반환
    playNote(note: Note, delay?: number, slice?: any) {
        return this._play({ note, delay, exclusive: true, slice });
    }

    // Blank 영역에서 무제한 폴리포니로 노트를 재생
    playFree(note: Note, delay?: number, slice?: any) {
        return this._play({ note, delay: 0, exclusive: false, slice });
    }

    // 노트를 재생하는 내부 메서드
    private _play({ note, delay = 0, exclusive }: PlayOptions): SoundInstance | null {
        const keysound = note.keysound;
        if (exclusive) this._stopOldExclusiveSound(keysound, delay);

        const filename = this._map[keysound.toLowerCase()];
        if (!filename) return null;

        const sample = this._samples[filename];
        if (!sample) return null;

        const instance = sample.play(delay, {
            start: note.keysoundStart,
            end: note.keysoundEnd,
            group: this._group,
        });

        if (exclusive) this._exclusiveInstances.set(keysound, instance);
        return instance;
    }

    // 이전의 독점 재생 인스턴스를 중지하는 메서드
    private _stopOldExclusiveSound(keysound: string, delay: number) {
        const instance = this._exclusiveInstances.get(keysound);
        if (instance) {
            setTimeout(() => instance.stop(), delay * 1000);
            this._exclusiveInstances.delete(keysound);
        }
    }
}

export default WaveFactory;
