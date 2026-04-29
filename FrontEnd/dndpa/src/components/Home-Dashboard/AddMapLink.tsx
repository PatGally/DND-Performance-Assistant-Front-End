import type { EncounterFormData } from "./CreateEncounter";
import { Form } from "react-bootstrap";
import { useState } from "react";

type Props = {
    formData: EncounterFormData;
    updateFormData: (updates: Partial<EncounterFormData>) => void;
};

function extractDriveFileId(url: string): string | null {
    const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
}

function AddMapLink({ formData, updateFormData }: Props) {
    const [inputValue, setInputValue] = useState("");
    const [error, setError] = useState<string | null>(null);

    const handleLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const url = e.target.value;
        setInputValue(url);
        setError(null);

        if (!url) {
            updateFormData({ maplink: "" });
            return;
        }

        const fileId = extractDriveFileId(url);
        if (!fileId) {
            setError("Invalid Google Drive link. Please paste a share link like: https://drive.google.com/file/d/.../view?usp=share_link");
            updateFormData({ maplink: "" });
            return;
        }

        // Use your existing backend proxy endpoint
        updateFormData({ maplink: `/api/drive-image/${fileId}` });
    };

    return (
        <div className="p-3" style={{backgroundColor: "rgba(15, 24, 40, 0.85)", height: "100%"}}>
            <Form onSubmit={(e) => e.preventDefault()}>
                <Form.Group>
                    <Form.Control
                        type="text"
                        placeholder="Paste Google Drive share link..."
                        value={inputValue}
                        onChange={handleLinkChange}
                        isInvalid={!!error}
                    />
                    {error ? (
                        <Form.Control.Feedback type="invalid">
                            {error}
                        </Form.Control.Feedback>
                    ) : (
                        <Form.Text className="text-white" style={{fontSize: '1.1rem'}}>
                            Paste a Google Drive share link (e.g. https://drive.google.com/file/d/.../view?usp=share_link)
                            <div className='mt-2'> <strong> Don't have a Google Drive share Link set up yet? Use any one of these below! </strong></div>
                            <div className='mt-2'> 1. https://drive.google.com/file/d/1JtTRwPSTFhi1Y5nVKkIWt5bF4rGxN5QB/view?usp=sharing (30x30 tiles)</div>
                            <div className='mt-2'> 2. https://drive.google.com/file/d/1B2vBTHudYwkMBr8_bebrzRcnCx4PhgzM/view?usp=sharing (16x22 tiles)</div>
                            <div className='mt-2'> 3. https://drive.google.com/file/d/14lTqgOZV0ndBq29mFcDu49NKHvHenQK4/view?usp=drive_link (33x22 tiles)</div>
                            <div className='mt-2'> 4. https://drive.google.com/file/d/1wpYFnV2ku77JkwTuSpfzJXnWinyBH6IQ/view?usp=drive_link (18x24 tiles)</div>
                            <div className='mt-2'> 5. https://drive.google.com/file/d/1XiPXoJL-goNxoME-LZpAyjkJDAhsU4be/view?usp=drive_link (40x30 tiles)</div>
                        </Form.Text>


                    )}
                </Form.Group>

                {formData.maplink && !error && (
                    <div className="mt-3">
                        <Form.Label className="text-white">Preview</Form.Label>
                        <img
                            src={formData.maplink}
                            alt="Map preview"
                            onError={() => setError("Could not load image. Make sure the file is shared publicly ('Anyone with the link').")}
                            style={{
                                width: "100%",
                                maxHeight: "500px",
                                objectFit: "contain",
                                borderRadius: "8px",
                            }}
                        />
                    </div>
                )}
            </Form>
        </div>
    );
}

export default AddMapLink;