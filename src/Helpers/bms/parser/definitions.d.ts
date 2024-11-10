declare module 'data-structure' {
    export interface Façade<T> {
        (value: T, ...bogus: any[]): T;
    }
    const DataStructure: {
        <T>(spec: any): Façade<T>;
        maybe<T>(spec: any): any;
    };
    export = DataStructure;
}
