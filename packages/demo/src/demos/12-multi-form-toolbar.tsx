import {
    combineValidators,
    email,
    required,
    useForm,
    useFormFieldConfigSync,
    useForms,
    type FieldConfigMap,
} from "stratum-forms";
import { TextField } from "../components/inputs";

const PROFILE_KEY = "profile";
const COMPANY_KEY = "company";

const PROFILE_FIELDS: FieldConfigMap = {
    name: { label: "Name", validate: required() },
    email: { label: "Email", validate: combineValidators(required(), email()) },
};

const COMPANY_FIELDS: FieldConfigMap = {
    company: { label: "Company", validate: required() },
    role: { label: "Role" },
};

export function MultiFormToolbar() {
    const all = useForms();
    return (
        <>
            <div className="card">
                <h3>Toolbar — useForms()</h3>
                <div className="kv">
                    <div className="k">formKeys</div>
                    <div className="v">{JSON.stringify(all.formKeys)}</div>
                    <div className="k">isAnyDirty</div>
                    <div className="v">{String(all.isAnyDirty)}</div>
                    <div className="k">areAllValid</div>
                    <div className="v">{String(all.areAllValid)}</div>
                </div>
                <div className="btn-row" style={{ marginTop: 12 }}>
                    <button className="btn" type="button" onClick={() => all.touchAll()}>
                        Validate everything
                    </button>
                    <button className="btn secondary" type="button" onClick={all.clearAll} disabled={!all.isAnyDirty}>
                        Discard all
                    </button>
                </div>
            </div>

            <ProfileCard />
            <CompanyCard />
        </>
    );
}

function ProfileCard() {
    useFormFieldConfigSync(PROFILE_KEY, PROFILE_FIELDS);
    const form = useForm(PROFILE_KEY);
    return (
        <div className="card">
            <h3>
                Profile{" "}
                <span className={`tag ${form.isDirty ? "warn" : ""}`}>{form.isDirty ? "dirty" : "clean"}</span>
            </h3>
            <TextField formKey={PROFILE_KEY} fieldKey="name" />
            <TextField formKey={PROFILE_KEY} fieldKey="email" type="email" />
        </div>
    );
}

function CompanyCard() {
    useFormFieldConfigSync(COMPANY_KEY, COMPANY_FIELDS);
    const form = useForm(COMPANY_KEY);
    return (
        <div className="card">
            <h3>
                Company{" "}
                <span className={`tag ${form.isDirty ? "warn" : ""}`}>{form.isDirty ? "dirty" : "clean"}</span>
            </h3>
            <TextField formKey={COMPANY_KEY} fieldKey="company" />
            <TextField formKey={COMPANY_KEY} fieldKey="role" />
        </div>
    );
}
