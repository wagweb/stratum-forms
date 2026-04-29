import { useState, type ReactNode } from "react";
import { createFormStore } from "../core/createFormStore";
import type { FormStore } from "../core/types";
import { FormStoreContext } from "./context";

// form store provider
// pass `store` to share one store across trees; else lazily creates a store once per provider
export function FormStoreProvider({ store, children }: FormStoreProviderProps) {
    const [defaultStore] = useState<FormStore>(() => createFormStore());
    return (
        <FormStoreContext.Provider value={store ?? defaultStore}>
            {children}
        </FormStoreContext.Provider>
    );
}

export type FormStoreProviderProps = {
    store?: FormStore;
    children: ReactNode;
};
