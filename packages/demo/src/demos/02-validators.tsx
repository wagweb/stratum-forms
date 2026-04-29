import {
    combineValidators,
    email,
    integer,
    maxLength,
    minLength,
    pattern,
    range,
    required,
    requiredNumber,
    url,
    useForm,
    useFormFieldConfigSync,
    type FieldConfigMap,
} from "stratum-forms";
import { NumberField, TextField } from "../components/inputs";

const FORM_KEY = "validators";

const FIELDS: FieldConfigMap = {
    name: {
        label: "Name (required)",
        validate: required("Name is required"),
    },
    email: {
        label: "Email (required + email)",
        validate: combineValidators(required(), email()),
    },
    handle: {
        label: "Handle (3–12 chars, lowercase letters/digits)",
        validate: combineValidators(required(), minLength(3), maxLength(12), pattern(/^[a-z0-9]+$/, "lowercase only")),
    },
    website: {
        label: "Website (must be a URL)",
        placeholder: "https://example.com",
        validate: url(),
    },
    age: {
        label: "Age (integer, 18–120)",
        validate: combineValidators(requiredNumber(), integer(), range({ min: 18, max: 120 })),
    },
};

export function Validators() {
    useFormFieldConfigSync(FORM_KEY, FIELDS);
    const form = useForm(FORM_KEY);
    return (
        <form
            className="card"
            onSubmit={(e) => {
                e.preventDefault();
                form.setAllTouched();
            }}
        >
            <h3>Validators</h3>
            <TextField formKey={FORM_KEY} fieldKey="name" />
            <TextField formKey={FORM_KEY} fieldKey="email" type="email" />
            <TextField formKey={FORM_KEY} fieldKey="handle" />
            <TextField formKey={FORM_KEY} fieldKey="website" type="url" />
            <NumberField formKey={FORM_KEY} fieldKey="age" />
            <div className="btn-row">
                <button className="btn">Validate all</button>
                <button type="button" className="btn secondary" onClick={form.reset} disabled={!form.isDirty}>
                    Reset
                </button>
                <span className="muted">{form.isValid ? "valid" : "invalid"}</span>
            </div>
        </form>
    );
}
