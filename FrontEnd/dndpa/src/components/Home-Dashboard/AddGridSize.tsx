import type { EncounterFormData } from "./CreateEncounter";
import { Form, Row, Col } from "react-bootstrap";
import { useRef, useEffect, useState } from "react";

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

    const [offsetX, setOffsetX] = useState(0);
    const [offsetY, setOffsetY] = useState(0);
    const [scaleX, setScaleX] = useState(1);
    const [scaleY, setScaleY] = useState(1);

    const[lineWidth, setLineWidth] = useState(1);

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

            ctx.drawImage(img, 0, 0);

            const rows = formData.gridSize.rows;
            const cols = formData.gridSize.cols;

            if (rows >= 10 && cols >= 10) {
                const cellWidth  = (img.width  / cols) * scaleX;
                const cellHeight = (img.height / rows) * scaleY;

                ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.lineWidth = lineWidth;

                for (let c = 0; c <= cols; c++) {
                    const x = offsetX + c * cellWidth;
                    ctx.beginPath();
                    ctx.moveTo(x, 0);
                    ctx.lineTo(x, img.height);
                    ctx.stroke();
                }

                for (let r = 0; r <= rows; r++) {
                    const y = offsetY + r * cellHeight;
                    ctx.beginPath();
                    ctx.moveTo(0, y);
                    ctx.lineTo(img.width, y);
                    ctx.stroke();
                }
            }
        };
    }, [formData.maplink, formData.gridSize.rows, formData.gridSize.cols, offsetX, offsetY, scaleX, scaleY,lineWidth]);

    const gridReady = formData.gridSize.rows >= 10 && formData.gridSize.cols >= 10;

    return (
        <div className="p-3" style={{backgroundColor: "rgba(15, 24, 40, 0.85)"}}>
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

                {gridReady && (
                    <>
                        <hr style={{ borderColor: '#ffffff22', margin: '1.25rem 0 1rem' }} />
                        <Row>
                            <Col>
                                <Form.Group>
                                    <Form.Label className="text-white d-flex justify-content-between">
                                        <span>Grid Line Weight</span>
                                        <span className="text-white-80" style={{ fontSize: '0.9rem' }}>{lineWidth}px</span>
                                    </Form.Label>
                                    <Form.Range
                                        min={1}
                                        max={6}
                                        value={lineWidth}
                                        onChange={(e) => setLineWidth(Number(e.target.value))}
                                    />
                                </Form.Group>
                            </Col>
                            <Col>
                                <Form.Group>
                                    <Form.Label className="text-white d-flex justify-content-between">
                                        <span>X Offset</span>
                                        <span className="text-white-80" style={{ fontSize: '0.9rem' }}>{offsetX}px</span>
                                    </Form.Label>
                                    <Form.Range
                                        min={-100}
                                        max={100}
                                        value={offsetX}
                                        onChange={(e) => setOffsetX(Number(e.target.value))}
                                    />
                                </Form.Group>
                            </Col>
                            <Col>
                                <Form.Group>
                                    <Form.Label className="text-white d-flex justify-content-between">
                                        <span>Y Offset</span>
                                        <span className="text-white-80" style={{ fontSize: '0.9rem' }}>{offsetY}px</span>
                                    </Form.Label>
                                    <Form.Range
                                        min={-100}
                                        max={100}
                                        value={offsetY}
                                        onChange={(e) => setOffsetY(Number(e.target.value))}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col>
                                <Form.Group>
                                    <Form.Label className="text-white d-flex justify-content-between">
                                        <span>X Cell Size</span>
                                        <span className="text-white-80" style={{ fontSize: '0.9rem' }}>{scaleX.toFixed(2)}x</span>
                                    </Form.Label>
                                    <Form.Range
                                        min={50}
                                        max={150}
                                        value={Math.round(scaleX * 100)}
                                        onChange={(e) => setScaleX(Number(e.target.value) / 100)}
                                    />
                                </Form.Group>
                            </Col>
                            <Col>
                                <Form.Group>
                                    <Form.Label className="text-white d-flex justify-content-between">
                                        <span>Y Cell Size</span>
                                        <span className="text-white-80" style={{ fontSize: '0.9rem' }}>{scaleY.toFixed(2)}x</span>
                                    </Form.Label>
                                    <Form.Range
                                        min={50}
                                        max={150}
                                        value={Math.round(scaleY * 100)}
                                        onChange={(e) => setScaleY(Number(e.target.value) / 100)}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <div className="text-end">
                            <small
                                className="text-white-80"
                                style={{ cursor: 'pointer', textDecoration: 'underline', fontSize: '0.95rem' }}
                                onClick={() => { setOffsetX(0); setOffsetY(0); setScaleX(1); setScaleY(1); }}
                            >
                                Reset alignment
                            </small>
                        </div>
                    </>
                )}
            </Form>

            {formData.maplink ? (
                <div className="mt-3">
                    <Form.Label className="text-white">
                        Grid Preview {gridReady
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