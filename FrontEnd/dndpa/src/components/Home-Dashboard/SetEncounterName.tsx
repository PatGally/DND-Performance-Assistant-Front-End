import type { EncounterFormData } from "./CreateEncounter";
import { Form } from "react-bootstrap";

type Props = {
    formData: EncounterFormData;
    updateFormData: (updates: Partial<EncounterFormData>) => void;
};

function SetEncounterName({ formData, updateFormData }: Props) {
    const isTouched = formData.name.length > 0;
    const isInvalid = isTouched && formData.name.trim().length < 3;

    return (
        <div className="p-3">
            <Form.Group>
                <Form.Label className="text-white">Encounter Name</Form.Label>
                <Form.Control
                    type="text"
                    placeholder="Encounter Name..."
                    value={formData.name}
                    isInvalid={isInvalid}
                    isValid={isTouched && !isInvalid}
                    onChange={(e) => updateFormData({ name: e.target.value })}
                />
                <Form.Control.Feedback type="invalid">
                    Encounter name must be at least 3 characters.
                </Form.Control.Feedback>
            </Form.Group>
        </div>
    );
}

export default SetEncounterName;