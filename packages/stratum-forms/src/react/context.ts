import { createContext } from "react";
import type { FormStore } from "../core/types";

// form store context
// holds the store object (stable ref); live data flows through useSyncExternalStore, not context updates
export const FormStoreContext = createContext<FormStore | null>(null);
