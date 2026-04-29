// vanilla store (same shape as useSyncExternalStore expects)
export type FormStore = {
    getState: () => FormsState;
    subscribe: (listener: () => void) => () => void;
    setState: (mutator: (state: FormsState) => FormsState) => void;
    ensureForm: (formKey: string) => void;
    removeForm: (formKey: string) => void;
    setFieldConfigs: (formKey: string, configs: FieldConfigMap) => void;
    patchFieldConfigs: (formKey: string, configs: FieldConfigMap) => void;
    setValueLocal: (formKey: string, fieldKey: string, value: unknown) => void;
    syncValueLocal: (formKey: string, fieldKey: string, value: unknown) => void;
    setValuesRemote: (formKey: string, values: Record<string, unknown>) => void;
    patchValuesRemote: (formKey: string, values: Record<string, unknown>) => void;
    clearValuesLocal: (formKey: string) => void;
    setTouched: (formKey: string, fieldKey: string, touched: boolean) => void;
    setAllTouched: (formKey: string, touched: boolean) => void;
    setAllFormsTouched: (touched: boolean) => void;
    setIsLoading: (formKey: string, value: boolean) => void;
    setIsSaving: (formKey: string, value: boolean) => void;
    setIsDeleted: (formKey: string, value: boolean) => void;
    setIsLocked: (formKey: string, value: boolean) => void;
    setCustomData: (formKey: string, key: string, value: unknown) => void;
    clear: () => void;
};

// validation result
export type ValidationResult = {
    isValid: boolean;
    message?: string;
};

// validation function
export type ValidationFn<ValueType> = (value: ValueType | undefined) => ValidationResult;

// transform function
export type TransformFn<ValueType> = (value: ValueType | undefined) => unknown;

// field config
export type FieldConfig<ValueType = unknown> = {
    defaultValue?: ValueType;
    label?: string;
    placeholder?: string;
    description?: string;
    isReadOnly?: boolean;
    isDisabled?: boolean;
    isNotSubmitted?: boolean;
    transform?: TransformFn<ValueType>;
    validate?: ValidationFn<ValueType>;
    meta?: Record<string, unknown>;
};

// field config map
export type FieldConfigMap = Record<string, FieldConfig<any>>;

// one form bucket under a formKey
// values split: local (edits), remote (server), defaults live on fieldConfigs — unified via selectValue
export type FormState = {
    fieldConfigs: FieldConfigMap;
    valuesLocal: Record<string, unknown>;
    valuesRemote: Record<string, unknown>;
    touchedFields: Record<string, true>;
    customData: Record<string, unknown>;
    isLoading: boolean;
    isSaving: boolean;
    isDeleted: boolean;
    isLocked: boolean;
};

// forms state
export type FormsState = {
    forms: Record<string, FormState>;
};

// form options
export type FormOptions = {
    autoCleanup?: boolean;
};
