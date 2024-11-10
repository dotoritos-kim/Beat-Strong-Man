/**
 * BMSHeader는 BMS 파일의 헤더 정보를 보유하며,
 * `#TITLE`, `#ARTIST`, `#BPM` 등과 같은 정보를 포함합니다.
 *
 * `get()` 메서드를 사용하여 헤더를 조회할 수 있습니다:
 *
 * ```js
 * chart.headers.get('title');
 * ```
 *
 * `#SUBTITLE`과 같이 여러 값을 포함할 수 있는 헤더 필드의 경우, `getAll()`을 사용하여
 * 모든 값을 가져올 수 있습니다:
 *
 * ```js
 * chart.headers.getAll()
 * ```
 */
export class BMSHeaders {
    private _data: { [field: string]: string };
    private _dataAll: { [field: string]: string[] };

    constructor() {
        this._data = {};
        this._dataAll = {};
    }

    /**
     * 콜백 함수를 사용하여 각 헤더 필드를 순회합니다.
     * @param callback 각 헤더 필드에 대해 호출되는 함수
     */
    each(callback: (key: string, value: string) => any) {
        for (const i in this._data) {
            callback(i, this._data[i]);
        }
    }

    /**
     * 헤더 필드의 최신 값을 가져옵니다.
     * @param name 필드 이름
     * @return 필드의 최신 값
     */
    get(name: string): string | undefined {
        return this._data[name.toLowerCase()];
    }

    /**
     * 헤더 필드의 모든 값을 가져옵니다.
     * 해당 메서드는 헤더 필드가 여러 번 지정될 때 유용합니다.
     * @param name 필드 이름
     */
    getAll(name: string): string[] | undefined {
        return this._dataAll[name.toLowerCase()];
    }

    /**
     * 헤더 필드의 값을 설정합니다.
     * @param name 필드 이름
     * @param value 필드 값
     */
    set(name: string, value: string) {
        const key = name.toLowerCase();
        this._data[key] = value;
        (this._dataAll[key] || (this._dataAll[key] = [])).push(value);
    }
}
