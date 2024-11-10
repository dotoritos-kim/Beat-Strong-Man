import { ReaderOptions } from './types';
import chardet from 'chardet';

export function read(buffer: Buffer) {
    throw new Error('브라우저에서는 동기 읽기를 지원하지 않습니다!');
}

export function readAsync(buffer: Buffer, options: ReaderOptions | null): Promise<string>;
export function readAsync(buffer: Buffer): Promise<string>;
export function readAsync(...args: any[]) {
    const buffer: Buffer = args[0];
    const options: ReaderOptions | null = args[1];
    const charset = (options && options.forceEncoding) || chardet.detect(buffer);
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function () {
            resolve(reader.result as string);
        };
        reader.onerror = function () {
            reject(new Error('읽을 수 없습니다.'));
        };
        reader.readAsText(new Blob([buffer]), charset ?? undefined);
    });
}

export { getReaderOptionsFromFilename } from './getReaderOptionsFromFilename';
