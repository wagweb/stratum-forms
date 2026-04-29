import { useCallback, useMemo } from "react";
import { selectFieldConfig, selectIsTouched, selectValue } from "../../core/formSelectors";
import type { FieldConfig, ValidationResult } from "../../core/types";
import { shallowEqual } from "../../core/formUtils";
import { VALID } from "../../core/formValidators";
import { useFormSelector } from "./useFormSelector";
import { useFormStore } from "./useFormStore";

// use form field
// one subscription per field; validate only when touched && !form loading (hook layer)
export function useFormField<ValueType = unknown>(formKey: string, fieldKey: string): UseFormFieldReturn<ValueType> {
    // store
    const store = useFormStore();

    // field state
    const fieldState = useFormSelector((state) => {
        const form = state.forms[formKey];
        const config = selectFieldConfig<ValueType>(state, formKey, fieldKey);
        const value = selectValue<ValueType>(state, formKey, fieldKey);
        const isTouched = selectIsTouched(state, formKey, fieldKey);
        const formIsLoading = form?.isLoading ?? false;
        const formIsLocked = form?.isLocked ?? false;
        const validation: ValidationResult | undefined =
            config.validate && isTouched && !formIsLoading ? config.validate(value) : undefined;
        return {
            value,
            config,
            isTouched,
            validation,
            formIsLoading,
            formIsLocked,
        };
    }, shallowEqual);

    // set value
    const setValue = useCallback(
        (next: ValueType | undefined) => store.setValueLocal(formKey, fieldKey, next),
        [store, formKey, fieldKey],
    );

    // set touched
    const setTouched = useCallback(
        (touched = true) => store.setTouched(formKey, fieldKey, touched),
        [store, formKey, fieldKey],
    );

    // return field
    const result = useMemo<UseFormFieldReturn<ValueType>>(
        () => ({
            value: fieldState.value,
            setValue,
            setTouched,
            isTouched: fieldState.isTouched,
            validation: fieldState.validation ?? VALID,
            isInvalid: fieldState.validation ? !fieldState.validation.isValid : false,
            errorMessage:
                fieldState.validation && !fieldState.validation.isValid ? fieldState.validation.message : undefined,
            isReadOnly: Boolean(fieldState.config.isReadOnly) || fieldState.formIsLocked,
            isDisabled: Boolean(fieldState.config.isDisabled),
            isLoading: fieldState.formIsLoading,
            label: fieldState.config.label,
            placeholder: fieldState.config.placeholder,
            description: fieldState.config.description,
            config: fieldState.config,
        }),
        [fieldState, setValue, setTouched],
    );

    // return field
    return result;
}

// use form field return
export type UseFormFieldReturn<ValueType> = {
    setValue: (next: ValueType | undefined) => void;
    setTouched: (touched?: boolean) => void;
    value: ValueType | undefined;
    isTouched: boolean;
    validation: ValidationResult;
    isInvalid: boolean;
    errorMessage: string | undefined;
    isReadOnly: boolean;
    isDisabled: boolean;
    isLoading: boolean;
    label: string | undefined;
    placeholder: string | undefined;
    description: string | undefined;
    config: FieldConfig<ValueType>;
};
