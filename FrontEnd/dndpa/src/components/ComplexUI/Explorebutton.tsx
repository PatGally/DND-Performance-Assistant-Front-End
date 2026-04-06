import "./ExploreButton.css";

// ── Scroll / ribbon SVG shape ────────────────────────────────────
// The classic parchment-scroll banner: flat centre band with
// curled triangular folds tucked behind each end.
function ScrollShape() {
    // Viewbox: 220 × 56
    // Main ribbon band  : full width, vertically centred
    // Left fold         : a triangular notch pointing inward on the left
    // Right fold        : mirrored on the right
    const w = 220;
    const h = 56;
    const foldW = 22;      // how deep the end-fold triangle is
    const bandTop = 10;    // y where the flat band starts
    const bandBot = h - 10;

    // ── Main scroll body (flat centre + pointed ends) ──────────────
    // Shape: rectangle with inward V-notches on each side
    const bodyPath = [
        `M ${foldW} ${bandTop}`,
        `L ${w - foldW} ${bandTop}`,
        `L ${w - foldW} ${bandTop}`,
        `L ${w} ${bandTop}`,
        `L ${w - foldW} ${h / 2}`,   // right notch tip
        `L ${w} ${bandBot}`,
        `L ${w - foldW} ${bandBot}`,
        `L ${foldW} ${bandBot}`,
        `L ${0} ${bandBot}`,
        `L ${foldW} ${h / 2}`,       // left notch tip
        `L ${0} ${bandTop}`,
        `L ${foldW} ${bandTop}`,
        "Z",
    ].join(" ");

    // ── Left shadow fold (bottom-left triangle tucked behind) ──────
    const leftFoldPath = [
        `M ${0} ${bandTop}`,
        `L ${foldW} ${h / 2}`,
        `L ${0} ${bandBot}`,
        "Z",
    ].join(" ");

    // ── Right shadow fold ──────────────────────────────────────────
    const rightFoldPath = [
        `M ${w} ${bandTop}`,
        `L ${w - foldW} ${h / 2}`,
        `L ${w} ${bandBot}`,
        "Z",
    ].join(" ");

    return (
        <svg
            className="explore-btn__scroll"
            viewBox={`0 0 ${w} ${h}`}
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
        >
            <defs>
                {/* Main body gradient: light cream top → warm mid */}
                <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#f7f0d0" />
                    <stop offset="45%"  stopColor="#ede0a8" />
                    <stop offset="100%" stopColor="#d4c47a" />
                </linearGradient>

                {/* Subtle inner highlight across the centre band */}
                <linearGradient id="shineGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="rgba(255,255,255,0.55)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                </linearGradient>

                {/* Fold shadow gradient */}
                <linearGradient id="foldGradL" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%"   stopColor="#8a7230" stopOpacity="0.55" />
                    <stop offset="100%" stopColor="#8a7230" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="foldGradR" x1="1" y1="0" x2="0" y2="0">
                    <stop offset="0%"   stopColor="#8a7230" stopOpacity="0.55" />
                    <stop offset="100%" stopColor="#8a7230" stopOpacity="0" />
                </linearGradient>

                {/* Drop shadow filter */}
                <filter id="scrollShadow" x="-8%" y="-20%" width="116%" height="140%">
                    <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="rgba(60,40,10,0.45)" />
                </filter>
            </defs>

            {/* Drop shadow layer */}
            <path d={bodyPath} fill="rgba(60,40,10,0.18)" transform="translate(0,4)" />

            {/* Main ribbon body */}
            <path d={bodyPath} fill="url(#bodyGrad)" filter="url(#scrollShadow)" />

            {/* Border stroke on body */}
            <path d={bodyPath} fill="none" stroke="#a8922a" strokeWidth="1.2" opacity="0.9" />

            {/* Shine highlight strip across top half */}
            <path d={bodyPath} fill="url(#shineGrad)" opacity="0.5" />

            {/* Left fold shadow */}
            <path d={leftFoldPath} fill="url(#foldGradL)" />
            {/* Left fold border */}
            <path d={leftFoldPath} fill="none" stroke="#a8922a" strokeWidth="0.8" opacity="0.6" />

            {/* Right fold shadow */}
            <path d={rightFoldPath} fill="url(#foldGradR)" />
            {/* Right fold border */}
            <path d={rightFoldPath} fill="none" stroke="#a8922a" strokeWidth="0.8" opacity="0.6" />
        </svg>
    );
}

// ── Button component ─────────────────────────────────────────────
interface ExploreButtonProps {
    label?: string;
    onClick?: () => void;
}

export function Explorebutton({
                                  label = "EXPLORE",
                                  onClick,
                              }: ExploreButtonProps) {
    return (
        <button className="explore-btn" onClick={onClick} type="button">
            <ScrollShape />
            <span className="explore-btn__label">{label}</span>
        </button>
    );
}

// ── Preview page ─────────────────────────────────────────────────
export default function ExploreButtonPreview() {
    return (
        <div className="explore-button-preview">
            <Explorebutton onClick={() => alert("Explore clicked!")} />
        </div>
    );
}