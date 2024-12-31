/**
 * AudioLoader.worker.ts
 *
 * 오디오 파일을 fetch한 뒤 ArrayBuffer만 메인 스레드로 보내는 예시
 */
export function AudioLoaderWorker() {
    interface FileMap {
        [key: string]: string;
    }

    // 파일 로드 함수: 실패 시 확장자 변경 후 재요청
    async function loadAudioFile(baseUrl: string, key: string, fileName: string): Promise<ArrayBuffer> {
        const tryFetch = async (url: string): Promise<Response> => {
            const response = await fetch(url, { cache: 'force-cache' });
            if (!response.ok && response.status === 404) {
                throw new Error(`HTTP 404 - Not Found`);
            }
            return response;
        };

        const url = `${baseUrl}/${fileName}`;
        const extension = fileName.split('.').pop()?.toLowerCase();
        try {
            // 첫 번째 시도
            const response = await tryFetch(url);
            return await response.arrayBuffer();
        } catch (error) {
            if (extension === 'wav') {
                // .wav 요청 실패 시 .ogg로 재시도
                const fallbackUrl = `${baseUrl}/${fileName.replace(/\.wav$/, '.ogg')}`;
                console.warn(`[Worker] Retry with .ogg: ${fallbackUrl}`);
                const response = await tryFetch(fallbackUrl);
                return await response.arrayBuffer();
            } else if (extension === 'ogg') {
                // .ogg 요청 실패 시 .wav로 재시도
                const fallbackUrl = `${baseUrl}/${fileName.replace(/\.ogg$/, '.wav')}`;
                console.warn(`[Worker] Retry with .wav: ${fallbackUrl}`);
                const response = await tryFetch(fallbackUrl);
                return await response.arrayBuffer();
            } else {
                // 다른 확장자는 재시도 없이 에러 처리
                throw error;
            }
        }
    }

    // Worker 메시지 핸들러
    self.onmessage = async (event: MessageEvent) => {
        const { type, payload } = event.data;
        if (type === 'LOAD_AUDIO') {
            const { baseUrl, fileMap } = payload as {
                baseUrl: string;
                fileMap: FileMap;
            };

            const entries = Object.entries(fileMap);
            const total = entries.length;
            let loadedCount = 0;

            for (const [key, fileName] of entries) {
                try {
                    // 파일 로드
                    const arrayBuffer = await loadAudioFile(baseUrl, key, fileName);
                    loadedCount++;

                    // 진행상황(PROGRESS) 전송
                    self.postMessage({
                        type: 'PROGRESS',
                        payload: {
                            key,
                            fileName,
                            loadedCount,
                            total,
                        },
                    });

                    // 메인 스레드로 ArrayBuffer 전송
                    self.postMessage(
                        {
                            type: 'LOADED',
                            payload: {
                                key,
                                fileName,
                                arrayBuffer,
                            },
                        },
                        [arrayBuffer],
                    );
                } catch (error) {
                    console.error(`[Worker] Audio load fail: key=${key}, file=${fileName}`, error);
                    self.postMessage({
                        type: 'ERROR',
                        payload: { key, fileName, message: String(error) },
                    });
                }
            }

            // 모든 파일 로딩 완료
            self.postMessage({
                type: 'DONE',
                payload: { total },
            });
        }
    };
}

// 아래는 TS에서 Worker 코드를 문자열로 Blob 변환하는 로직(예시)
let code = AudioLoaderWorker.toString();
code = code.substring(code.indexOf('{') + 1, code.lastIndexOf('}'));

const blob = new Blob([code], { type: 'application/javascript' });
const blobUrl = URL.createObjectURL(blob);

export { blobUrl as AudioLoadWorker };
