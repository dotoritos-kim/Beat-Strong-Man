// BMS 노트차트를 나타내는 문자열을 받아 파싱하고 BMSChart로 컴파일하는 모듈입니다.
/* module */
import { match } from '../../utils/match';
import { BMSChart } from '../../bms/chart';
import { BMSObject } from '../../bms/objects';

const matchers = {
    bms: {
        random: /^#RANDOM\s+(\d+)$/i,
        if: /^#IF\s+(\d+)$/i,
        endif: /^#ENDIF$/i,
        timeSignature: /^#(\d\d\d)02:(\S*)$/,
        channel: /^#(?:EXT\s+#)?(\d\d\d)(\S\S):(\S*)$/,
        header: /^#(\w+)(?:\s+(\S.*))?$/,
    },
    dtx: {
        random: /^#RANDOM\s+(\d+)$/i,
        if: /^#IF\s+(\d+)$/i,
        endif: /^#ENDIF$/i,
        timeSignature: /^#(\d\d\d)02:\s*(\S*)$/,
        channel: /^#(?:EXT\s+#)?(\d\d\d)(\S\S):\s*(\S*)$/,
        header: /^#(\w+):(?:\s+(\S.*))?$/,
    },
};

/**
 * BMS 노트차트를 나타내는 문자열을 읽고, 파싱하여 {BMSChart}로 컴파일합니다.
 * @param text BMS 노트차트
 * @param options 추가 파서 옵션
 */
export function compile(text: string, options?: Partial<BMSCompileOptions>) {
    options = options || {};

    const chart = new BMSChart();

    const rng =
        options.rng ||
        function (max) {
            return 1 + Math.floor(Math.random() * max);
        };

    const matcher = (options.format && matchers[options.format]) || matchers.bms;

    const randomStack: number[] = [];
    const skipStack = [false];

    const result = {
        headerSentences: 0,
        channelSentences: 0,
        controlSentences: 0,
        skippedSentences: 0,
        malformedSentences: 0,

        /**
         * 생성된 차트
         */
        chart: chart,

        /**
         * 컴파일 중 발견된 경고
         */
        warnings: [] as { lineNumber: number; message: string }[],
    };

    eachLine(text, function (text, lineNumber) {
        let flow = true;
        if (text.charAt(0) !== '#') return;
        match(text)
            .when(matcher.random, function (m) {
                result.controlSentences += 1;
                randomStack.push(rng(+m[1]));
            })
            .when(matcher.if, function (m) {
                result.controlSentences += 1;
                skipStack.push(randomStack[randomStack.length - 1] !== +m[1]);
            })
            .when(matcher.endif, function (m) {
                result.controlSentences += 1;
                skipStack.pop();
            })
            .else(function () {
                flow = false;
            });
        if (flow) return;
        const skipped = skipStack[skipStack.length - 1];
        match(text)
            .when(matcher.timeSignature, function (m) {
                result.channelSentences += 1;
                if (!skipped) chart.timeSignatures.set(+m[1], +m[2]);
            })
            .when(matcher.channel, function (m) {
                result.channelSentences += 1;
                if (!skipped) handleChannelSentence(+m[1], m[2], m[3], lineNumber);
            })
            .when(matcher.header, function (m) {
                result.headerSentences += 1;
                if (!skipped) chart.headers.set(m[1], m[2]);
            })
            .else(function () {
                warn(lineNumber, '잘못된 명령');
            });
    });

    return result;

    function handleChannelSentence(measure: number, channel: string, string: string, lineNumber: number) {
        const items = Math.floor(string.length / 2);
        if (items === 0) return;
        for (let i = 0; i < items; i++) {
            const value = string.substr(i * 2, 2);
            const fraction = i / items;
            if (value === '00') continue;
            chart.objects.add({
                measure: measure,
                fraction: fraction,
                value: value,
                channel: channel,
                lineNumber: lineNumber,
            } as BMSObject);
        }
    }

    function warn(lineNumber: number, message: string) {
        result.warnings.push({
            lineNumber: lineNumber,
            message: message,
        });
    }
}

function eachLine(text: string, callback: (line: string, index: number) => void) {
    text.split(/\r\n|\r|\n/)
        .map(function (line) {
            return line.trim();
        })
        .forEach(function (line, index) {
            callback(line, index + 1);
        });
}

export interface BMSCompileOptions {
    /** 파일 형식 */
    format: 'bms' | 'dtx';

    /** 난수 생성 함수.
     *  `#RANDOM n` 명령을 처리할 때 사용됩니다.
     *  이 함수는 1에서 `n` 사이의 정수를 반환해야 합니다.
     */
    rng: (max: number) => number;
}
