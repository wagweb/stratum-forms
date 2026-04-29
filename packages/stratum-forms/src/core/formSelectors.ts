import type { FieldConfig, FormState, FormsState, ValidationResult } from "./types";
import { VALID } from "./formValidators";

// empty form
const EMPTY_FORM: FormState = Object.freeze({
    fieldConfigs: {},
    valuesLocal: {},
    valuesRemote: {},
    touchedFields: {},
    customData: {},
    isLoading: false,
    isSaving: false,
    isDeleted: false,
    isLocked: false,
}) as FormState;

// select form
export function selectForm(state: FormsState, formKey: string): FormState {
    return state.forms[formKey] ?? EMPTY_FORM;
}

// select field config
export function selectFieldConfig<ValueType = unknown>(
    state: FormsState,
    formKey: string,
    fieldKey: string,
): FieldConfig<ValueType> {
    return (selectForm(state, formKey).fieldConfigs[fieldKey] as FieldConfig<ValueType> | undefined) ?? {};
}

// select value local
export function selectValueLocal<ValueType = unknown>(
    state: FormsState,
    formKey: string,
    fieldKey: string,
): ValueType | undefined {
    return selectForm(state, formKey).valuesLocal[fieldKey] as ValueType | undefined;
}

// select value remote
export function selectValueRemote<ValueType = unknown>(
    state: FormsState,
    formKey: string,
    fieldKey: string,
): ValueType | undefined {
    return selectForm(state, formKey).valuesRemote[fieldKey] as ValueType | undefined;
}

// select value default
export function selectValueDefault<ValueType = unknown>(
    state: FormsState,
    formKey: string,
    fieldKey: string,
): ValueType | undefined {
    return selectFieldConfig<ValueType>(state, formKey, fieldKey).defaultValue;
}

// select value
// display value: local ?? remote ?? default
export function selectValue<ValueType = unknown>(state: FormsState, formKey: string, fieldKey: string): ValueType | undefined {
    const local = selectValueLocal<ValueType>(state, formKey, fieldKey);
    if (local !== undefined) return local;
    const remote = selectValueRemote<ValueType>(state, formKey, fieldKey);
    if (remote !== undefined) return remote;
    return selectValueDefault<ValueType>(state, formKey, fieldKey);
}

// select value transformed
// used when building getChanges / getSnapshot payloads
export function selectValueTransformed(state: FormsState, formKey: string, fieldKey: string): unknown {
    const value = selectValue(state, formKey, fieldKey);
    const transform = selectFieldConfig(state, formKey, fieldKey).transform;
    return transform ? transform(value) : value;
}

// select is touched
export function selectIsTouched(state: FormsState, formKey: string, fieldKey: string): boolean {
    return Boolean(selectForm(state, formKey).touchedFields[fieldKey]);
}

// select field validation
export function selectFieldValidation(state: FormsState, formKey: string, fieldKey: string): ValidationResult {
    const fieldConfig = selectFieldConfig(state, formKey, fieldKey);
    if (!fieldConfig.validate) return VALID;
    return fieldConfig.validate(selectValue(state, formKey, fieldKey));
}

// select form is valid
// isDeleted short-circuits to true (skip per-field checks)
export function selectFormIsValid(state: FormsState, formKey: string): boolean {
    const form = selectForm(state, formKey);
    if (form.isDeleted) return true;
    for (const fieldKey of Object.keys(form.fieldConfigs)) {
        if (!selectFieldValidation(state, formKey, fieldKey).isValid) return false;
    }
    return true;
}

// select all forms valid
export function selectAllFormsValid(state: FormsState): boolean {
    for (const formKey of Object.keys(state.forms)) {
        if (!selectFormIsValid(state, formKey)) return false;
    }
    return true;
}

// select field is changed
// "changed" = local differs from baseline (remote if set, else default)
export function selectFieldIsChanged(state: FormsState, formKey: string, fieldKey: string): boolean {
    const local = selectValueLocal(state, formKey, fieldKey);
    if (local === undefined) return false;
    const remote = selectValueRemote(state, formKey, fieldKey);
    if (remote !== undefined) return !Object.is(local, remote);
    const def = selectValueDefault(state, formKey, fieldKey);
    return !Object.is(local, def);
}

// select form changed fields
export function selectFormChangedFields(state: FormsState, formKey: string): string[] {
    const form = selectForm(state, formKey);
    return Object.keys(form.fieldConfigs).filter((fieldKey) => selectFieldIsChanged(state, formKey, fieldKey));
}

// select form is dirty
export function selectFormIsDirty(state: FormsState, formKey: string): boolean {
    return selectFormChangedFields(state, formKey).length > 0;
}

// select any form dirty
export function selectAnyFormDirty(state: FormsState): boolean {
    for (const formKey of Object.keys(state.forms)) {
        if (selectFormIsDirty(state, formKey)) return true;
    }
    return false;
}

// select any form saving
export function selectAnyFormSaving(state: FormsState): boolean {
    for (const formKey of Object.keys(state.forms)) {
        if (state.forms[formKey].isSaving) return true;
    }
    return false;
}

// select any form loading
export function selectAnyFormLoading(state: FormsState): boolean {
    for (const formKey of Object.keys(state.forms)) {
        if (state.forms[formKey].isLoading) return true;
    }
    return false;
}

// select form changes
// patch-style payload: changed fields only, transforms applied, skips isNotSubmitted
export function selectFormChanges(state: FormsState, formKey: string): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const fieldKey of selectFormChangedFields(state, formKey)) {
        const fieldConfig = selectFieldConfig(state, formKey, fieldKey);
        if (fieldConfig.isNotSubmitted) continue;
        result[fieldKey] = selectValueTransformed(state, formKey, fieldKey);
    }
    return result;
}

// select form snapshot
// post-style snapshot: all defined fields, transforms applied
export function selectFormSnapshot(state: FormsState, formKey: string): Record<string, unknown> {
    const form = selectForm(state, formKey);
    const result: Record<string, unknown> = {};
    for (const fieldKey of Object.keys(form.fieldConfigs)) {
        const fieldConfig = form.fieldConfigs[fieldKey];
        if (fieldConfig.isNotSubmitted) continue;
        const value = selectValueTransformed(state, formKey, fieldKey);
        if (value === undefined) continue;
        result[fieldKey] = value;
    }
    return result;
}
