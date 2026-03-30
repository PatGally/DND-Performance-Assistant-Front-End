// import type { EncounterFormData } from "./CreateEncounter";
// import { Form } from "react-bootstrap";
//
// type Props = {
//     formData: EncounterFormData;
//     updateFormData: (updates: Partial<EncounterFormData>) => void;
// };
//
// function AddMapLink({ formData, updateFormData }: Props) {
//     const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//         const file = e.target.files?.[0];
//         if (file) {
//             const blobUrl = URL.createObjectURL(file);
//             updateFormData({ maplink: blobUrl });
//         }
//     };
//
//     return (
//         <div className="p-3">
//             <Form>
//                 <Form.Group>
//                     <Form.Label className="text-white">Map Image</Form.Label>
//                     <Form.Control
//                         type="file"
//                         accept="image/*"
//                         onChange={handleFileChange}
//                     />
//                     <Form.Text className="text-white-50">
//                         Upload a map image (PNG, JPG, etc.)
//                     </Form.Text>
//                 </Form.Group>
//
//                 {formData.maplink && (
//                     <div className="mt-3">
//                         <Form.Label className="text-white">Preview</Form.Label>
//                         <h2 className="text-center"> Preview </h2>
//                         <img
//                             src={formData.maplink}
//                             alt="Map preview"
//                             style={{ width: '100%', maxHeight: '500px', objectFit: 'contain', borderRadius: '8px' }}
//                         />
//                     </div>
//                 )}
//             </Form>
//         </div>
//     );
// }
//
// export default AddMapLink;
//

// import type { EncounterFormData } from "./CreateEncounter";
// import { Form } from "react-bootstrap";
// import { useState } from "react";
//
// type Props = {
//     formData: EncounterFormData;
//     updateFormData: (updates: Partial<EncounterFormData>) => void;
// };
//
// function extractDriveFileId(url: string): string | null {
//     const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
//     return match ? match[1] : null;
// }
//
// function buildDirectImageUrl(fileId: string): string {
//     return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
//     // return `https://drive.google.com/uc?export=view&id=${fileId}`;
//     // return `https://lh3.googleusercontent.com/d/${fileId}`;
//     // return `/api/drive-image/${fileId}`;
// }
//
// function AddMapLink({ formData, updateFormData }: Props) {
//     const [inputValue, setInputValue] = useState("");
//     const [error, setError] = useState<string | null>(null);
//
//     const handleLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//         const url = e.target.value;
//         setInputValue(url);
//         setError(null);
//
//         if (!url) {
//             updateFormData({ maplink: "" });
//             return;
//         }
//
//         const fileId = extractDriveFileId(url);
//         if (!fileId) {
//             setError("Invalid Google Drive link. Please paste a share link like: https://drive.google.com/file/d/.../view?usp=share_link");
//             updateFormData({ maplink: "" });
//             return;
//         }
//
//         const directUrl = buildDirectImageUrl(fileId);
//         updateFormData({ maplink: directUrl });
//     };
//
//     return (
//         <div className="p-3">
//             <Form onSubmit={(e) => e.preventDefault()}>
//                 <Form.Group>
//                     <Form.Label >Map Image (Google Drive Link)</Form.Label>
//                     <Form.Control
//                         type="text"
//                         placeholder="Paste Google Drive share link..."
//                         value={inputValue}
//                         onChange={handleLinkChange}
//                         isInvalid={!!error}
//                     />
//                     {error ? (
//                         <Form.Control.Feedback type="invalid">
//                             {error}
//                         </Form.Control.Feedback>
//                     ) : (
//                         <Form.Text className="text-white-50">
//                             Paste a Google Drive share link (e.g. https://drive.google.com/file/d/.../view?usp=share_link)
//                         </Form.Text>
//                     )}
//                 </Form.Group>
//
//                 {formData.maplink && !error && (
//                     <div className="mt-3">
//                         <Form.Label className="text-white">Preview</Form.Label>
//                         <h2 className="text-center text-white">Preview</h2>
//                         <img
//                             src={formData.maplink}
//                             alt="Map preview"
//                             style={{
//                                 width: "100%",
//                                 maxHeight: "500px",
//                                 objectFit: "contain",
//                                 borderRadius: "8px",
//                             }}
//                             onError={() =>
//                                 setError(
//                                     "Could not load image. Make sure the file is shared publicly ('Anyone with the link')."
//                                 )
//                             }
//                         />
//                     </div>
//                 )}
//             </Form>
//         </div>
//     );
// }
//
// export default AddMapLink;

// import type { EncounterFormData } from "./CreateEncounter";
// import { Form } from "react-bootstrap";
// import { useState, useEffect } from "react";
// import { getDriveImageUrl } from "../../utils/driveImageCache";
//
// type Props = {
//     formData: EncounterFormData;
//     updateFormData: (updates: Partial<EncounterFormData>) => void;
// };
//
// function extractDriveFileId(url: string): string | null {
//     const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
//     return match ? match[1] : null;
// }
//
// function AddMapLink({ formData, updateFormData }: Props) {
//     const [inputValue, setInputValue] = useState("");
//     const [error, setError] = useState<string | null>(null);
//     const [imgSrc, setImgSrc] = useState<string | null>(null);
//
//     useEffect(() => {
//         if (formData.maplink) {
//             getDriveImageUrl(formData.maplink).then(url => {
//                 if (url) setImgSrc(url);
//                 else setError("Could not load image. Make sure the file is shared publicly ('Anyone with the link').");
//             });
//         } else {
//             setImgSrc(null);
//         }
//     }, [formData.maplink]);
//
//     const handleLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//         const url = e.target.value;
//         setInputValue(url);
//         setError(null);
//         setImgSrc(null);
//
//         if (!url) {
//             updateFormData({ maplink: "" });
//             return;
//         }
//
//         const fileId = extractDriveFileId(url);
//         if (!fileId) {
//             setError("Invalid Google Drive link. Please paste a share link like: https://drive.google.com/file/d/.../view?usp=share_link");
//             updateFormData({ maplink: "" });
//             return;
//         }
//
//         // Store the raw Drive URL — proxy + cache handles the rest
//         updateFormData({ maplink: url });
//     };
//
//     return (
//         <div className="p-3">
//             <Form onSubmit={(e) => e.preventDefault()}>
//                 <Form.Group>
//                     <Form.Label>Map Image (Google Drive Link)</Form.Label>
//                     <Form.Control
//                         type="text"
//                         placeholder="Paste Google Drive share link..."
//                         value={inputValue}
//                         onChange={handleLinkChange}
//                         isInvalid={!!error}
//                     />
//                     {error ? (
//                         <Form.Control.Feedback type="invalid">
//                             {error}
//                         </Form.Control.Feedback>
//                     ) : (
//                         <Form.Text className="">
//                             Paste a Google Drive share link (e.g. https://drive.google.com/file/d/.../view?usp=share_link)
//                         </Form.Text>
//                     )}
//                 </Form.Group>
//
//                 {imgSrc && !error && (
//                     <div className="mt-3">
//                         <Form.Label className="">Preview</Form.Label>
//                         <h2 className="text-center">Preview</h2>
//                         <img
//                             src={imgSrc}
//                             alt="Map preview"
//                             style={{
//                                 width: "100%",
//                                 maxHeight: "500px",
//                                 objectFit: "contain",
//                                 borderRadius: "8px",
//                             }}
//                         />
//                     </div>
//                 )}
//             </Form>
//         </div>
//     );
// }
//
// export default AddMapLink;

import type { EncounterFormData } from "./CreateEncounter";
import { Form } from "react-bootstrap";
import { useState } from "react";
import { getDriveImageUrl } from "../../utils/driveImageCache";

type Props = {
    formData: EncounterFormData;
    updateFormData: (updates: Partial<EncounterFormData>) => void;
};

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

        const imgUrl = getDriveImageUrl(url);
        if (!imgUrl) {
            setError("Invalid Google Drive link. Please paste a share link like: https://drive.google.com/file/d/.../view?usp=share_link");
            updateFormData({ maplink: "" });
            return;
        }

        updateFormData({ maplink: imgUrl });
    };

    return (
        <div className="p-3">
            <Form onSubmit={(e) => e.preventDefault()}>
                <Form.Group>
                    <Form.Label>Map Image (Google Drive Link)</Form.Label>
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
                        <Form.Text>
                            Paste a Google Drive share link (e.g. https://drive.google.com/file/d/.../view?usp=share_link)
                        </Form.Text>
                    )}
                </Form.Group>

                {formData.maplink && !error && (
                    <div className="mt-3">
                        <Form.Label>Preview</Form.Label>
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