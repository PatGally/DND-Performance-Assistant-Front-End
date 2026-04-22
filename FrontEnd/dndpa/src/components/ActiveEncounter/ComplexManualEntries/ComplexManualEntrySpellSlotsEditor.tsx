import { useMemo } from "react";
import '../../../css/ManualEntry.css';
import ComplexManualEntrySection from "./ComplexManualEntrySection";
import {
    serializeSpellSlots,
    toInteger,
} from "../../../utils/ActiveSimUtils/ManualEntryHelpers.ts";
import type { SpellSlotRow } from "../../../types/ManualEntryTypes.ts";

export default function ComplexManualEntrySpellSlotsEditor({
                                                               value,
                                                               maxSlots,
                                                               onChange,
                                                           }: {
    value: SpellSlotRow[];
    maxSlots: SpellSlotRow[];
    onChange: (next: SpellSlotRow[]) => void;
}) {
    const LEVEL_COUNT = Math.max(9, value.length, maxSlots.length);

    const rows = useMemo(() => {
        return Array.from({ length: LEVEL_COUNT }, (_, index) => {
            const current = value[index]?.[0] ?? 0;
            const max = maxSlots[index]?.[1] ?? value[index]?.[1] ?? 0;
            return { current, max };
        });
    }, [LEVEL_COUNT, value, maxSlots]);

    function updateRow(index: number, rawValue: string) {
        const parsedValue = toInteger(rawValue, 0);

        const nextRows = rows.map(
            (row): SpellSlotRow => [row.current, row.max]
        );

        const hiddenMax = rows[index]?.max ?? 0;
        nextRows[index] = [parsedValue, hiddenMax];

        onChange(serializeSpellSlots(nextRows));
    }

    return (
        <ComplexManualEntrySection title="Spell Slots">
            <div className="manual-entry-spell-grid">
                <span className="manual-entry-spell-header" >Level</span>
                <span className="manual-entry-spell-header">Slots</span>

                {rows.map((row, index) => (
                    <div
                        key={`spell-slot-${index}`}
                        className="manual-entry-spell-row"
                    >
                        <div className="manual-entry-spell-level" >{index + 1}</div>

                        <input
                            type="number"
                            min={0}
                            max={row.max}
                            value={row.current}
                            onChange={(e) => updateRow(index, e.target.value)}
                            className="manual-entry-input"
                        />
                    </div>
                ))}
            </div>
        </ComplexManualEntrySection>
    );
}