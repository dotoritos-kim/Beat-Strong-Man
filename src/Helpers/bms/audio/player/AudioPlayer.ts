import PlayController, { Note } from './PlayController';

interface GameOptions {
    soundVolume: number; // 게임의 사운드 볼륨
}

// 각 플레이어의 노트차트와 옵션을 포함하는 인터페이스
interface Play {
    notechart: {
        keysounds: any; // 키사운드 정보
        autos: Note[]; // 자동 노트 배열
        notes: Note[]; // 플레이어가 조작하는 노트 배열
    };
    options: {
        autosound: boolean; // 자동 사운드 활성화 여부
    };
}

// 게임 내 오디오 설정 옵션을 정의
interface GameAudioOptions {
    game: {
        options: GameOptions; // 게임 전반의 설정 옵션
        players: Play[]; // 각 플레이어의 노트차트 정보 배열
    };
    samples: any; // 오디오 샘플 데이터
    master: {
        audioContext: AudioContext; // 오디오 컨텍스트 객체
        destroy: () => void; // 오디오 리소스 정리 함수
        unmute: () => void; // 음소거 해제 함수
    };
}

// 오디오 재생과 관련된 기능을 제공하는 AudioPlayer 클래스
export class AudioPlayer {
    private _master: GameAudioOptions['master'];
    private _context: AudioContext;
    private _players: Map<Play, PlayController>;

    constructor({ game, samples, master }: GameAudioOptions) {
        const volume = game.options.soundVolume;
        this._master = master;
        this._context = master.audioContext;
        // 각 플레이어의 노트차트를 PlayController 인스턴스로 매핑
        this._players = new Map(game.players.map((play) => [play, new PlayController({ play, samples, master, volume })]));
    }

    // 오디오 리소스를 정리하는 메서드
    destroy() {
        this._master.destroy();
    }

    // 오디오 음소거 해제 메서드
    unmute() {
        this._master.unmute();
    }

    // 오디오 컨텍스트 반환
    get context() {
        return this._context;
    }

    // 플레이어의 상태를 업데이트하는 메서드
    update(t: number, state: { player: (p: Play) => any }) {
        for (const [player, playerAudio] of this._players) {
            playerAudio.update(t, state.player(player));
        }
    }
}

export default AudioPlayer;
