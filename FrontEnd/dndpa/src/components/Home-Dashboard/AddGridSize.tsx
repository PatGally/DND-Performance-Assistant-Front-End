import type { EncounterFormData } from "./CreateEncounter";
import { Form, Row, Col } from "react-bootstrap";
import { useRef, useEffect } from "react";

type Props = {
    formData: EncounterFormData;
    updateFormData: (updates: Partial<EncounterFormData>) => void;
};

function AddGridSize({ formData, updateFormData }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rowsInvalid = formData.gridSize.rows !== 0 && formData.gridSize.rows < 10;
    const colsInvalid = formData.gridSize.cols !== 0 && formData.gridSize.cols < 10;
    const rowsEmpty = formData.gridSize.rows === 0;
    const colsEmpty = formData.gridSize.cols === 0;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !formData.maplink) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const img = new Image();
        img.src = formData.maplink;
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;

            // Draw image
            ctx.drawImage(img, 0, 0);

            const rows = formData.gridSize.rows;
            const cols = formData.gridSize.cols;

            if (rows >= 10 && cols >= 10) {
                const cellWidth = img.width / cols;
                const cellHeight = img.height / rows;

                ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)' ; //'rgba(255, 255, 255, 0.5)'
                ctx.lineWidth = 1;

                // Draw vertical lines
                for (let c = 0; c <= cols; c++) {
                    ctx.beginPath();
                    ctx.moveTo(c * cellWidth, 0);
                    ctx.lineTo(c * cellWidth, img.height);
                    ctx.stroke();
                }

                // Draw horizontal lines
                for (let r = 0; r <= rows; r++) {
                    ctx.beginPath();
                    ctx.moveTo(0, r * cellHeight);
                    ctx.lineTo(img.width, r * cellHeight);
                    ctx.stroke();
                }
            }
        };
    }, [formData.maplink, formData.gridSize.rows, formData.gridSize.cols]);

    return (
        <div className="p-3">
            <Form>
                <Row>
                    <Col>
                        <Form.Group>
                            <Form.Label className="text-white">Rows</Form.Label>
                            <Form.Control
                                type="number"
                                placeholder="Rows..."
                                min={10}
                                isInvalid={rowsInvalid || rowsEmpty}
                                value={formData.gridSize.rows === 0 ? "" : formData.gridSize.rows}
                                onChange={(e) => updateFormData({ gridSize: { ...formData.gridSize, rows: Number(e.target.value) } })}
                            />
                            <Form.Control.Feedback type="invalid">
                                {rowsEmpty ? "Rows cannot be empty." : "Rows must be at least 10."}
                            </Form.Control.Feedback>
                        </Form.Group>
                    </Col>
                    <Col>
                        <Form.Group>
                            <Form.Label className="text-white">Columns</Form.Label>
                            <Form.Control
                                type="number"
                                placeholder="Columns..."
                                min={10}
                                isInvalid={colsInvalid || colsEmpty}
                                value={formData.gridSize.cols === 0 ? "" : formData.gridSize.cols}
                                onChange={(e) => updateFormData({ gridSize: { ...formData.gridSize, cols: Number(e.target.value) } })}
                            />
                            <Form.Control.Feedback type="invalid">
                                {colsEmpty ? "Columns cannot be empty." : "Columns must be at least 10."}
                            </Form.Control.Feedback>
                        </Form.Group>
                    </Col>
                </Row>
            </Form>

            {formData.maplink ? (
                <div className="mt-3">
                    <Form.Label className="text-white">
                        Grid Preview {formData.gridSize.rows >= 10 && formData.gridSize.cols >= 10
                        ? `— ${formData.gridSize.cols} x ${formData.gridSize.rows}`
                        : '— enter valid grid size to see overlay'}
                    </Form.Label>
                    <canvas
                        ref={canvasRef}
                        style={{
                            width: '100%',
                            borderRadius: '4px',
                            border: '1px solid #271e37',
                        }}
                    />
                </div>
            ) : (
                <div className="mt-3 text-white-50">
                    No map image selected — go back to the Map step to upload one.
                </div>
            )}
        </div>
    );
}

export default AddGridSize;