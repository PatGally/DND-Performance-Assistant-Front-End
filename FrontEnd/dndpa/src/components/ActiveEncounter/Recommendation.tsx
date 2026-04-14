import {
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import {
  recommendationGet,
} from "../../api/ActionRecommend";
import type {Recommendation as RecommendationType, RecommendationAoeTarget,
    RecommendationTarget, AoeToken} from "../../types/SimulationTypes.ts";

type RecommendationProps = {
  eid: string;
  cid: string;
  setAoeTokens: Dispatch<SetStateAction<AoeToken[]>>;
  buildRecommendationAoeToken: (
    recommendation: RecommendationType,
    previewResultID: string
  ) => AoeToken | null;
  handlePASubmission: (
    name: string,
    prob: number,
    eDam: number,
    impact: number,
    targets: RecommendationTarget,
    previewResultID?: string
  ) => void;
};

function isAoeTarget(target: RecommendationTarget): target is RecommendationAoeTarget {
  console.log("Checking isAOE");
  return (
    !Array.isArray(target) &&
    typeof target === "object" &&
    target !== null &&
    Array.isArray((target as RecommendationAoeTarget).targetsHit) &&
    Array.isArray((target as RecommendationAoeTarget).positioning)
  );
}

export default function Recommendation({
  eid,
  cid,
  setAoeTokens,
  buildRecommendationAoeToken,
  handlePASubmission,
}: RecommendationProps) {
  const [recommendations, setRecommendations] = useState<RecommendationType[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [showPassTurn, setShowPassTurn] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const previewPrefix = `preview:recommendation:${cid}:`;
  const currentRecommendation = recommendations[currentIndex];
  const activePreviewResultID = currentRecommendation
    ? `${previewPrefix}${currentIndex}`
    : "";

  useEffect(() => {
    async function loadRecommendations() {
      try {
        setLoading(true);
        setError("");
        setCurrentIndex(0);
        setShowPassTurn(false);

        const data = await recommendationGet(eid, cid);
        console.log("Recommends: ", data);
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
  useEffect(() => {
    const clearRecommendationPreviews = () => {
      setAoeTokens((prev) => {
        const filtered = prev.filter(
          (token) => !token.resultID.startsWith(previewPrefix)
        );

        return filtered.length === prev.length ? prev : filtered;
      });
    };

    if (!currentRecommendation || !isAoeTarget(currentRecommendation.target)) {
      clearRecommendationPreviews();
      return;
    }

    const previewToken = buildRecommendationAoeToken(
      currentRecommendation,
      activePreviewResultID
    );
    console.log("previewToken", previewToken);
    if (!previewToken) {
      clearRecommendationPreviews();
      return;
    }

    setAoeTokens((prev) => {
      const withoutOldRecommendationPreviews = prev.filter(
        (token) => !token.resultID.startsWith(previewPrefix)
      );

      const existing = withoutOldRecommendationPreviews.find(
        (token) => token.resultID === activePreviewResultID
      );

      if (
        existing &&
        JSON.stringify(existing) === JSON.stringify(previewToken) &&
        withoutOldRecommendationPreviews.length === prev.length
      ) {
        return prev;
      }

      return [...withoutOldRecommendationPreviews, previewToken];
    });

    return () => {
      setAoeTokens((prev) => {
        const filtered = prev.filter(
          (token) => token.resultID !== activePreviewResultID
        );

        return filtered.length === prev.length ? prev : filtered;
      });
    };
  }, [
    currentRecommendation,
    activePreviewResultID,
    buildRecommendationAoeToken,
    previewPrefix,
    setAoeTokens,
  ]);

  function handleReject() {
    if (currentIndex < recommendations.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      return;
    }

    setAoeTokens((prev) =>
      prev.filter((token) => !token.resultID.startsWith(previewPrefix))
    );
    setShowPassTurn(true);
  }

  function handleAccept() {
    if (!currentRecommendation) return;

    handlePASubmission(
      currentRecommendation.name,
      currentRecommendation.prob,
      currentRecommendation.eDam,
      currentRecommendation.impact,
      currentRecommendation.target,
      isAoeTarget(currentRecommendation.target) ? activePreviewResultID : undefined
    );
  }

  if (loading) {
    return <div>Loading recommendations...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (
    showPassTurn ||
    recommendations.length === 0 ||
    currentIndex >= recommendations.length
  ) {
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
        <div>
          <strong>Pass Turn</strong>
        </div>
      </div>
    );
  }

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

  const targetDisplay = Array.isArray(currentRecommendation.target)
    ? currentRecommendation.target.length > 0
      ? currentRecommendation.target.join(", ")
      : "None"
    : currentRecommendation.target.targetsHit.length > 0
      ? currentRecommendation.target.targetsHit.join(", ")
      : "AOE placement";

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
        <div>
          <strong>{currentRecommendation.name}</strong>
        </div>
        <div style={{ opacity: 0.8 }}>Target: {targetDisplay}</div>
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