// 버퍼를 받아 문자 집합을 감지하고
// 디코딩된 문자열을 반환하는 모듈입니다.
//
// Reader는 문자 집합을 감지하기 위해
// [ruv-it!’s](http://hitkey.nekokan.dyndns.info/cmds.htm#CHARSET)을 따릅니다.
//
import { ReaderOptions } from './types';
import chardet from 'chardet';

/**
 * 버퍼를 읽고, 문자 집합을 감지하며, 디코딩된 문자열을 동기적으로 반환합니다.
 * @returns 디코딩된 텍스트
 */
export function read(buffer: Buffer, options: ReaderOptions | null = null): string {
    const charset = (options && options.forceEncoding) || chardet.detect(buffer);

    let decoder = new TextDecoder(charset ?? ''); // default 'utf-8' or 'utf8'
    const text = decoder.decode(buffer);
    if (text.charCodeAt(0) === 0xfeff) {
        return text.substr(1);
    } else {
        return text;
    }
}

export function readAsync(buffer: Buffer, options: ReaderOptions | null): Promise<string>;
export function readAsync(buffer: Buffer): Promise<string>;
export function readAsync(...args: any[]) {
    const buffer: Buffer = args[0];
    const options: ReaderOptions | null = args[1];
    return new Promise(function (resolve, reject) {
        try {
            resolve(read(buffer, options));
        } catch (e) {
            reject(e);
        }
    });
}

export { getReaderOptionsFromFilename } from './getReaderOptionsFromFilename';
