import { AudioProcessorPostMessage, DriveSettings, DynamicsSettings, EffectsSettings, EQBand, ModulationSettings, Track } from './types';

// Add initial settings interfaces with existing types
interface InitialSettings {
    eq: EQBand[];
    modulation: ModulationSettings;
    effects: EffectsSettings;
    drive: DriveSettings;
    dynamics: DynamicsSettings;
}

class AudioProcessor extends AudioWorkletProcessor {
    private tracks: Map<string, Track>;
    private masterVolume: number;
    private eqSettings: Map<string, EQBand[]>;
    private modulationSettings: Map<string, ModulationSettings>;
    private effectsSettings: Map<string, EffectsSettings>;
    private driveSettings: Map<string, DriveSettings>;
    private dynamicsSettings: Map<string, DynamicsSettings>;

    // Define initial settings based on given interfaces
    private readonly initialSettings: InitialSettings = {
        eq: [
            { frequency: 60, gain: 0 },
            { frequency: 170, gain: 0 },
            { frequency: 310, gain: 0 },
            { frequency: 600, gain: 0 },
            { frequency: 1000, gain: 0 },
            { frequency: 3000, gain: 0 },
            { frequency: 6000, gain: 0 },
            { frequency: 12000, gain: 0 },
        ],
        modulation: {
            type: 'chorus',
            depth: 0,
            rate: 0,
        },
        effects: {
            delay: 0,
            reverb: 0,
            echo: 0,
            loop: false,
        },
        drive: {
            distortion: 0,
            overdrive: 0,
            fuzz: 0,
        },
        dynamics: {
            threshold: -24,
            ratio: 4,
        },
    };

    constructor() {
        super();

        this.tracks = new Map();
        this.eqSettings = new Map();
        this.modulationSettings = new Map();
        this.effectsSettings = new Map();
        this.driveSettings = new Map();
        this.dynamicsSettings = new Map();
        this.masterVolume = 0.5;

        this.port.onmessage = (e: MessageEvent<AudioProcessorPostMessage>) => {
            const { type, key, data } = e.data;
            switch (type) {
                case 'play':
                    if (data && 'buffer' in data) {
                        const buffer = new Float32Array(data.buffer);
                        this.tracks.set(key, {
                            data: buffer,
                            readIndex: 0,
                            isPlaying: true,
                            loop: data.loop || false,
                        });
                        // Initialize settings for new track with defaults
                        this.eqSettings.set(key, [...this.initialSettings.eq]);
                        this.modulationSettings.set(key, { ...this.initialSettings.modulation });
                        this.effectsSettings.set(key, { ...this.initialSettings.effects });
                        this.driveSettings.set(key, { ...this.initialSettings.drive });
                        this.dynamicsSettings.set(key, { ...this.initialSettings.dynamics });
                    }
                    break;
                case 'stop':
                    if (this.tracks.has(key)) {
                        this.tracks.get(key)!.isPlaying = false;
                    }
                    break;
                case 'clear':
                    this.tracks.delete(key);
                    this.eqSettings.delete(key);
                    this.modulationSettings.delete(key);
                    this.effectsSettings.delete(key);
                    this.driveSettings.delete(key);
                    this.dynamicsSettings.delete(key);
                    break;
                case 'adjustEQ':
                    if (Array.isArray(data)) {
                        this.eqSettings.set(key, data as EQBand[]);
                    }
                    break;
                case 'adjustModulation':
                    this.modulationSettings.set(key, data as ModulationSettings);
                    break;
                case 'adjustEffects':
                    this.effectsSettings.set(key, data as EffectsSettings);
                    break;
                case 'adjustDrive':
                    this.driveSettings.set(key, data as DriveSettings);
                    break;
                case 'adjustDynamics':
                    this.dynamicsSettings.set(key, data as DynamicsSettings);
                    break;
            }
        };
    }

    process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
        const output = outputs[0];
        if (!output) return true;

        const left = output[0];
        const right = output[1] || left;
        const blockSize = left.length;

        for (let i = 0; i < blockSize; i++) {
            left[i] = 0;
            right[i] = 0;
        }

        for (const [trackKey, track] of this.tracks.entries()) {
            if (!track.isPlaying) continue;

            const input = new Float32Array(blockSize);
            for (let i = 0; i < blockSize; i++) {
                if (track.readIndex >= track.data.length) {
                    if (track.loop) {
                        track.readIndex = 0;
                    } else {
                        track.isPlaying = false;
                        break;
                    }
                }
                input[i] = track.data[track.readIndex++];
            }

            let processedInput = input.slice();

            const eqBands = this.eqSettings.get(trackKey) || this.initialSettings.eq;
            const modulation = this.modulationSettings.get(trackKey) || this.initialSettings.modulation;
            const effects = this.effectsSettings.get(trackKey) || this.initialSettings.effects;
            const drive = this.driveSettings.get(trackKey) || this.initialSettings.drive;
            const dynamics = this.dynamicsSettings.get(trackKey) || this.initialSettings.dynamics;

            // Apply effects only if values are set and non-zero
            processedInput = this.applyEQ(processedInput, eqBands);
            if (modulation.depth !== 0 || modulation.rate !== 0) {
                processedInput = this.applyModulation(processedInput, modulation);
            }
            if (effects.delay || effects.reverb || effects.echo) {
                processedInput = this.applyEffects(processedInput, effects);
            }
            if (drive.distortion || drive.overdrive || drive.fuzz) {
                processedInput = this.applyDrive(processedInput, drive);
            }
            if (dynamics.threshold !== 0 || dynamics.ratio !== 1) {
                processedInput = this.applyDynamics(processedInput, dynamics);
            }

            for (let i = 0; i < blockSize; i++) {
                left[i] += processedInput[i];
                right[i] += processedInput[i];
            }
        }

        for (let i = 0; i < blockSize; i++) {
            left[i] *= this.masterVolume;
            right[i] *= this.masterVolume;
        }

        return true;
    }

    private applyEQ(input: Float32Array<ArrayBuffer>, eqBands: EQBand[]): Float32Array<ArrayBuffer> {
        const output = input.slice();
        eqBands.forEach((band) => {
            if (band.gain !== 0) {
                const alpha = this.computeAlpha(band.frequency);
                let state = 0;
                for (let i = 0; i < input.length; i++) {
                    state += alpha * (input[i] - state);
                    output[i] += state * 10 ** (band.gain / 20);
                }
            }
        });
        return output;
    }

    private applyModulation(input: Float32Array<ArrayBuffer>, modulation: ModulationSettings): Float32Array<ArrayBuffer> {
        const output = input.slice();
        const fs = sampleRate;
        for (let i = 0; i < input.length; i++) {
            const phase = 2 * Math.PI * modulation.rate * (i / fs);
            let modFactor = 1;
            switch (modulation.type) {
                case 'chorus':
                case 'vibrato':
                    modFactor = Math.sin(phase) * modulation.depth;
                    break;
                case 'flanger':
                    modFactor = Math.cos(phase) * modulation.depth;
                    break;
                case 'tremolo':
                    modFactor = 0.5 * (1 + Math.sin(phase));
                    break;
            }
            output[i] *= modFactor;
        }
        return output;
    }

    private applyEffects(input: Float32Array<ArrayBuffer>, effects: EffectsSettings): Float32Array<ArrayBuffer> {
        const output = input.slice();
        for (let i = 0; i < input.length; i++) {
            if (effects.delay) {
                const delayedSample = i >= effects.delay ? input[i - effects.delay] : 0;
                output[i] += delayedSample;
            }
            if (effects.echo) {
                const echoSample = i >= effects.echo ? input[i - effects.echo] * 0.5 : 0;
                output[i] += echoSample;
            }
            if (effects.reverb) {
                output[i] += effects.reverb * Math.random();
            }
        }
        return output;
    }

    private applyDrive(input: Float32Array<ArrayBuffer>, drive: DriveSettings): Float32Array<ArrayBuffer> {
        const output = input.slice();
        for (let i = 0; i < input.length; i++) {
            let sample = input[i];
            if (drive.distortion) {
                sample = Math.tanh(drive.distortion * sample);
            }
            if (drive.overdrive) {
                sample = Math.sign(sample) * (1 - Math.exp(-Math.abs(drive.overdrive * sample)));
            }
            if (drive.fuzz) {
                sample = Math.sin(drive.fuzz * sample);
            }
            output[i] = sample;
        }
        return output;
    }

    private applyDynamics(input: Float32Array<ArrayBuffer>, dynamics: DynamicsSettings): Float32Array<ArrayBuffer> {
        const output = input.slice();
        let envelope = 0;
        const attack = 0.003; // 3ms attack time
        const release = 0.25; // 250ms release time

        for (let i = 0; i < input.length; i++) {
            const inputLevel = Math.abs(input[i]);

            // Envelope follower
            if (inputLevel > envelope) {
                envelope += attack * (inputLevel - envelope);
            } else {
                envelope += release * (inputLevel - envelope);
            }

            // Convert threshold from dB to linear
            const threshold = 10 ** (dynamics.threshold / 20);

            // Compute gain reduction
            let gainReduction = 1;
            if (envelope > threshold) {
                const dbAboveThreshold = 20 * Math.log10(envelope / threshold);
                const dbReduction = dbAboveThreshold * (1 - 1 / dynamics.ratio);
                gainReduction = 10 ** (-dbReduction / 20);
            }

            output[i] = input[i] * gainReduction;
        }

        return output;
    }

    private computeAlpha(fc: number): number {
        const fs = sampleRate;
        const dt = 1 / fs;
        const RC = 1.0 / (2 * Math.PI * fc);
        return dt / (RC + dt);
    }
}

registerProcessor('audio-worklet-processor', AudioProcessor);
export default '';
