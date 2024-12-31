import { elapsedTime, HighresTimeType, startTime } from '@apigames/highres-timer';
import { MainThread } from './input/index';
import { Timer } from 'Helpers/timer';
import { AudioPreloader, FileMap } from './audio/loader/AudioPreloader';
import { PlayerAudio } from './audio/loader/AudioPlayer';
import { millisToMinutesAndSeconds, millisToSeconds, removeFileName } from 'Helpers/functions';
import { GameNote, SoundedEvent } from './audio/judgements';
import { debounce, throttle } from 'lodash';
import { RAFMonitor } from './monitor/RAFMonitor';
import { fileURLToPath } from 'url'; // 👈 추가
import { KeyState } from './input/types';
export interface AudioSettingOptions {
    baseUrl: string;
    fileMap: FileMap;
    workerUrl: string;
    notes: GameNote[];
    autos: SoundedEvent[];
    gameLoaderCallback: (type: string, message: string) => void;
}

export interface PlayOptions {
    isAutoPlay: boolean; //자동 재생 되어야하는 키 사운드 ON OFF
    isKeySoundAutoPlay: boolean; // 노트 키사운드 자동재생 ON OFF
    gameInputCallback: (message: string, keys: Array<{ key: string; state: KeyState }>) => void;
    gameProgressCallback: () => void;
}

export class GameController {
    rafMonitor = new RAFMonitor();
    private _endGameLoop!: () => boolean;
    private intervalId: number | undefined;
    public _inputThread: MainThread;
    public inputKeys: Array<{ key: string; state: KeyState }> = [];
    public currentNotes: GameNote[] = [];

    public _startTime: HighresTimeType | undefined;
    public _startDate: Date | undefined;
    public _nowTime: number | undefined;
    public _nowSec: string | undefined;
    public _stopTime: number | undefined;

    public _message: string = '';
    public _workerMessage: string = '';

    public _audioPreloader: AudioPreloader | undefined;
    public _playerAudio: PlayerAudio | undefined;

    public audioPreloaderMessage: string = '';
    public isAudioReady: boolean = false;

    public isAutoPlay: boolean = false;
    public isKeySoundAutoPlay: boolean = false;

    gameInputCallback: ((message: string, keys: Array<{ key: string; state: KeyState }>) => void) | undefined;
    gameProgressCallback: (() => void) | undefined;
    gameLoaderCallback: ((type: string, payload: any) => void) | undefined;

    constructor() {
        this._inputThread = new MainThread((e, keys, keyStates) => {
            this.getInput(e, keys, keyStates);
        });

        this.rafMonitor.startMonitoring(100);
        this._setupVisibilityChangeListener();
    }

    async audioSetting(options: AudioSettingOptions) {
        this.gameLoaderCallback = options.gameLoaderCallback;
        this._audioPreloader = new AudioPreloader(
            removeFileName(options.baseUrl),
            options.fileMap,
            options.workerUrl,
            this.gameLoaderCallback,
        );
        this._playerAudio = new PlayerAudio(options.notes, options.autos, this._audioPreloader);
        await this._audioPreloader.loadAll();
        await this._audioPreloader.decodeAll();

        await this._audioPreloader.initAudioWorklet('');
        if (this._audioPreloader.isWorkerDone) {
            this.isAudioReady = true;
        }
    }

    getInput(message: string, keys: string[], keyStates: Array<{ key: string; state: KeyState }>) {
        if (this._startDate && this.gameInputCallback) {
            const tmpDate = new Date(this._startDate!.getTime() + this._nowTime!);
            this._message = `[${tmpDate} .${tmpDate.getMilliseconds()}ms] 입력된 키: ${JSON.stringify(keys)}`;
            this._workerMessage = message;
            this.inputKeys = keyStates;
            Timer.end('down');
            this.gameInputCallback(message, keyStates);
        }
    }

    start(playOptions: PlayOptions) {
        this.gameInputCallback = playOptions.gameInputCallback;
        this.gameProgressCallback = playOptions.gameProgressCallback;
        this.isAutoPlay = playOptions.isAutoPlay;
        this.isKeySoundAutoPlay = playOptions.isKeySoundAutoPlay;

        this._startTime = startTime();
        const tmpDate = new Date();
        tmpDate.setMilliseconds(0);
        tmpDate.setSeconds(0, 0);
        const milliSecAdd = this._startTime[0];
        const nanoAdd = this._startTime[1];
        const nanoToMilliseconds = Math.floor(nanoAdd / 1_000_000);
        tmpDate.setMilliseconds(tmpDate.getMilliseconds() + milliSecAdd + nanoToMilliseconds);

        this._startDate = tmpDate;
        console.log(`Final Date: ${tmpDate}`);

        this._runGameLoop();
        this._endGameLoop = () => {
            if (this.intervalId) clearInterval(this.intervalId);
            if (this._startTime) this._stopTime = elapsedTime(this._startTime);
            console.log(this._stopTime);
            return true;
        };
    }

    destroy() {
        this._endGameLoop();
        this._inputThread.terminateWorker();
        if (this._playerAudio) this._playerAudio?.resetUsedNotes();
        if (this._audioPreloader) this._audioPreloader.releaseAllResources();
        this.audioPreloaderMessage = '';
        this.isAudioReady = false;
        this.isAutoPlay = false;
        this.isKeySoundAutoPlay = false;
        this._startTime = undefined;
        this._startDate = undefined;
        this._nowTime = undefined;
        this._nowSec = undefined;
        this._stopTime = undefined;
    }

    private _update() {
        this._nowTime = elapsedTime(this._startTime!);
        if (this.gameProgressCallback) this.gameProgressCallback();

        const play = throttle(() => {
            if (this._playerAudio && this.isAudioReady && this._nowTime) {
                if (this.isAutoPlay) this._playerAudio.playAutoKeySound(millisToSeconds(this._nowTime));
                if (this.isKeySoundAutoPlay) this._playerAudio.playAutoNoteKeySound(millisToSeconds(this._nowTime));
                this.currentNotes = this._playerAudio.getCurrentNote(millisToSeconds(this._nowTime));
                this._nowSec = millisToMinutesAndSeconds(this._nowTime);
            }
        }, 2);
        play();
    }

    private _runGameLoop() {
        const frame = () => {
            this._update();
            if (document.visibilityState === 'visible') {
                requestAnimationFrame(frame);
            }
        };
        const intervalUpdate = () => {
            if (document.visibilityState !== 'visible') {
                this._update();
            }
        };

        if (document.visibilityState === 'visible') {
            requestAnimationFrame(frame);
        } else {
            this.intervalId = setInterval(intervalUpdate, 16) as unknown as number;
        }
    }

    private _setupVisibilityChangeListener() {
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                if (this.intervalId) clearInterval(this.intervalId);
                this._runGameLoop();
            }
        });
    }
}

export default GameController;
