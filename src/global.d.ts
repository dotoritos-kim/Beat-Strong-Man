declare module '*.jpg';
declare module '*.png';
declare module '*.jpeg';
declare module '*.gif';
declare module '*.svg';
declare module '*.mp3';
declare module '*.mp4';
declare module '*.ttf';
declare module '*.woff';
declare module '*.woff2';
declare module '*.glb';
declare module 'bare-hrtime';
declare const sampleRate: number;
declare class AudioWorkletProcessor {
    readonly port: MessagePort;
    constructor();
    process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>): boolean;
}
declare function registerProcessor(name: string, processorCtor: typeof AudioWorkletProcessor): void;
declare module '*.worklet' {
    const exportString: string;
    export default exportString;
}
declare module '*.worklet.ts' {
    const url: string;
    export default url;
}
