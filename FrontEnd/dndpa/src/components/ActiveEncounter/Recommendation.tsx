import {
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { recommendationGet } from "../../api/ActionRecommend";
import type {
  Recommendation as RecommendationType,
  RecommendationAoeTarget,
  RecommendationTarget,
  AoeToken,
} from "../../types/SimulationTypes.ts";

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
    overallRank : number,
    base_weight : number,
    ml_weight : number,
    useML : boolean,
    final_weight : number,
    candidateCount : number,
    targets: RecommendationTarget,
    previewResultID?: string
  ) => void;
};

function isAoeTarget(
  target: RecommendationTarget
): target is RecommendationAoeTarget {
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
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const previewPrefix = `preview:recommendation:${cid}:`;

  const hasRecommendations = recommendations.length > 0;
  const isPassTurnView = hasRecommendations && currentIndex === recommendations.length;
  const currentRecommendation =
    hasRecommendations && !isPassTurnView
      ? recommendations[currentIndex]
      : undefined;

  const activePreviewResultID = currentRecommendation
    ? `${previewPrefix}${currentIndex}`
    : "";

  const canGoLeft = hasRecommendations && currentIndex > 0;
  const canGoRight = hasRecommendations && currentIndex < recommendations.length;
  const canAccept = !!currentRecommendation;

  useEffect(() => {
    async function loadRecommendations() {
      try {
        setLoading(true);
        setError("");
        setCurrentIndex(0);

        const data = await recommendationGet(eid, cid);
        console.log("Recommendation data", data);
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

    if (!previewToken) {
      clearRecommendationPreviews();
      return;
    }

    setAoeTokens((prev) => {
      const withoutOldRecommendationPreviews = prev.filter(
        (token) => !token.resultID.startsWith(previewPrefix)
      );
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

  function handleBack() {
    if (!canGoLeft) return;
    setCurrentIndex((prev) => prev - 1);
  }

  function handleForward() {
    if (!canGoRight) return;
    setCurrentIndex((prev) => prev + 1);
  }

  function handleAccept() {
    if (!currentRecommendation) return;
    console.log("Accepting ", currentRecommendation)
    handlePASubmission(
        currentRecommendation.name,
        currentRecommendation.prob,
        currentRecommendation.eDam,
        currentRecommendation.impact,
        currentRecommendation.overallRank,
        currentRecommendation.base_weight,
        currentRecommendation.ml_weight,
        currentRecommendation.ml_weight !== null && currentRecommendation.ml_weight !== undefined,
        currentRecommendation.final_weight,
        recommendations.length,
        currentRecommendation.target,
        isAoeTarget(currentRecommendation.target) ? activePreviewResultID : undefined
    );
  }

  if (loading) return <div>Loading recommendations...</div>;
  if (error) return <div>Error: {error}</div>;

  let targetDisplay = "";

  if (currentRecommendation) {

    try {
      targetDisplay = Array.isArray(currentRecommendation.target)
        ? currentRecommendation.target.length > 0
          ? currentRecommendation.target.join(", ")
          : "None"
        : currentRecommendation.target.targetsHit.length > 0
            ? currentRecommendation.target.targetsHit.join(", ")
            : "AOE placement";
    } catch (e) {
      console.error("Recommendation targetDisplay error", e);
      targetDisplay = "None";
    }
  }


  const buttonStyle: React.CSSProperties = {
  width: "44px",
  height: "44px",
  minWidth: "44px",
  minHeight: "44px",
  border: "none",
  borderRadius: "8px",
  background: "rgba(255,255,255,0.10)",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "18px",
  color: "white",
};

return (
  <div
    style={{
      width: "min(460px, calc(100vw - 32px))",
      minHeight: "132px",
      boxSizing: "border-box",
      margin: "0 auto",
      padding: "16px 18px",
      color: "white",
      display: "grid",
      gridTemplateRows: "auto 44px",
      rowGap: "14px",
    }}
  >
    <div
      style={{
        width: "100%",
        minWidth: 0,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          fontWeight: 700,
          fontSize: "18px",
          lineHeight: 1.25,
          whiteSpace: "normal",
          overflowWrap: "anywhere",
          wordBreak: "break-word",
        }}
      >
        {currentRecommendation ? currentRecommendation.name : "No Viable Actions - Pass Turn"}
      </div>

      <div
        style={{
          marginTop: "6px",
          opacity: 0.9,
          fontSize: "16px",
          lineHeight: 1.35,
          whiteSpace: "normal",
          overflowWrap: "anywhere",
          wordBreak: "break-word",
        }}
      >
        Target: {targetDisplay}
      </div>
    </div>

    <div
      style={{
        height: "44px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "14px",
      }}
    >
      {canGoLeft && (
        <button
          type="button"
          onClick={handleBack}
          style={buttonStyle}
          aria-label="Previous recommendation"
        >
          ◀
        </button>
      )}

      {canAccept && (
        <button
          type="button"
          onClick={handleAccept}
          style={buttonStyle}
          aria-label="Accept recommendation"
        >
          ✅
        </button>
      )}

      {canGoRight && (
        <button
          type="button"
          onClick={handleForward}
          style={buttonStyle}
          aria-label="Next recommendation"
        >
          ▶
        </button>
      )}
    </div>
  </div>
);
}