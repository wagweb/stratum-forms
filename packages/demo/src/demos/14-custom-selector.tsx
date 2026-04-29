import {
    selectFormChangedFields,
    selectFormIsDirty,
    selectFormIsValid,
    shallowEqual,
    useForm,
    useFormFieldConfigSync,
    useFormSelector,
    type FieldConfigMap,
} from "stratum-forms";
import { TextField } from "../components/inputs";
import { combineValidators, email, required } from "stratum-forms";

const FORM_KEY = "selector";

const FIELDS: FieldConfigMap = {
    firstName: { label: "First name", validate: required() },
    lastName: { label: "Last name", validate: required() },
    email: { label: "Email", validate: combineValidators(required(), email()) },
};

export function CustomSelector() {
    useFormFieldConfigSync(FORM_KEY, FIELDS);
    useForm(FORM_KEY); // ensure form is registered before reading

    return (
        <>
            <div className="card">
                <h3>Form</h3>
                <TextField formKey={FORM_KEY} fieldKey="firstName" />
                <TextField formKey={FORM_KEY} fieldKey="lastName" />
                <TextField formKey={FORM_KEY} fieldKey="email" type="email" />
            </div>

            <div className="card">
                <h3>Custom slice (useFormSelector + shallowEqual)</h3>
                <Summary />
            </div>

            <div className="card">
                <h3>Untyped raw read</h3>
                <p className="muted" style={{ margin: "0 0 8px", fontSize: 12 }}>
                    A selector can compute anything from the state — including aggregates over multiple forms.
                </p>
                <RawValuesPreview />
            </div>
        </>
    );
}

function Summary() {
    const summary = useFormSelector(
        (state) => ({
            firstName: state.forms[FORM_KEY]?.valuesLocal.firstName ?? state.forms[FORM_KEY]?.valuesRemote.firstName,
            isDirty: selectFormIsDirty(state, FORM_KEY),
            isValid: selectFormIsValid(state, FORM_KEY),
            changed: selectFormChangedFields(state, FORM_KEY),
        }),
        shallowEqual,
    );
    return (
        <div className="kv">
            <div className="k">firstName</div>
            <div className="v">{JSON.stringify(summary.firstName)}</div>
            <div className="k">isDirty</div>
            <div className="v">{String(summary.isDirty)}</div>
            <div className="k">isValid</div>
            <div className="v">{String(summary.isValid)}</div>
            <div className="k">changedFields</div>
            <div className="v">{JSON.stringify(summary.changed)}</div>
        </div>
    );
}

function RawValuesPreview() {
    const json = useFormSelector(
        (state) => JSON.stringify(state.forms[FORM_KEY]?.valuesLocal ?? {}, null, 2),
        Object.is,
    );
    return <pre>{json}</pre>;
}
