export const removeFileName = (path: string): string => {
    if (path.startsWith('http://') || path.startsWith('https://')) {
        // HTTP 경로 처리
        return path.substring(0, path.lastIndexOf('/'));
    } else {
        // 운영체제 경로 처리 (Windows 또는 Unix)
        const separator = path.includes('\\') ? '\\' : '/';
        return path.substring(0, path.lastIndexOf(separator));
    }
};

export const millisToMinutesAndSeconds = (millis: number): string => {
    const minutes: number = Math.floor(millis / 60000);
    const seconds: number = Math.floor((millis % 60000) / 1000);
    const milliseconds: number = Math.floor(millis % 1000); // 소수점 방지를 위해 Math.floor 사용
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}.${milliseconds}`;
};
export const millisToSeconds = (millis: number): number => {
    const seconds: number = millis / 1000;
    return seconds;
};
