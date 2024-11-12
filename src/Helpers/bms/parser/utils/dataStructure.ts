type Schema = string | number | Function | Record<string, any>;

export interface Façade<T> {
    (value: T): T;
    validate(value: T): void;
}

function validate(schema: Schema, value: any): void {
    if (schema === Number) schema = 'number';
    if (schema === String) schema = 'string';

    if (typeof schema === 'string') {
        if (typeof value !== schema) {
            throw new Error(`Value should be of type ${schema}`);
        }
    } else if (typeof schema === 'function') {
        if (typeof (schema as any).validate === 'function') {
            (schema as any).validate(value);
        } else if (!(value instanceof schema)) {
            throw new Error(`Value should be an instance of ${schema.name}`);
        }
    } else if (typeof schema === 'object') {
        if (!value) throw new Error('Value should be an object');
        validateObject(schema, value);
    } else {
        throw new Error('Invalid schema');
    }
}

function validateObject(schema: Record<string, any>, object: Record<string, any>): void {
    for (const prop in schema) {
        if (!(prop in object)) {
            throw new Error(`Missing property: "${prop}"`);
        }
        try {
            validate(schema[prop], object[prop]);
        } catch (e: any) {
            throw new Error(`Error in property "${prop}": ${e.message}`);
        }
    }
}

function DataStructure<T>(...schemas: Schema[]): Façade<T> {
    const Constructor = function (object: T): T {
        Constructor.validate(object);
        return object;
    } as Façade<T>;

    Constructor.validate = (object: T) => {
        for (const schema of schemas) {
            validate(schema, object);
        }
    };

    return Constructor;
}

DataStructure.maybe = function maybe<T>(schema: Schema): Façade<T | null | undefined> {
    const MaybeValidator = function (object: T | null | undefined): T | null | undefined {
        MaybeValidator.validate(object);
        return object;
    } as Façade<T | null | undefined>;

    MaybeValidator.validate = (value: T | null | undefined) => {
        if (value === null || value === undefined) return;
        validate(schema, value);
    };

    return MaybeValidator;
};

export default DataStructure;
