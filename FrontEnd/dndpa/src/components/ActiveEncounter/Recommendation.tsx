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

import '../../css/Recommendation.css'

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
        return <div className="pa-recommendation__status">Loading recommendations...</div>;
    }

    if (error) {
        return <div className="pa-recommendation__status pa-recommendation__status--error">Error: {error}</div>;
    }

    let targetDisplay = '';

    if (currentRecommendation) {
        try {
            targetDisplay = Array.isArray(currentRecommendation.target)
                ? currentRecommendation.target.length > 0
                    ? currentRecommendation.target.join(', ')
                    : 'None'
                : currentRecommendation.target.targetsHit.length > 0
                    ? currentRecommendation.target.targetsHit.join(', ')
                    : 'AOE placement';
        } catch (e) {
            console.error('Recommendation targetDisplay error', e);
            targetDisplay = 'None';
        }
    }

    return (
        <div className="pa-recommendation">
            <div className="pa-recommendation__body">
                <div className="pa-recommendation__name">
                    {currentRecommendation
                        ? currentRecommendation.name
                        : 'No Viable Actions - Pass Turn'}
                </div>

                <div className="pa-recommendation__target">
                    Target: {targetDisplay}
                </div>
            </div>

            <div className="pa-recommendation__actions">
                {canGoLeft && (
                    <button
                        type="button"
                        className="pa-recommendation__btn"
                        onClick={handleBack}
                        aria-label="Previous recommendation"
                    >
                        ◀
                    </button>
                )}

                {canAccept && (
                    <button
                        type="button"
                        className="pa-recommendation__btn pa-recommendation__btn--accept"
                        onClick={handleAccept}
                        aria-label="Accept recommendation"
                    >
                        ✓
                    </button>
                )}

                {canGoRight && (
                    <button
                        type="button"
                        className="pa-recommendation__btn"
                        onClick={handleForward}
                        aria-label="Next recommendation"
                    >
                        ▶
                    </button>
                )}
            </div>
        </div>
    );
}