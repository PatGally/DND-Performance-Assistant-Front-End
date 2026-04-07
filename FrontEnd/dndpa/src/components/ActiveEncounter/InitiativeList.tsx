import { useEffect, useState } from "react";
import initiativeGet from "../../api/InitiativeGet";
import SimpleInitiativeEntry from "./SimpleInitiativeEntry";
import ComplexInitiativeEntry from "./ComplexInitiativeEntry";
import ComplexManualEntry, {
  type ManualAffectedCreature,
} from "./ComplexManualEntry";
import type { InitiativeEntryDisplay } from "../../types/SimulationTypes.ts";

type ManualDraftState = {
  affectedCreatures: ManualAffectedCreature[];
};

type InitiativeListProps = {
  eid: string;
  manualMode?: boolean;
  expandedCid?: string | null;
  onExpandedCidChange?: (cid: string | null) => void;
  manualDraft?: ManualDraftState;
  onManualCreatureChange?: (next: ManualAffectedCreature) => void;
};

export default function InitiativeList({
  eid,
  manualMode = false,
  expandedCid,
  onExpandedCidChange,
  manualDraft,
  onManualCreatureChange,
}: InitiativeListProps) {
  const [initiative, setInitiative] = useState<InitiativeEntryDisplay[]>([]);
  const [localExpandedCid, setLocalExpandedCid] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const activeExpandedCid =
    manualMode && expandedCid !== undefined ? expandedCid : localExpandedCid;

  useEffect(() => {
    async function loadInitiative() {
      try {
        setLoading(true);
        setError("");
        const data = await initiativeGet(eid);
        setInitiative(data);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Failed to load initiative.");
        }
      } finally {
        setLoading(false);
      }
    }

    loadInitiative();
  }, [eid]);

  function toggleExpanded(cid: string) {
    const next = activeExpandedCid === cid ? null : cid;

    if (manualMode && onExpandedCidChange) {
      onExpandedCidChange(next);
      return;
    }

    setLocalExpandedCid(next);
  }

  if (loading) return <div>Loading initiative...</div>;
  if (error) return <div>Error: {error}</div>;
  if (initiative.length === 0) return <div>No initiative entries found.</div>;

  return (
    <div style={{ width: "100%" }}>
      {initiative.map((entry) => {
        const isExpanded = activeExpandedCid === entry.cid;
        const draftValue = manualDraft?.affectedCreatures.find(
          (creature) => creature.cid === entry.cid
        );

        return (
          <div
            key={entry.cid}
            style={{
              marginBottom: "10px",
            }}
          >
            {!isExpanded ? (
              <SimpleInitiativeEntry
                entry={entry}
                onToggle={() => toggleExpanded(entry.cid)}
              />
            ) : manualMode ? (
              <ComplexManualEntry
                eid={eid}
                cid={entry.cid}
                initiativeEntry={entry}
                onToggle={() => toggleExpanded(entry.cid)}
                draftValue={draftValue}
                onDraftChange={(next) => onManualCreatureChange?.(next)}
              />
            ) : (
              <ComplexInitiativeEntry
                eid={eid}
                cid={entry.cid}
                initiativeEntry={entry}
                onToggle={() => toggleExpanded(entry.cid)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}