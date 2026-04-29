import type { FieldConfigMap, FormState, FormStore, FormsState } from "./types";
import { recordEqual } from "./formUtils";

// empty form template
// used when a formKey has no row yet so selectors always see a full object
function createForm(): FormState {
    return {
        fieldConfigs: {},
        valuesLocal: {},
        valuesRemote: {},
        touchedFields: {},
        customData: {},
        isLoading: false,
        isSaving: false,
        isDeleted: false,
        isLocked: false,
    };
}

// create form store
// no external deps; notify listeners on every commit (hooks narrow with selectors + equality)
export function createFormStore(initialState?: Partial<FormsState>): FormStore {
    let state: FormsState = { forms: {}, ...initialState };
    const listeners = new Set<() => void>();

    function notifyListeners() {
        for (const listener of listeners) listener();
    }

    const subscribe = (listener: () => void) => {
        listeners.add(listener);
        return () => {
            listeners.delete(listener);
        };
    };

    const getState = () => state;

    const setState: FormStore["setState"] = (mutator) => {
        const next = mutator(state);
        if (next === state) return;
        state = next;
        notifyListeners();
    };

    // update one form immutably
    // only that form's object is replaced so other formKeys keep the same refs
    function updateForm(formKey: string, mutator: (form: FormState) => FormState) {
        setState((prev) => {
            const current = prev.forms[formKey] ?? createForm();
            const next = mutator(current);
            if (next === current) return prev;
            return { ...prev, forms: { ...prev.forms, [formKey]: next } };
        });
    }

    // ensure form
    const ensureForm: FormStore["ensureForm"] = (formKey) => {
        setState((prev) => {
            if (prev.forms[formKey]) return prev;
            return { ...prev, forms: { ...prev.forms, [formKey]: createForm() } };
        });
    };

    // remove form
    const removeForm: FormStore["removeForm"] = (formKey) => {
        setState((prev) => {
            if (!prev.forms[formKey]) return prev;
            const { [formKey]: _removed, ...rest } = prev.forms;
            return { ...prev, forms: rest };
        });
    };

    // set field configs
    const setFieldConfigs: FormStore["setFieldConfigs"] = (formKey, configs) => {
        updateForm(formKey, (form) => ({ ...form, fieldConfigs: configs }));
    };

    // patch field configs
    const patchFieldConfigs: FormStore["patchFieldConfigs"] = (formKey, configs) => {
        updateForm(formKey, (form) => ({
            ...form,
            fieldConfigs: { ...form.fieldConfigs, ...(configs as FieldConfigMap) },
        }));
    };

    // set value local
    const setValueLocal: FormStore["setValueLocal"] = (formKey, fieldKey, value) => {
        updateForm(formKey, (form) => ({
            ...form,
            valuesLocal: { ...form.valuesLocal, [fieldKey]: value },
        }));
    };

    // sync value local
    // set local only if value changed (avoids extra listener churn)
    const syncValueLocal: FormStore["syncValueLocal"] = (formKey, fieldKey, value) => {
        const current = state.forms[formKey]?.valuesLocal[fieldKey];
        if (Object.is(current, value)) return;
        setValueLocal(formKey, fieldKey, value);
    };

    // set values remote
    const setValuesRemote: FormStore["setValuesRemote"] = (formKey, values) => {
        updateForm(formKey, (form) => {
            if (recordEqual(form.valuesRemote, values)) return form;
            return { ...form, valuesRemote: values };
        });
    };

    // patch values remote
    const patchValuesRemote: FormStore["patchValuesRemote"] = (formKey, values) => {
        updateForm(formKey, (form) => ({
            ...form,
            valuesRemote: { ...form.valuesRemote, ...values },
        }));
    };

    // clear values local
    const clearValuesLocal: FormStore["clearValuesLocal"] = (formKey) => {
        updateForm(formKey, (form) => {
            if (Object.keys(form.valuesLocal).length === 0) return form;
            return { ...form, valuesLocal: {}, touchedFields: {} };
        });
    };

    // set touched
    const setTouched: FormStore["setTouched"] = (formKey, fieldKey, touched) => {
        updateForm(formKey, (form) => {
            const has = Boolean(form.touchedFields[fieldKey]);
            if (has === touched) return form;
            const next = { ...form.touchedFields };
            if (touched) next[fieldKey] = true;
            else delete next[fieldKey];
            return { ...form, touchedFields: next };
        });
    };

    // set all touched
    const setAllTouched: FormStore["setAllTouched"] = (formKey, touched) => {
        updateForm(formKey, (form) => {
            if (!touched) {
                if (Object.keys(form.touchedFields).length === 0) return form;
                return { ...form, touchedFields: {} };
            }
            const next: Record<string, true> = {};
            for (const k of Object.keys(form.fieldConfigs)) next[k] = true;
            return { ...form, touchedFields: next };
        });
    };

    // set all forms touched
    const setAllFormsTouched: FormStore["setAllFormsTouched"] = (touched) => {
        for (const formKey of Object.keys(state.forms)) setAllTouched(formKey, touched);
    };

    // flag setter
    // shared boolean flag setter for loading / saving / deleted / locked
    function flagSetter<K extends "isLoading" | "isSaving" | "isDeleted" | "isLocked">(flag: K) {
        return (formKey: string, value: boolean) => {
            updateForm(formKey, (form) => {
                if (form[flag] === value) return form;
                return { ...form, [flag]: value };
            });
        };
    }

    // set custom data
    const setCustomData: FormStore["setCustomData"] = (formKey, key, value) => {
        updateForm(formKey, (form) => {
            if (Object.is(form.customData[key], value)) return form;
            return { ...form, customData: { ...form.customData, [key]: value } };
        });
    };

    // clear
    const clear: FormStore["clear"] = () => {
        setState((prev) => (Object.keys(prev.forms).length === 0 ? prev : { ...prev, forms: {} }));
    };

    // return store
    return {
        getState,
        subscribe,
        setState,
        ensureForm,
        removeForm,
        setFieldConfigs,
        patchFieldConfigs,
        setValueLocal,
        syncValueLocal,
        setValuesRemote,
        patchValuesRemote,
        clearValuesLocal,
        setTouched,
        setAllTouched,
        setAllFormsTouched,
        setIsLoading: flagSetter("isLoading"),
        setIsSaving: flagSetter("isSaving"),
        setIsDeleted: flagSetter("isDeleted"),
        setIsLocked: flagSetter("isLocked"),
        setCustomData,
        clear,
    };
}
