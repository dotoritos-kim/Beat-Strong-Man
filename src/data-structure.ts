declare module 'data-structure' {
    export interface Façade<T> {
        (value: T, ...bogus: any[]): T;
    }
    export const DataStructure: {
        <T>(spec: any): Façade<T>;
        maybe<T>(spec: any): any;
    };
}
