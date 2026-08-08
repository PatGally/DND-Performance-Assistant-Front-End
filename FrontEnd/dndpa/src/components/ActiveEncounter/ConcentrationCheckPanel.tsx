import { useEffect, useState } from "react";
import axios from "axios";
import axiosTokenInstance from "../../api/AxiosTokenInstance.ts";
import "../../css/EncounterSimulation.css";

export type PendingConcentrationCheck = {
    checkID: string;
    cid: string;
    name?: string;
    damage: number;
    dc: number;
    resultID?: string;
    concentrationResultID?: string | null;
    sourceAction?: string;
    required: boolean;
    resolved: boolean;
    cancelled?: boolean;
};

type ConcentrationCheckPanelProps = {
    eid: string;
    checks: PendingConcentrationCheck[];
    onResolved: () => Promise<void> | void;
};

export default function ConcentrationCheckPanel({
                                                    eid,
                                                    checks,
                                                    onResolved,
                                                }: ConcentrationCheckPanelProps) {
    const activeCheck = checks[0];
    const [roll, setRoll] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        setRoll("");
        setError("");
    }, [activeCheck?.checkID]);

    if (!activeCheck) return null;

    async function submitCheck() {
        const numericRoll = Number(roll.trim());
        if (!Number.isFinite(numericRoll)) {
            setError("Enter the creature's total Constitution saving throw.");
            return;
        }

        try {
            setSubmitting(true);
            setError("");

            await axiosTokenInstance.post(
                `/encounter/${eid}/simulate/concentration`,
                {
                    checkID: activeCheck.checkID,
                    roll: numericRoll,
                }
            );

            await onResolved();
        } catch (caught) {
            if (axios.isAxiosError(caught)) {
                setError(
                    String(
                        caught.response?.data?.detail ??
                        "Failed to resolve the concentration save."
                    )
                );
            } else {
                setError(
                    caught instanceof Error
                        ? caught.message
                        : "Failed to resolve the concentration save."
                );
            }
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="pa-input-handler">
            <div className="pa-input-handler__title">Concentration Check</div>

            <div className="pa-input-handler__target-block">
                <div className="pa-input-handler__target-name">
                    {activeCheck.name ?? activeCheck.cid}
                </div>

                <p className="pa-input-handler__helper">
                    Roll Needed: {activeCheck.dc} or higher
                </p>

                <div className="pa-input-handler__field">
                    <label className="pa-input-handler__field-label">
                        Constitution Save Total
                    </label>
                    <input
                        className="pa-input-handler__input form-control"
                        type="number"
                        value={roll}
                        disabled={submitting}
                        onChange={(event) => setRoll(event.target.value)}
                    />
                </div>
            </div>

            {checks.length > 1 && (
                <p className="pa-input-handler__helper pa-input-handler__helper--muted">
                    {checks.length - 1} additional concentration check
                    {checks.length - 1 === 1 ? "" : "s"} queued.
                </p>
            )}

            {error && <p className="pa-input-handler__error">{error}</p>}

            <div className="pa-input-handler__actions">
                <button
                    type="button"
                    className="pa-input-handler__btn pa-input-handler__btn--submit"
                    disabled={submitting}
                    onClick={() => void submitCheck()}
                >
                    {submitting ? "Resolving…" : "Resolve Save"}
                </button>
            </div>
        </div>
    );
}