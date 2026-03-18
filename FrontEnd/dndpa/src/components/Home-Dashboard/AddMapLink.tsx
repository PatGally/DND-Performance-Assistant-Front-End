import type { EncounterFormData } from "./CreateEncounter";
import { Form } from "react-bootstrap";

type Props = {
    formData: EncounterFormData;
    updateFormData: (updates: Partial<EncounterFormData>) => void;
};

function AddMapLink({ formData, updateFormData }: Props) {
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const blobUrl = URL.createObjectURL(file);
            updateFormData({ maplink: blobUrl });
        }
    };

    return (
        <div className="p-3">
            <Form>
                <Form.Group>
                    <Form.Label className="text-white">Map Image</Form.Label>
                    <Form.Control
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                    />
                    <Form.Text className="text-white-50">
                        Upload a map image (PNG, JPG, etc.)
                    </Form.Text>
                </Form.Group>

                {formData.maplink && (
                    <div className="mt-3">
                        <Form.Label className="text-white">Preview</Form.Label>
                        <h2 className="text-center"> Preview </h2>
                        <img
                            src={formData.maplink}
                            alt="Map preview"
                            style={{ width: '100%', maxHeight: '500px', objectFit: 'contain', borderRadius: '8px' }}
                        />
                    </div>
                )}
            </Form>
        </div>
    );
}

export default AddMapLink;

