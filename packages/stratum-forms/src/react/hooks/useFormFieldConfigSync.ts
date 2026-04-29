import { useEffect } from "react";
import type { FieldConfigMap, FormOptions } from "../../core/types";
import { useFormStore } from "./useFormStore";

// use form field config sync
// registers field configs; pass a stable `configs` ref; on unmount clears configs or drops form if autoCleanup
export function useFormFieldConfigSync(formKey: string, configs: FieldConfigMap, options?: FormOptions) {
    // store
    const store = useFormStore();

    // auto cleanup
    const autoCleanup = options?.autoCleanup ?? false;

    // use effect
    useEffect(() => {
        store.setFieldConfigs(formKey, configs);
        return () => {
            if (autoCleanup) {
                store.removeForm(formKey);
            } else {
                store.setFieldConfigs(formKey, {});
            }
        };
    }, [store, formKey, configs, autoCleanup]);
}
