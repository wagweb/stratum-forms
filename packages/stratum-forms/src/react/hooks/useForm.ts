import { useCallback, useMemo } from "react";
import {
    selectForm,
    selectFormChangedFields,
    selectFormChanges,
    selectFormIsDirty,
    selectFormIsValid,
    selectFormSnapshot,
} from "../../core/formSelectors";
import { shallowEqual } from "../../core/formUtils";
import { useFormSelector } from "./useFormSelector";
import { useFormStore } from "./useFormStore";

export function useForm(formKey: string) {
    // store
	const store = useFormStore();

	// form summary
    const formSummary = useFormSelector((state) => {
        const form = selectForm(state, formKey);
        return {
            isLoading: form.isLoading,
            isSaving: form.isSaving,
            isDeleted: form.isDeleted,
            isLocked: form.isLocked,
            isDirty: selectFormIsDirty(state, formKey),
            isValid: selectFormIsValid(state, formKey),
            changedFields: selectFormChangedFields(state, formKey),
        };
    }, shallowEqual);

	// setters
    const setIsLoading = useCallback((v: boolean) => store.setIsLoading(formKey, v), [store, formKey]);
    const setIsSaving = useCallback((v: boolean) => store.setIsSaving(formKey, v), [store, formKey]);
    const setIsDeleted = useCallback((v: boolean) => store.setIsDeleted(formKey, v), [store, formKey]);
    const setIsLocked = useCallback((v: boolean) => store.setIsLocked(formKey, v), [store, formKey]);
    const setAllTouched = useCallback((v = true) => store.setAllTouched(formKey, v), [store, formKey]);
    
	// reset & remove
	const reset = useCallback(() => store.clearValuesLocal(formKey), [store, formKey]);
    const remove = useCallback(() => store.removeForm(formKey), [store, formKey]);

	// getters
    const getChanges = useCallback(() => selectFormChanges(store.getState(), formKey), [store, formKey]);
    const getSnapshot = useCallback(() => selectFormSnapshot(store.getState(), formKey), [store, formKey]);

	// return form
    return useMemo(
        () => ({
            ...formSummary,
            setIsLoading,
            setIsSaving,
            setIsDeleted,
            setIsLocked,
            setAllTouched,
            reset,
            remove,
            getChanges,
            getSnapshot,
        }),
        [
            formSummary,
            setIsLoading,
            setIsSaving,
            setIsDeleted,
            setIsLocked,
            setAllTouched,
            reset,
            remove,
            getChanges,
            getSnapshot,
        ],
    );
}
