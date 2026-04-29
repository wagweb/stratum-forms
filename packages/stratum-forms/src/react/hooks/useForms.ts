import { useCallback, useMemo } from "react";
import {
    selectAllFormsValid,
    selectAnyFormDirty,
    selectAnyFormLoading,
    selectAnyFormSaving,
} from "../../core/formSelectors";
import { shallowEqual } from "../../core/formUtils";
import { useFormSelector } from "./useFormSelector";
import { useFormStore } from "./useFormStore";

// use forms
// aggregates every formKey in the store (page chrome, global dirty, etc.)
export function useForms() {
    // store
    const store = useFormStore();

    // aggregate
    const aggregate = useFormSelector(
        (state) => ({
            isAnyDirty: selectAnyFormDirty(state),
            areAllValid: selectAllFormsValid(state),
            isAnyLoading: selectAnyFormLoading(state),
            isAnySaving: selectAnyFormSaving(state),
            formKeys: Object.keys(state.forms),
        }),
        shallowEqual,
    );

    // touch all & clear all
    const touchAll = useCallback((v = true) => store.setAllFormsTouched(v), [store]);
    const clearAll = useCallback(() => store.clear(), [store]);

    // return forms
    return useMemo(() => ({ ...aggregate, touchAll, clearAll }), [aggregate, touchAll, clearAll]);
}
