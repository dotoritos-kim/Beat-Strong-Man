class AudioProcessor extends AudioWorkletProcessor {
    constructor() {
        super();

        // 여러 음원을 동시에 재생하기 위한 자료구조
        this.tracks = new Map();

        // 마스터 볼륨
        this.masterVolume = 0.8;

        // 필터 관련
        this.highpassCutoff = 20; // Hz
        this.alphaHP = this.computeAlpha(this.highpassCutoff);
        this.hpLeft = 0.0;
        this.hpRight = 0.0;

        this.lowpassCutoff = 18000; // Hz
        this.alphaLP = this.computeAlpha(this.lowpassCutoff);
        this.lpLeft = 0.0;
        this.lpRight = 0.0;

        // 디버그용 카운터
        this.processCounter = 0;

        // 메시지 수신
        this.port.onmessage = (e) => {
            const { type, key, data, loop, volume, hpCutoff, lpCutoff, userStartTimeSec } = e.data;
            switch (type) {
                case 'play':
                    this.tracks.set(key, {
                        data,
                        readIndex: 0,
                        isPlaying: true,
                        loop: !!loop,
                        userStartTimeSec,
                        hasReportedLatency: false,
                    });
                    break;
                case 'stop':
                    if (this.tracks.has(key)) {
                        this.tracks.get(key).isPlaying = false;
                    }
                    break;
                case 'clear':
                    this.tracks.delete(key);
                    break;
                case 'setMasterVolume':
                    this.masterVolume = typeof volume === 'number' ? volume : 1.0;
                    break;
                case 'setHP':
                    this.highpassCutoff = hpCutoff;
                    this.alphaHP = this.computeAlpha(this.highpassCutoff);
                    break;
                case 'setLP':
                    this.lowpassCutoff = lpCutoff;
                    this.alphaLP = this.computeAlpha(this.lowpassCutoff);
                    break;
                // 그 외는 생략
            }
        };
    }

    computeAlpha(fc) {
        const fs = sampleRate; // AudioWorkletProcessor 내장 sampleRate
        const dt = 1 / fs;
        const RC = 1.0 / (2 * Math.PI * fc);
        return dt / (RC + dt);
    }

    process(inputs, outputs) {
        const output = outputs[0];
        if (!output) return true;

        const left = output[0];
        const right = output[1] || left;
        const blockSize = left.length;

        // 1) 출력을 0으로 초기화
        for (let i = 0; i < blockSize; i++) {
            left[i] = 0;
            right[i] = 0;
        }

        // 2) 모든 트랙 합산
        for (const [trackKey, track] of this.tracks.entries()) {
            if (!track.isPlaying) continue;
            let firstSampleIndex = track.readIndex;
            for (let i = 0; i < blockSize; i++) {
                if (track.readIndex < track.data.length) {
                    const sample = track.data[track.readIndex++];
                    left[i] += sample;
                    right[i] += sample;
                } else {
                    if (track.loop) {
                        track.readIndex = 0;
                    } else {
                        track.isPlaying = false;
                        break;
                    }
                }
            }
            if (firstSampleIndex === 0 && !track.hasReportedLatency) {
                this.port.postMessage({
                    key: trackKey,
                    type: 'latencyReport',
                    approxLatency: track.userStartTimeSec,
                });
                track.hasReportedLatency = true;
            }
        }

        // 3) 마스터 볼륨
        for (let i = 0; i < blockSize; i++) {
            left[i] *= this.masterVolume;
            right[i] *= this.masterVolume;
        }

        // 4) 하이패스 (저역 깎기)
        for (let i = 0; i < blockSize; i++) {
            const oldHP_L = this.hpLeft + this.alphaHP * (left[i] - this.hpLeft);
            const hpOutL = left[i] - oldHP_L;
            this.hpLeft = oldHP_L;

            const oldHP_R = this.hpRight + this.alphaHP * (right[i] - this.hpRight);
            const hpOutR = right[i] - oldHP_R;
            this.hpRight = oldHP_R;

            left[i] = hpOutL;
            right[i] = hpOutR;
        }

        // 5) 로우패스 (고역 깎기)
        for (let i = 0; i < blockSize; i++) {
            const filteredL = this.lpLeft + this.alphaLP * (left[i] - this.lpLeft);
            this.lpLeft = filteredL;
            left[i] = filteredL;

            const filteredR = this.lpRight + this.alphaLP * (right[i] - this.lpRight);
            this.lpRight = filteredR;
            right[i] = filteredR;
        }

        return true;
    }
}

registerProcessor('audio-worklet-processor', AudioProcessor);
