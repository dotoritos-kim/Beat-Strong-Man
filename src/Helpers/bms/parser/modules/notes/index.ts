import { Note, BMSNote } from './note';
import { invariant } from '@epic-web/invariant';
import * as ChannelMapping from './channels';
import { BMSChart } from '../../bms/chart';
import { BMSObject } from '../../bms/objects';

export type { BMSNote };

/**
 * Notes는 게임 내 Note 객체들을 보유합니다.
 * Note 객체는 플레이 가능할 수도, 불가능할 수도 있습니다.
 *
 * 이를 Compiler를 사용해 BMSChart로 파싱한 후,
 * `fromBMSChart()`를 사용하여 Notes를 생성할 수 있습니다:
 *
 * 그런 다음 `.all()` 메서드를 사용하여 모든 노트를 얻을 수 있습니다.
 *
 */
export class Notes {
    _notes: BMSNote[];
    static CHANNEL_MAPPING = ChannelMapping;

    /**
     * @param {BMSNote[]} notes Note 객체들의 배열
     */
    constructor(notes: BMSNote[]) {
        notes.forEach(Note);
        this._notes = notes;
    }

    /**
     * 이 객체 내의 노트 수를 반환합니다.
     * 플레이 가능 및 불가능한 노트 모두를 포함합니다.
     */
    count() {
        return this._notes.length;
    }

    /**
     * 모든 노트의 배열을 반환합니다.
     */
    all() {
        return this._notes.slice();
    }

    /**
     * BMSChart에서 Notes 객체를 생성합니다.
     * @param chart 처리할 차트
     * @param options 옵션
     */
    static fromBMSChart(chart: BMSChart, options?: BMSChartOptions) {
        void BMSChart;
        options = options || {};
        const mapping = options.mapping || Notes.CHANNEL_MAPPING.IIDX_P1;
        const builder = new BMSNoteBuilder(chart, { mapping: mapping });
        return builder.build();
    }
}

class BMSNoteBuilder {
    _chart: BMSChart;
    _mapping: { [channel: string]: string };
    _notes: BMSNote[];
    _activeLN: { [channel: string]: BMSNote };
    _lastNote: { [channel: string]: BMSNote };
    _lnObj: string;
    _channelMapping: { [channel: string]: string };
    _objects: BMSObject[];
    constructor(chart: BMSChart, options: { mapping: BMSChannelNoteMapping }) {
        this._chart = chart;
        invariant(options.mapping, 'Expected options.mapping');
        invariant(typeof options.mapping === 'object', 'options.mapping must be object');
        this._mapping = options.mapping;
        this._notes = [];
        this._activeLN = {};
        this._lastNote = {};
        this._lnObj = (this._chart.headers.get('lnobj') || '').toLowerCase();
        this._channelMapping = this._mapping;
        this._objects = this._chart.objects.allSorted();
    }

    build() {
        this._objects.forEach((object) => {
            this._handle(object);
        });
        return new Notes(this._notes);
    }

    _handle(object: BMSObject) {
        if (object.channel === '01') {
            this._handleNormalNote(object);
        } else {
            switch (object.channel.charAt(0).toUpperCase()) {
                case '1':
                case '2':
                case 'D':
                case 'E':
                    this._handleNormalNote(object);
                    break;
                case '5':
                case '6':
                    this._handleLongNote(object);
                    break;
            }
        }
    }

    _handleNormalNote(object: BMSObject) {
        const channel = this._normalizeChannel(object.channel);
        const beat = this._getBeat(object);
        if (object.value.toLowerCase() === this._lnObj) {
            if (this._lastNote[channel]) {
                this._lastNote[channel].endBeat = beat;
            }
        } else {
            const note = {
                beat: beat,
                endBeat: undefined,
                keysound: object.value,
                column: this._getColumn(channel),
            };
            this._lastNote[channel] = note;
            this._notes.push(note);
        }
    }

    _handleLongNote(object: BMSObject) {
        const channel = this._normalizeChannel(object.channel);
        const beat = this._getBeat(object);
        if (this._activeLN[channel]) {
            const note = this._activeLN[channel];
            note.endBeat = beat;
            this._notes.push(note);
            delete this._activeLN[channel];
        } else {
            this._activeLN[channel] = {
                beat: beat,
                keysound: object.value,
                column: this._getColumn(channel),
            };
        }
    }

    _getBeat(object: BMSObject) {
        return this._chart.measureToBeat(object.measure, object.fraction);
    }

    _getColumn(channel: string) {
        return this._channelMapping[channel];
    }

    _normalizeChannel(channel: string) {
        return channel.replace(/^5/, '1').replace(/^6/, '2');
    }
}

interface BMSChartOptions {
    /**
     * BMS 채널에서 게임 채널로의 매핑.
     * 기본값은 IIDX_P1 매핑입니다.
     */
    mapping?: BMSChannelNoteMapping;
}

type BMSChannelNoteMapping = { [channel: string]: string };
