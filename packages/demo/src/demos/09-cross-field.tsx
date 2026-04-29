import {
    combineValidators,
    minLength,
    required,
    selectValue,
    useForm,
    useFormFieldConfigSync,
    useFormStore,
    type FieldConfigMap,
    type ValidationFn,
} from "stratum-forms";
import { useMemo } from "react";
import { TextField } from "../components/inputs";

const FORM_KEY = "cross-field";

function buildFields(matchesField: (siblingKey: string) => ValidationFn<string>): FieldConfigMap {
    return {
        password: {
            label: "Password",
            validate: combineValidators(required(), minLength(8)),
        },
        passwordConfirm: {
            label: "Confirm password",
            validate: combineValidators(required(), matchesField("password")),
        },
    };
}

export function CrossField() {
    const store = useFormStore();

    const FIELDS = useMemo<FieldConfigMap>(() => {
        const matchesField = (siblingKey: string): ValidationFn<string> => (value) => {
            if (!value) return { isValid: true };
            const other = selectValue<string>(store.getState(), FORM_KEY, siblingKey);
            return value === other
                ? { isValid: true }
                : { isValid: false, message: "Passwords don't match" };
        };
        return buildFields(matchesField);
    }, [store]);

    useFormFieldConfigSync(FORM_KEY, FIELDS);
    const form = useForm(FORM_KEY);

    return (
        <>
            <div className="card">
                <h3>Form</h3>
                <TextField formKey={FORM_KEY} fieldKey="password" type="password" />
                <TextField formKey={FORM_KEY} fieldKey="passwordConfirm" type="password" />
                <div className="btn-row">
                    <button className="btn" disabled={!form.isValid || !form.isDirty}>
                        Submit
                    </button>
                    <span className="muted">{form.isValid ? "valid" : "invalid"}</span>
                </div>
            </div>

            <div className="card">
                <h3>How it works</h3>
                <p className="muted" style={{ margin: 0, fontSize: 12.5 }}>
                    Validators are pure <code>(value) =&gt; ValidationResult</code> functions. To compare against a
                    sibling, the validator reads the latest store snapshot via <code>selectValue</code> — no React, no
                    extra subscriptions. The validator <em>does</em> need access to the store; here we close over{" "}
                    <code>useFormStore()</code>, but you can also export a module-level store.
                </p>
            </div>
        </>
    );
}
