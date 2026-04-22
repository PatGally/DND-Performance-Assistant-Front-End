import type { EncounterFormData } from "./CreateEncounter";
import { Form } from "react-bootstrap";

type Props = {
    formData: EncounterFormData;
    updateFormData: (updates: Partial<EncounterFormData>) => void;
};

function SetEncounterName({ formData, updateFormData }: Props) {
    const isTouched = formData.name.length > 0;
    const isTooShort = isTouched && formData.name.trim().length < 3;
    const isTooLong = isTouched && formData.name.trim().length > 20;
    const isInvalid = isTooShort || isTooLong;

    return (
        <div className="p-3" style={{backgroundColor: "rgba(15, 24, 40, 0.85)", height: "100%"}}>
            <Form.Group>
                <Form.Control
                    type="text"
                    placeholder="Encounter Name..."
                    value={formData.name}
                    isInvalid={isInvalid}
                    isValid={isTouched && !isInvalid}
                    onChange={(e) => updateFormData({ name: e.target.value })}
                />
                <Form.Control.Feedback type="invalid" style={{fontSize: '1.1rem'}}>
                    {isTooShort
                        ? "Encounter name must be at least 3 characters."
                        : "Encounter name must be 20 characters or fewer. Remove extra spaces if necessary."}
                </Form.Control.Feedback>
            </Form.Group>
        </div>
    );
}

export default SetEncounterName;