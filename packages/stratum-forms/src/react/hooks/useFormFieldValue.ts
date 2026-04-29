import { selectValue } from "../../core/formSelectors";
import { useFormSelector } from "./useFormSelector";

// use form field value
// unified value only; skips validation + touched subscriptions
export function useFormFieldValue<ValueType = unknown>(formKey: string, fieldKey: string): ValueType | undefined {
    return useFormSelector((state) => selectValue<ValueType>(state, formKey, fieldKey));
}
