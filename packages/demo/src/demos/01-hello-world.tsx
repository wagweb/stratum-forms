import { combineValidators, email, required, useForm, useFormFieldConfigSync, type FieldConfigMap } from "stratum-forms";
import { TextField } from "../components/inputs";

const FORM_KEY = "hello";

const FIELDS: FieldConfigMap = {
    name: { label: "Name", placeholder: "Ada Lovelace", validate: required("Please enter your name") },
    email: { label: "Email", placeholder: "you@example.com", validate: combineValidators(required(), email()) },
};

export function HelloWorld() {
    useFormFieldConfigSync(FORM_KEY, FIELDS);
    const form = useForm(FORM_KEY);
    return (
        <form
            className="card"
            onSubmit={(e) => {
                e.preventDefault();
                form.setAllTouched();
                if (!form.isValid) return;
                alert(JSON.stringify(form.getSnapshot(), null, 2));
            }}
        >
            <h3>Form</h3>
            <TextField formKey={FORM_KEY} fieldKey="name" />
            <TextField formKey={FORM_KEY} fieldKey="email" type="email" />
            <div className="btn-row">
                <button className="btn" disabled={!form.isDirty}>Submit</button>
                <button type="button" className="btn secondary" disabled={!form.isDirty} onClick={form.reset}>
                    Reset
                </button>
                <span className="muted">
                    {form.isDirty ? "dirty" : "clean"} · {form.isValid ? "valid" : "invalid"}
                </span>
            </div>
        </form>
    );
}
