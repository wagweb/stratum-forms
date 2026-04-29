import { useEffect } from "react";
import { useFormStore } from "./useFormStore";

// use form remote sync
// writes server payload into valuesRemote; null/undefined skips; store skips if recordEqual matches
export function useFormRemoteSync(formKey: string, data: Record<string, unknown> | undefined | null) {
    const store = useFormStore();
    useEffect(() => {
        if (data == null) return;
        store.setValuesRemote(formKey, data);
    }, [store, formKey, data]);
}

// use form loading sync
export function useFormLoadingSync(formKey: string, isLoading: boolean) {
    const store = useFormStore();
    useEffect(() => {
        store.setIsLoading(formKey, isLoading);
    }, [store, formKey, isLoading]);
}

// use form lock sync
export function useFormLockSync(formKey: string, isLocked: boolean) {
    const store = useFormStore();
    useEffect(() => {
        store.setIsLocked(formKey, isLocked);
    }, [store, formKey, isLocked]);
}
