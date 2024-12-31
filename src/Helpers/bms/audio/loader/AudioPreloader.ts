/**
 * AudioPreloader.ts
 *
 *  - Worker = 오디오 파일 다운로드
 *  - 메인 스레드 = decodeAudioData & AudioWorklet 재생
 *  - 멀티 트랙, 마스터 볼륨 & 로우패스 필터 적용
 */
import AudioProcessor from './AudioProcessor.worklet';
import { AudioProcessorPostMessage, DriveSettings, DynamicsSettings, EffectsSettings, EQBand, ModulationSettings } from './types';

export interface FileMap {
    [key: string]: string; // 예: { "kick": "kick.wav", "bgm": "bgm.ogg" }
}

export class AudioPreloader {
    private worker: Worker;
    private audioDataMap = new Map<string, ArrayBuffer>();
    private audioBuffers = new Map<string, AudioBuffer>();

    private loadingProgress = 0;
    private loadedCount = 0;
    private totalCount = 0;
    public isWorkerDone = false;

    private audioContext: AudioContext;
    private audioWorkletNode: AudioWorkletNode | null = null;

    constructor(
        private baseUrl: string,
        private fileMap: FileMap,
        workerUrl: string,
        private onWorkerMessage?: (type: string, payload: any) => void,
    ) {
        this.audioContext = new AudioContext();
        this.worker = new Worker(workerUrl);
        this.worker.onmessage = (e) => {
            const { type, payload } = e.data;
            if (this.onWorkerMessage) {
                this.onWorkerMessage(type, payload);
            }
            switch (type) {
                case 'PROGRESS':
                    this.loadingProgress = payload.loadedCount / payload.total;
                    this.loadedCount = payload.loadedCount;
                    this.totalCount = payload.total;
                    break;
                case 'LOADED':
                    this.audioDataMap.set(payload.key, payload.arrayBuffer);
                    break;
                case 'DONE':
                    this.isWorkerDone = true;
                    break;
                case 'ERROR':
                    console.error(`[Error] key=${payload.key}, file=${payload.fileName}, msg=${payload.message}`);
                    break;
            }
        };
    }

    public loadAll(): Promise<void> {
        return new Promise((resolve, reject) => {
            const fileCount = Object.keys(this.fileMap).length;
            if (fileCount === 0) {
                this.isWorkerDone = true;
                resolve();
                return;
            }

            this.worker.postMessage({
                type: 'LOAD_AUDIO',
                payload: { baseUrl: this.baseUrl, fileMap: this.fileMap },
            });

            const onMessage = (e: MessageEvent) => {
                const { type, payload } = e.data;
                if (type === 'DONE') {
                    this.worker.removeEventListener('message', onMessage);
                    resolve();
                } else if (type === 'ERROR') {
                    this.worker.removeEventListener('message', onMessage);
                    reject(payload.message);
                }
            };
            this.worker.addEventListener('message', onMessage);
        });
    }

    public async decodeAll(): Promise<void> {
        const promises: Promise<void>[] = [];
        for (const [key, arrayBuf] of this.audioDataMap.entries()) {
            if (this.audioBuffers.has(key)) continue;
            const p = this.audioContext
                .decodeAudioData(arrayBuf.slice(0))
                .then((audioBuf) => {
                    this.audioBuffers.set(key, audioBuf);
                })
                .catch((err) => {
                    console.error(`[Decode fail] key=${key}`, err);
                    // 실패 시 무음
                    const silent = this.audioContext.createBuffer(1, this.audioContext.sampleRate, this.audioContext.sampleRate);
                    this.audioBuffers.set(key, silent);
                });
            promises.push(p);
        }
        await Promise.all(promises);
    }

    public async initAudioWorklet(moduleUrl: string) {
        await this.audioContext.audioWorklet.addModule(AudioProcessor);
        this.audioWorkletNode = new AudioWorkletNode(this.audioContext, 'audio-worklet-processor');
        this.audioWorkletNode.connect(this.audioContext.destination);

        this.audioWorkletNode.port.onmessage = (event) => {
            const { type, key, data } = event.data;
            if (type === 'latencyReport') {
                console.log(`[Latency Report] Track=${key}, Latency=${data?.latency ?? 'Unknown'}`);
            }
        };
    }

    public playAudio(key: string, loop = false) {
        if (!this.audioWorkletNode) {
            console.error('AudioWorkletNode not initialized.');
            return;
        }
        const audioBuffer = this.audioBuffers.get(key);
        if (!audioBuffer) {
            console.warn(`No AudioBuffer for key=${key}`);
            return;
        }
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        const float32Data = audioBuffer.getChannelData(0).slice(0);

        this.postTypedMessage<AudioProcessorPostMessage>({
            type: 'play',
            key,
            data: { buffer: float32Data, loop },
        });
    }

    public adjustVolume(key: string, volume: number) {
        this.postTypedMessage({ type: 'adjustVolume', key, data: volume });
    }

    public adjustEQ(key: string, bandSettings: EQBand[]) {
        this.postTypedMessage({ type: 'adjustEQ', key, data: bandSettings });
    }

    public adjustModulation(key: string, settings: ModulationSettings) {
        this.postTypedMessage({ type: 'adjustModulation', key, data: settings });
    }

    public adjustEffects(key: string, settings: EffectsSettings) {
        this.postTypedMessage({ type: 'adjustEffects', key, data: settings });
    }

    public adjustDrive(key: string, settings: DriveSettings) {
        this.postTypedMessage({ type: 'adjustDrive', key, data: settings });
    }

    public adjustDynamics(key: string, settings: DynamicsSettings) {
        this.postTypedMessage({ type: 'adjustDynamics', key, data: settings });
    }

    private postTypedMessage<T>(message: T, options?: StructuredSerializeOptions): void {
        if (!this.audioWorkletNode) {
            console.error('AudioWorkletNode not initialized.');
            return;
        }
        this.audioWorkletNode.port.postMessage(message, options);
    }

    public releaseAllResources(): void {
        this.audioDataMap.clear();
        this.audioBuffers.clear();
        if (this.audioContext.state !== 'closed') {
            this.audioContext.close();
        }
        console.log('[Main] All resources released.');
    }

    public get progress() {
        return this.loadingProgress;
    }
    public get downloadedCount() {
        return this.loadedCount;
    }
    public get downloadedTotal() {
        return this.totalCount;
    }
    public get loaded() {
        return this.isWorkerDone;
    }
}
