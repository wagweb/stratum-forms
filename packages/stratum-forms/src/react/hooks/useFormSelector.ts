import { useDebugValue, useRef, useSyncExternalStore } from "react";
import type { FormsState } from "../../core/types";
import { useFormStore } from "./useFormStore";

// use form selector
// subscribe to a slice of store state; re-render when `isEqual(prev, next)` is false (default: Object.is)
// caches last snapshot by *state* identity so getSnapshot stays stable until the store commits (react requirement)
export function useFormSelector<SelectedType>(
    selector: (state: FormsState) => SelectedType,
    isEqual: (a: SelectedType, b: SelectedType) => boolean = Object.is,
): SelectedType {
	// store
	const store = useFormStore();

	// cache
    const cacheRef = useRef<UseFormSelectorCache<SelectedType> | null>(null);
    if (cacheRef.current === null) {
        cacheRef.current = {
            hasValue: false,
            state: undefined as never,
            selected: undefined as never,
            selector,
            isEqual,
        };
    }
    
	// cache
    const cache = cacheRef.current;
    cache.selector = selector;
    cache.isEqual = isEqual;

	// get snapshot
    const getSnapshot = () => {
        const state = store.getState();
        if (cache.hasValue && Object.is(cache.state, state)) {
            return cache.selected;
        }
        const next = cache.selector(state);
        if (cache.hasValue && cache.isEqual(cache.selected, next)) {
            cache.state = state;
            return cache.selected;
        }
        cache.hasValue = true;
        cache.state = state;
        cache.selected = next;
        return next;
    };

	// use sync external store
    const value = useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot);

	// use debug value
    useDebugValue(value);
    return value;
}

// use form selector cache
type UseFormSelectorCache<SelectedType> = {
    hasValue: boolean;
    state: FormsState;
    selected: SelectedType;
    selector: (state: FormsState) => SelectedType;
    isEqual: (a: SelectedType, b: SelectedType) => boolean;
};
