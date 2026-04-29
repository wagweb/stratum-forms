import { useContext } from "react";
import type { FormStore } from "../../core/types";
import { FormStoreContext } from "../context";

// use form store
// returns the store instance (stable); for reads in render prefer useFormSelector
export function useFormStore(): FormStore {
    const store = useContext(FormStoreContext);
    if (!store) {
        throw new Error("useFormStore: no <FormStoreProvider /> found above this component.");
    }
    return store;
}
