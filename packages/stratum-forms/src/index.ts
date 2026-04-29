// public barrel — import from here only

// core
export { createFormStore } from "./core/createFormStore";
export type {
    FieldConfig,
    FieldConfigMap,
    FormOptions,
    FormState,
    FormStore,
    FormsState,
    TransformFn,
    ValidationFn,
    ValidationResult,
} from "./core/types";

// pure selectors (usable outside react)
export {
    selectAllFormsValid,
    selectAnyFormDirty,
    selectAnyFormLoading,
    selectAnyFormSaving,
    selectFieldConfig,
    selectFieldIsChanged,
    selectFieldValidation,
    selectForm,
    selectFormChangedFields,
    selectFormChanges,
    selectFormIsDirty,
    selectFormIsValid,
    selectFormSnapshot,
    selectIsTouched,
    selectValue,
    selectValueDefault,
    selectValueLocal,
    selectValueRemote,
    selectValueTransformed,
} from "./core/formSelectors";

// validators
export {
    VALID,
    combineValidators,
    email,
    integer,
    invalid,
    maxLength,
    minLength,
    pattern,
    range,
    required,
    requiredNumber,
    url,
} from "./core/formValidators";

// react
export { FormStoreProvider } from "./react/FormStoreProvider";
export type { FormStoreProviderProps } from "./react/FormStoreProvider";
export { FormStoreContext } from "./react/context";

// hooks
export { useFormDirtyBlocker } from "./react/hooks/useFormDirtyBlocker";
export { useForm } from "./react/hooks/useForm";
export { useFormFieldConfigSync } from "./react/hooks/useFormFieldConfigSync";
export { useFormField } from "./react/hooks/useFormField";
export type { UseFormFieldReturn } from "./react/hooks/useFormField";
export { useFormFieldValue } from "./react/hooks/useFormFieldValue";
export { useFormLoadingSync, useFormLockSync, useFormRemoteSync } from "./react/hooks/useFormRemoteSync";
export { useFormSelector } from "./react/hooks/useFormSelector";
export { useForms } from "./react/hooks/useForms";
export { useFormStore } from "./react/hooks/useFormStore";

// utils
export { shallowEqual } from "./core/formUtils";
