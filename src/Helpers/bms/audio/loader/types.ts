// Interfaces for settings
export interface EQBand {
    frequency: number;
    gain: number;
}

export interface ModulationSettings {
    depth: number;
    rate: number;
    type: string;
}

export interface EffectsSettings {
    delay?: number;
    reverb?: number;
    echo?: number;
    loop?: boolean;
}

export interface DriveSettings {
    distortion?: number;
    overdrive?: number;
    fuzz?: number;
}

export interface DynamicsSettings {
    threshold: number;
    ratio: number;
}

export interface Track {
    data: Float32Array<ArrayBuffer>;
    readIndex: number;
    isPlaying: boolean;
    loop: boolean;
}

export interface AudioProcessorPostMessage {
    type:
        | 'play'
        | 'stop'
        | 'clear'
        | 'adjustEQ'
        | 'adjustModulation'
        | 'adjustSpatial'
        | 'adjustEffects'
        | 'adjustDrive'
        | 'adjustDynamics';
    key: string;
    data?:
        | null // 'stop' | 'clear'
        | EQBand[]
        | { buffer: Float32Array<ArrayBuffer>; loop: boolean }
        | ModulationSettings
        | EffectsSettings
        | DriveSettings
        | DynamicsSettings;
}
