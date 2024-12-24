/**
 * AudioLoader.worker.ts
 *
 * 오디오 파일을 fetch한 뒤 ArrayBuffer만 메인 스레드로 보내는 예시
 */
export function AudioLoaderWorker() {
    interface FileMap {
        [key: string]: string;
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
                    const url = `${baseUrl}/${fileName}`;
                    console.log(`[Worker] Fetch start: key=${key}, url=${url}`);

                    const response = await fetch(url);
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status} - ${response.statusText}`);
                    }

                    const arrayBuffer = await response.arrayBuffer();
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
                    // transfer 옵션으로 ArrayBuffer를 이관(복사 없이)하는 것이 성능에 좋음
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
