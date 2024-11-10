/**
 * 파일 이름을 기반으로 리더 옵션을 반환합니다.
 * @param {string} filename 파일 이름
 */
export function getReaderOptionsFromFilename(filename: string) {
    let forceEncoding;
    if (filename.match(/\.sjis\.\w+$/i)) {
        forceEncoding = 'Shift-JIS';
    }
    if (filename.match(/\.euc_kr\.\w+$/i)) {
        forceEncoding = 'EUC-KR';
    }
    if (filename.match(/\.utf8\.\w+$/i)) {
        forceEncoding = 'UTF-8';
    }
    return { forceEncoding };
}
