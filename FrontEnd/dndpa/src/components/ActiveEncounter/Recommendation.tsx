import { useEffect, useState } from "react";
import {
  recommendationGet,
  type Recommendation as RecommendationType,
} from "../../api/ActionRecommend";

type RecommendationProps = {
  eid: string;
  cid: string;
  handlePASubmission: (name: string, prob: number,
                       eDam: number, impact: number, targets: string[]) => void;
};

export default function Recommendation({ eid, cid, handlePASubmission }: RecommendationProps) {
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
        setRecommendations(Array.isArray(data) ? data : []);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Failed to load recommendations.");
        }
        setRecommendations([]);
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
      const name = currentRecommendation.name;
      const prob = currentRecommendation.prob;
      const eDam = currentRecommendation.eDam;
      const impact = currentRecommendation.impact;
      const targets = currentRecommendation.target;
    handlePASubmission(name, prob, eDam, impact, targets)
  }

  if (loading) {
    return <div>Loading recommendations...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (showPassTurn || recommendations.length === 0 || currentIndex >= recommendations.length) {
    return (
      <div
        style={{
          border: "none",
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

  if (!currentRecommendation) {
    return (
        <div
            style={{
                border: "none",
                padding: "10px 12px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                color: "white",
            }}
        >
            <div>
                <strong>Pass Turn</strong>
            </div>
        </div>
    );
  }

  return (
      <div
          style={{
              border: "none",
              padding: "10px 12px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
              color: "white",
          }}
      >
          <div style={{ flex: 1 }}>
              <div><strong>{currentRecommendation.name}</strong></div>
              <div style={{ opacity: 0.8 }}>
                  Target:{" "}
                  {Array.isArray(currentRecommendation.target) && currentRecommendation.target.length > 0
                      ? currentRecommendation.target.join(", ")
                      : "None"}
              </div>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
              <button
                  type="button"
                  onClick={handleAccept}
                  style={{
                      border: "none",
                      background: "rgba(255,255,255,0.1)",
                      cursor: "pointer",
                      padding: "6px 10px",
                      borderRadius: "6px",
                      backdropFilter: "blur(4px)",
                  }}
                  aria-label="Accept recommendation"
              >
                  ✅
              </button>

              <button
                  type="button"
                  onClick={handleReject}
                  style={{
                      border: "none",
                      background: "rgba(255,255,255,0.1)",
                      cursor: "pointer",
                      padding: "6px 10px",
                      borderRadius: "6px",
                      backdropFilter: "blur(4px)",
                  }}
                  aria-label="Reject recommendation"
              >
                  ❌
              </button>
          </div>
      </div>
  );
}