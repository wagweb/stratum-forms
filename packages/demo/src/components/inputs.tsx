import { useFormField } from "stratum-forms";

type CommonProps = {
    formKey: string;
    fieldKey: string;
};

export function TextField({
    formKey,
    fieldKey,
    type = "text",
}: CommonProps & { type?: "text" | "email" | "password" | "url" }) {
    const f = useFormField<string>(formKey, fieldKey);
    return (
        <label className="row">
            {f.label && <span className="label">{f.label}</span>}
            <input
                type={type}
                value={f.value ?? ""}
                placeholder={f.placeholder}
                readOnly={f.isReadOnly}
                disabled={f.isDisabled || f.isLoading}
                aria-invalid={f.isInvalid || undefined}
                onChange={(e) => f.setValue(e.target.value)}
                onBlur={() => f.setTouched(true)}
            />
            {f.description && <span className="help">{f.description}</span>}
            {f.errorMessage && <span className="error">{f.errorMessage}</span>}
        </label>
    );
}

export function NumberField({ formKey, fieldKey }: CommonProps) {
    const f = useFormField<number>(formKey, fieldKey);
    return (
        <label className="row">
            {f.label && <span className="label">{f.label}</span>}
            <input
                type="number"
                value={f.value ?? ""}
                placeholder={f.placeholder}
                readOnly={f.isReadOnly}
                disabled={f.isDisabled || f.isLoading}
                aria-invalid={f.isInvalid || undefined}
                onChange={(e) => {
                    const raw = e.target.value;
                    f.setValue(raw === "" ? undefined : Number(raw));
                }}
                onBlur={() => f.setTouched(true)}
            />
            {f.description && <span className="help">{f.description}</span>}
            {f.errorMessage && <span className="error">{f.errorMessage}</span>}
        </label>
    );
}

export function TextareaField({ formKey, fieldKey, rows = 3 }: CommonProps & { rows?: number }) {
    const f = useFormField<string>(formKey, fieldKey);
    return (
        <label className="row">
            {f.label && <span className="label">{f.label}</span>}
            <textarea
                rows={rows}
                value={f.value ?? ""}
                placeholder={f.placeholder}
                readOnly={f.isReadOnly}
                disabled={f.isDisabled || f.isLoading}
                aria-invalid={f.isInvalid || undefined}
                onChange={(e) => f.setValue(e.target.value)}
                onBlur={() => f.setTouched(true)}
            />
            {f.description && <span className="help">{f.description}</span>}
            {f.errorMessage && <span className="error">{f.errorMessage}</span>}
        </label>
    );
}

export function SelectField({
    formKey,
    fieldKey,
    options,
}: CommonProps & { options: ReadonlyArray<{ value: string; label: string }> }) {
    const f = useFormField<string>(formKey, fieldKey);
    return (
        <label className="row">
            {f.label && <span className="label">{f.label}</span>}
            <select
                value={f.value ?? ""}
                disabled={f.isDisabled || f.isReadOnly || f.isLoading}
                aria-invalid={f.isInvalid || undefined}
                onChange={(e) => f.setValue(e.target.value)}
                onBlur={() => f.setTouched(true)}
            >
                <option value="" disabled>
                    {f.placeholder ?? "Select…"}
                </option>
                {options.map((o) => (
                    <option key={o.value} value={o.value}>
                        {o.label}
                    </option>
                ))}
            </select>
            {f.description && <span className="help">{f.description}</span>}
            {f.errorMessage && <span className="error">{f.errorMessage}</span>}
        </label>
    );
}

export function CheckboxField({ formKey, fieldKey }: CommonProps) {
    const f = useFormField<boolean>(formKey, fieldKey);
    return (
        <label className="row checkbox">
            <input
                type="checkbox"
                checked={Boolean(f.value)}
                disabled={f.isDisabled || f.isReadOnly || f.isLoading}
                onChange={(e) => f.setValue(e.target.checked)}
                onBlur={() => f.setTouched(true)}
            />
            {f.label && <span className="label">{f.label}</span>}
            {f.errorMessage && <span className="error">{f.errorMessage}</span>}
        </label>
    );
}
