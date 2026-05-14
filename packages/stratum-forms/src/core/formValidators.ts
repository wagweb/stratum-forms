import type { ValidationFn, ValidationResult } from "./types";

// always-valid singleton
export const VALID: ValidationResult = { isValid: true };

// invalid helper
export function invalid(message?: string): ValidationResult {
    return message === undefined ? { isValid: false } : { isValid: false, message };
}

// combine validators
// runs left to right; first failing result wins
export function combineValidators<ValueType>(
    ...validators: Array<ValidationFn<ValueType> | undefined>
): ValidationFn<ValueType> {
    return (value) => {
        for (const v of validators) {
            if (!v) continue;
            const result = v(value);
            if (!result.isValid) return result;
        }
        return VALID;
    };
}

// required
export function required(message?: string): ValidationFn<unknown> {
    return (value) => {
        if (value === null || value === undefined) return invalid(message);
        if (typeof value === "string" && value.trim() === "") return invalid(message);
        return VALID;
    };
}

// required number
export function requiredNumber(message?: string): ValidationFn<number | null | undefined> {
    return (value) => {
        if (value === null || value === undefined) return invalid(message);
        if (Number.isNaN(value)) return invalid(message);
        return VALID;
    };
}

// min length
export function minLength(min: number, message?: string): ValidationFn<string> {
    return (value) => {
        if (value === undefined || value === null || value === "") return VALID;
        if (value.length < min) return invalid(message);
        return VALID;
    };
}

// max length
export function maxLength(max: number, message?: string): ValidationFn<string> {
    return (value) => {
        if (value === undefined || value === null) return VALID;
        if (value.length > max) return invalid(message);
        return VALID;
    };
}

// pattern
// empty string passes; stack with `required` if empty should fail
export function pattern(regex: RegExp, message?: string): ValidationFn<string> {
    return (value) => {
        if (value === undefined || value === null || value === "") return VALID;
        if (!regex.test(value)) return invalid(message);
        return VALID;
    };
}

// email
// simple regex
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function email(message?: string): ValidationFn<string> {
    return pattern(EMAIL_RE, message);
}

// url
// empty passes; stack with `required` if empty should fail
export function url(message?: string): ValidationFn<string> {
    return (value) => {
        if (value === undefined || value === null || value === "") return VALID;
        const trimmed = value.trim();
        if (trimmed === "") return VALID;
        try {
            new URL(trimmed);
            return VALID;
        } catch {
            return invalid(message);
        }
    };
}

// range
// numeric range (undefined/null/NaN passes — pair with requiredNumber if needed)
export function range(opts: { min?: number; max?: number; message?: string }): ValidationFn<number | null | undefined> {
    return (value) => {
        if (value === undefined || value === null || Number.isNaN(value)) return VALID;
        if (opts.min !== undefined && value < opts.min) return invalid(opts.message);
        if (opts.max !== undefined && value > opts.max) return invalid(opts.message);
        return VALID;
    };
}
// integer
// (undefined/null/NaN passes — pair with requiredNumber if needed)
export function integer(message?: string): ValidationFn<number | null | undefined> {
    return (value) => {
        if (value === undefined || value === null || Number.isNaN(value)) return VALID;
        if (!Number.isInteger(value)) return invalid(message);
        return VALID;
    };
}
