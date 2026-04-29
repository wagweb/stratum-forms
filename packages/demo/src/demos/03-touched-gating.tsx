import {
    combineValidators,
    email,
    minLength,
    required,
    useForm,
    useFormFieldConfigSync,
    type FieldConfigMap,
} from "stratum-forms";
import { TextField } from "../components/inputs";

const FORM_KEY = "touched";

const FIELDS: FieldConfigMap = {
    email: {
        label: "Email",
        description: "Type something invalid; you'll only see the error after blurring (touch).",
        validate: combineValidators(required(), email()),
    },
    password: {
        label: "Password",
        description: "Min length 8.",
        validate: combineValidators(required(), minLength(8)),
    },
};

export function TouchedGating() {
    useFormFieldConfigSync(FORM_KEY, FIELDS);
    const form = useForm(FORM_KEY);
    return (
        <>
            <div className="card">
                <h3>Form</h3>
                <TextField formKey={FORM_KEY} fieldKey="email" type="email" />
                <TextField formKey={FORM_KEY} fieldKey="password" type="password" />
                <div className="btn-row">
                    <button
                        className="btn"
                        type="button"
                        onClick={() => form.setAllTouched()}
                        disabled={form.isValid}
                    >
                        Submit (touch all → reveal errors)
                    </button>
                    <button className="btn secondary" type="button" onClick={() => form.setAllTouched(false)}>
                        Untouch all
                    </button>
                </div>
            </div>

            <div className="card">
                <h3>Live state</h3>
                <p className="dim" style={{ margin: "0 0 8px" }}>
                    <span className={`tag ${form.isValid ? "good" : "bad"}`}>
                        form.isValid: {String(form.isValid)}
                    </span>
                    <span className="tag">isDirty: {String(form.isDirty)}</span>
                </p>
                <p className="muted" style={{ margin: 0, fontSize: 12 }}>
                    <code>form.isValid</code> is computed un-gated, so submit buttons can be wired to it before the user
                    has touched anything. The per-field <code>errorMessage</code> respects touched-gating to avoid
                    yelling on the first keystroke.
                </p>
            </div>
        </>
    );
}
