/**
 * AudioPreloader.ts
 *
 * - 메인 스레드에서 Worker를 생성, 오디오 파일을 다운로드(ArrayBuffer)만 수행.
 * - 다운로드가 완료되면 메인 스레드(React)에서 AudioContext.decodeAudioData로 디코딩.
 *
 * 즉, "Worker = 단순 fetch 전담", "메인 스레드 = 디코딩 + 재생" 구조.
 */
export interface FileMap {
    [key: string]: string; // 예: {"10": "파일명.wav", ...}
}

export class AudioPreloader {
    private worker: Worker;
    // key별 ArrayBuffer (아직 디코딩 전)
    private audioDataMap: Map<string, ArrayBuffer> = new Map();
    // key별 AudioBuffer (디코딩 완료된 오디오)
    private audioBuffers: Map<string, AudioBuffer> = new Map();

    private loadingProgress: number = 0; // 전체 로딩 진행도 (0~1)
    private loadedCount: number = 0; // 로드된 파일 개수
    private totalCount: number = 0; // 전체 파일 개수
    public isWorkerDone: boolean = false; // Worker에서 DONE 되었는지 여부

    private audioContext: AudioContext;

    // 현재 재생 중인 오디오 키를 추적하기 위한 Set
    private currentlyPlaying: Set<string> = new Set();

    constructor(
        private baseUrl: string,
        private fileMap: FileMap,
        workerUrl: string, // Worker를 로딩할 경로 (또는 Blob)
    ) {
        // React 환경에서 전역적으로 AudioContext 하나만 생성
        // (필요하다면 Lazy하게 생성해도 됨)
        this.audioContext = new AudioContext();

        // Worker 생성
        this.worker = new Worker(workerUrl);

        this.worker.onmessage = (e: MessageEvent) => {
            const { type, payload } = e.data;
            console.log('[Main] Worker message:', type, payload);

            switch (type) {
                case 'PROGRESS': {
                    const { key, fileName, loadedCount, total } = payload;
                    this.loadingProgress = loadedCount / total;
                    this.loadedCount = loadedCount;
                    this.totalCount = total;
                    break;
                }
                case 'LOADED': {
                    const { key, fileName, arrayBuffer } = payload;
                    this.audioDataMap.set(key, arrayBuffer);
                    break;
                }
                case 'DONE': {
                    console.log(`[Done] 총 ${payload.total}개 파일 로딩(다운로드) 완료`);
                    this.isWorkerDone = true;
                    break;
                }
                case 'ERROR': {
                    const { key, fileName, message } = payload;
                    console.error(`[Error] key=${key}, file=${fileName}, 이유=${message}`);
                    break;
                }
            }
        };
    }

    /**
     * Worker에게 로딩(다운로드) 시작 요청
     */
    public loadAll(): Promise<void> {
        return new Promise((resolve, reject) => {
            console.log('[Main] loadAll() start');

            // fileMap 기준으로 전체 갯수 파악
            const fileCount = Object.keys(this.fileMap).length;
            if (fileCount === 0) {
                // 로드할 게 없으면 바로 resolve
                this.isWorkerDone = true;
                resolve();
                return;
            }

            // Worker에 "LOAD_AUDIO" 메시지 전달
            this.worker.postMessage({
                type: 'LOAD_AUDIO',
                payload: {
                    baseUrl: this.baseUrl,
                    fileMap: this.fileMap,
                },
            });

            // Worker에서 DONE or ERROR가 오면
            const onMessage = (e: MessageEvent) => {
                const { type, payload } = e.data;

                if (type === 'DONE') {
                    console.log('[Main] loadAll() end: DONE from Worker');
                    this.worker.removeEventListener('message', onMessage);
                    // Worker 다운로드는 끝났지만, 아직 디코딩이 안 됐을 수 있음
                    // 여기서는 Promise를 resolve시킬 것이냐,
                    // 아니면 디코딩까지 마친 뒤 resolve시킬 것이냐를 결정.

                    // 여기서는 "다운로드 완료 시점"에 일단 resolve하는 예시
                    // 만약 "디코딩까지 끝난 시점"에 resolve하려면 아래 decodeAll()까지 기다리면 됨.
                    resolve();
                } else if (type === 'ERROR') {
                    console.error('[Main] loadAll() got ERROR:', payload);
                    this.worker.removeEventListener('message', onMessage);
                    reject(payload.message);
                }
            };
            this.worker.addEventListener('message', onMessage);
        });
    }

    /**
     * Worker에서 받은 ArrayBuffer들을 AudioContext.decodeAudioData로 디코딩
     * -> 비동기로 처리
     */
    public async decodeAll(): Promise<void> {
        // 이미 디코딩한 키는 건너뛰고, 아직 안 한 것만 디코딩
        const promises: Promise<void>[] = [];

        for (const [key, arrayBuffer] of this.audioDataMap.entries()) {
            // 이미 audioBuffers에 있으면(디코딩됨) 스킵
            if (this.audioBuffers.has(key)) {
                continue;
            }

            const p = this.audioContext
                .decodeAudioData(arrayBuffer.slice(0)) // slice()로 복사본 만들기 권장 (모바일 브라우저 이슈 대비)
                .then((audioBuffer) => {
                    this.audioBuffers.set(key, audioBuffer);
                })
                .catch((err) => {
                    console.error(`[Decode fail] key=${key}`, err);
                    // 실패 시 무음 버퍼로 대체
                    const silentBuffer = this.audioContext.createBuffer(2, this.audioContext.sampleRate * 1, this.audioContext.sampleRate);
                    this.audioBuffers.set(key, silentBuffer);
                });
            promises.push(p);
        }

        await Promise.all(promises);
        console.log('[Main] All decode done.');
    }

    /**
     * 오디오 재생
     * - 이미 해당 key의 오디오가 재생 중이라면 무시
     */
    public playAudio(key: string) {
        //if (this.currentlyPlaying.has(key)) {
        //    console.log(`Audio with key=${key} is already playing. Ignoring.`);
        //    return;
        //}

        const audioBuffer = this.audioBuffers.get(key);
        if (!audioBuffer) {
            console.warn(`해당 키(${key})의 AudioBuffer가 없습니다. (디코딩 안 됐거나 다운로드 실패)`);
            return;
        }

        // AudioBufferSourceNode 생성 및 설정
        const source = this.audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(this.audioContext.destination);
        source.start(0);

        // 현재 재생 중인 key에 추가
        this.currentlyPlaying.add(key);
        console.log(`재생 시작: key=${key}`);

        // 재생이 끝났을 때 key를 Set에서 제거
        source.onended = () => {
            this.currentlyPlaying.delete(key);
            console.log(`재생 종료: key=${key}`);
        };
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

    public getAudioBuffer(key: string): AudioBuffer | undefined {
        return this.audioBuffers.get(key);
    }
}
