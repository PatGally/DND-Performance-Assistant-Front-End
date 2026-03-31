import { useEffect, useState } from "react";
import {
  recommendationGet,
  type Recommendation as RecommendationType,
} from "../../api/ActionRecommend";

type RecommendationProps = {
  eid: string;
  cid: string;
};

export default function Recommendation({ eid, cid }: RecommendationProps) {
  const [recommendations, setRecommendations] = useState<RecommendationType[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [showPassTurn, setShowPassTurn] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    async function loadRecommendations() {
      try {
        setLoading(true);
        setError("");
        setCurrentIndex(0);
        setShowPassTurn(false);

        const data = await recommendationGet(eid, cid);
        setRecommendations(data);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Failed to load recommendations.");
        }
      } finally {
        setLoading(false);
      }
    }

    loadRecommendations();
  }, [eid, cid]);

  function handleReject() {
    if (currentIndex < recommendations.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setShowPassTurn(true);
    }
  }

  function handleAccept() {
    // Do nothing for now
  }

  if (loading) {
    return <div>Loading recommendations...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (showPassTurn || recommendations.length === 0) {
    return (
      <div
        style={{
          border: "1px solid #ccc",
          borderRadius: "6px",
          padding: "10px 12px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div><strong>Pass Turn</strong></div>
      </div>
    );
  }

  const currentRecommendation = recommendations[currentIndex];

  return (
    <div
      style={{
        border: "1px solid #ccc",
        borderRadius: "6px",
        padding: "10px 12px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "12px",
      }}
    >
      <div style={{ flex: 1 }}>
        <div><strong>{currentRecommendation.name}</strong></div>
        <div>
          Target:{" "}
          {currentRecommendation.target?.length
            ? currentRecommendation.target.join(", ")
            : "None"}
        </div>
      </div>

      <div style={{ display: "flex", gap: "8px" }}>
        <button
          type="button"
          onClick={handleAccept}
          style={{
            border: "1px solid #ccc",
            borderRadius: "4px",
            background: "white",
            cursor: "pointer",
            padding: "6px 10px",
          }}
          aria-label="Accept recommendation"
        >
          ✅
        </button>

        <button
          type="button"
          onClick={handleReject}
          style={{
            border: "1px solid #ccc",
            borderRadius: "4px",
            background: "white",
            cursor: "pointer",
            padding: "6px 10px",
          }}
          aria-label="Reject recommendation"
        >
          ❌
        </button>
      </div>
    </div>
  );
}