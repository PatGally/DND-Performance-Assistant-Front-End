// InitiativeList.tsx

import { useEffect, useState } from "react";
import initiativeGet from "../../api/InitiativeGet";
import SimpleInitiativeEntry from "./SimpleInitiativeEntry";
import ComplexInitiativeEntry from "./ComplexInitiativeEntry";

export type InitiativeEntry = {
  name: string;
  iValue: number;
  turnType: string;
  currentTurn: boolean;
  actionResource: number;
  bonusActionResource: number;
  movementResource: number;
  hp: number;
  maxhp: number;
  ac: number;
  cid: string;
};

type InitiativeListProps = {
  eid: string;
};

export default function InitiativeList({ eid }: InitiativeListProps) {
  const [initiative, setInitiative] = useState<InitiativeEntry[]>([]);
  const [expandedCid, setExpandedCid] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

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
    setExpandedCid((prev) => (prev === cid ? null : cid));
  }

  if (loading) {
    return <div>Loading initiative...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (initiative.length === 0) {
    return <div>No initiative entries found.</div>;
  }

  return (
    <div style={{ width: "100%" }}>
      {initiative.map((entry) => {
        const isExpanded = expandedCid === entry.cid;

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