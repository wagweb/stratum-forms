import {
    combineValidators,
    email,
    required,
    shallowEqual,
    useForm,
    useFormField,
    useFormFieldConfigSync,
    useFormSelector,
    useFormStore,
    type FieldConfigMap,
} from "stratum-forms";

const FORM_KEY = "server-errors";

const FIELDS: FieldConfigMap = {
    username: { label: "Username", validate: required() },
    email: { label: "Email", validate: combineValidators(required(), email()) },
};

export function ServerErrors() {
    useFormFieldConfigSync(FORM_KEY, FIELDS);
    const form = useForm(FORM_KEY);
    const store = useFormStore();

    function fakeSubmit() {
        form.setAllTouched();
        if (!form.isValid) return;
        // simulated 422 from the API
        const errors: Record<string, string> = {};
        const snapshot = form.getSnapshot();
        if (snapshot.username === "ada") errors.username = "That username is already taken.";
        if (snapshot.email === "test@example.com") errors.email = "That email is on a blocklist.";
        store.setCustomData(FORM_KEY, "serverErrors", errors);
    }

    function clearServerErrors() {
        store.setCustomData(FORM_KEY, "serverErrors", {});
    }

    return (
        <>
            <div className="card">
                <h3>Form</h3>
                <p className="muted" style={{ margin: "0 0 12px", fontSize: 12.5 }}>
                    Try <code>ada</code> as username or <code>test@example.com</code> as email — the simulated server
                    will reject them and we'll surface the errors via <code>customData</code>.
                </p>
                <FieldWithServerError fieldKey="username" />
                <FieldWithServerError fieldKey="email" type="email" />
                <div className="btn-row">
                    <button className="btn" type="button" onClick={fakeSubmit} disabled={!form.isValid}>
                        Submit
                    </button>
                    <button className="btn secondary" type="button" onClick={clearServerErrors}>
                        Clear server errors
                    </button>
                </div>
            </div>
        </>
    );
}

function FieldWithServerError({
    fieldKey,
    type = "text",
}: {
    fieldKey: string;
    type?: "text" | "email";
}) {
    const f = useFormField<string>(FORM_KEY, fieldKey);
    const serverError = useFormSelector(
        (state) => {
            const errs = state.forms[FORM_KEY]?.customData.serverErrors as Record<string, string> | undefined;
            return errs?.[fieldKey];
        },
        shallowEqual,
    );

    const error = f.errorMessage ?? serverError;

    return (
        <label className="row">
            {f.label && <span className="label">{f.label}</span>}
            <input
                type={type}
                value={f.value ?? ""}
                aria-invalid={Boolean(error) || undefined}
                onChange={(e) => f.setValue(e.target.value)}
                onBlur={() => f.setTouched(true)}
            />
            {error && <span className="error">{error}</span>}
        </label>
    );
}
