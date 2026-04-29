import { useEffect } from "react";
import { selectAnyFormDirty, selectAnyFormSaving } from "../../core/formSelectors";
import { useFormSelector } from "./useFormSelector";

// use form dirty blocker
// beforeunload while dirty and not saving; wire SPA blockers yourself (e.g. react-router useBlocker)
export function useFormDirtyBlocker(opts?: { message?: string }) {
    // message
    const message = opts?.message ?? "You have unsaved changes. Leave the page?";

    // is dirty
    const isDirty = useFormSelector((state) => selectAnyFormDirty(state) && !selectAnyFormSaving(state));

    // use effect
    useEffect(() => {
        if (!isDirty) return;
        const handler = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = message;
            return message;
        };
        window.addEventListener("beforeunload", handler);
        return () => window.removeEventListener("beforeunload", handler);
    }, [isDirty, message]);

    // return dirty blocker
    return { isDirty };
}
