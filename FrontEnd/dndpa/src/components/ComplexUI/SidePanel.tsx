import { useState} from "react";

import "./ShurimaPanel.css";

interface Champion {
    bg: string;
    icon: string;
}

interface Stat {
    label: string;
    value: string;
}

const champions: Champion[] = [
    { bg: "linear-gradient(135deg,#3d2a10,#6b4a1a)", icon: "🪖" },
    { bg: "linear-gradient(135deg,#0e1f35,#1a3a5a)", icon: "🐍" },
    { bg: "linear-gradient(135deg,#2a1a40,#4a2a70)", icon: "⚡" },
    { bg: "linear-gradient(135deg,#3d1a08,#7a3510)", icon: "🦎" },
    { bg: "linear-gradient(135deg,#2a1a10,#5a3a20)", icon: "👸" },
    { bg: "linear-gradient(135deg,#4a1a10,#8a3520)", icon: "🔥" },
    { bg: "linear-gradient(135deg,#1a1040,#3a2070)", icon: "🌙" },
    { bg: "linear-gradient(135deg,#1a2a10,#3a5520)", icon: "🐸" },
    { bg: "linear-gradient(135deg,#3a2a08,#6a5015)", icon: "🌀" },
];

const stats: Stat[] = [
    { label: "Governance:", value: "DIVINE EMPIRE" },
    { label: "Attitude towards magic:", value: "COVET" },
    { label: "Level of technology:", value: "UNKNOWN" },
    { label: "General environment:", value: "ARID DESERT" },
];

function Divider() {
    return (
        <div className="shurima-panel__divider">
            <div className="shurima-panel__divider-diamond" />
            <div className="shurima-panel__divider-line shurima-panel__divider-line--right" />
            <div className="shurima-panel__divider-diamond" />
            <div className="shurima-panel__divider-line shurima-panel__divider-line--left" />
            <div className="shurima-panel__divider-diamond" />
        </div>
    );
}

function ShurimaEmblem() {
    return (
        <svg
            className="shurima-panel__emblem"
            viewBox="0 0 80 80"
            xmlns="http://www.w3.org/2000/svg"
        >
            <defs>
                <radialGradient id="embGrad" cx="50%" cy="40%" r="55%">
                    <stop offset="0%" stopColor="#f0d090" />
                    <stop offset="60%" stopColor="#c8a96e" />
                    <stop offset="100%" stopColor="#7a5a28" />
                </radialGradient>
            </defs>
            <circle cx="40" cy="40" r="36" fill="none" stroke="url(#embGrad)" strokeWidth="2" opacity="0.6" />
            <g transform="translate(40,40)">
                <g stroke="#c8a96e" strokeWidth="1.2" opacity="0.7">
                    <line x1="0" y1="-34" x2="0" y2="-24" />
                    <line x1="0" y1="34" x2="0" y2="24" />
                    <line x1="-34" y1="0" x2="-24" y2="0" />
                    <line x1="34" y1="0" x2="24" y2="0" />
                    <line x1="-24" y1="-24" x2="-17" y2="-17" />
                    <line x1="24" y1="-24" x2="17" y2="-17" />
                    <line x1="-24" y1="24" x2="-17" y2="17" />
                    <line x1="24" y1="24" x2="17" y2="17" />
                </g>
                <circle r="18" fill="#0f1828" stroke="#c8a96e" strokeWidth="1.5" />
                <polygon points="0,-11 10,7 -10,7" fill="none" stroke="#c8a96e" strokeWidth="1.5" strokeLinejoin="round" />
                <circle r="3" fill="#c8a96e" />
                <circle cx="0" cy="-20" r="2.5" fill="#c8a96e" />
                <line x1="-4" y1="-16" x2="4" y2="-16" stroke="#c8a96e" strokeWidth="1" />
            </g>
        </svg>
    );
}

export default function ShurimaPanel() {
    const [hoveredChamp, setHoveredChamp] = useState<number | null>(null);

    return (
        <div className="shurima-panel">
            <div className="shurima-panel__bg-glow" />

            {/* Back arrow */}
            <div className="shurima-panel__back-arrow">
                <svg width="14" height="14" viewBox="0 0 10 10" fill="none" stroke="#c8a96e" strokeWidth="1.8">
                    <path d="M7 1L3 5l4 4" />
                </svg>
            </div>

            {/* Header */}
            <div className="shurima-panel__header">
                <ShurimaEmblem />
                <div>
                    <div className="shurima-panel__faction-name">Shurima</div>
                    <div className="shurima-panel__faction-subtitle">Fallen Desert Empire</div>
                </div>
            </div>

            {/* Champion Icons */}
            <div className="shurima-panel__champ-row">
                {champions.map((c, i) => (
                    <div
                        key={i}
                        className="shurima-panel__champ-icon"
                        style={{ background: c.bg }}
                        onMouseEnter={() => setHoveredChamp(i)}
                        onMouseLeave={() => setHoveredChamp(null)}
                    >
                        {c.icon}
                    </div>
                ))}
            </div>

            <Divider />

            {/* Stats */}
            <div className="shurima-panel__stats-grid">
                {stats.map((s, i) => (
                    <div key={i}>
                        <div className="shurima-panel__stat-label">{s.label}</div>
                        <div className="shurima-panel__stat-value">{s.value}</div>
                    </div>
                ))}
            </div>

            <Divider />

            {/* Description */}
            <div className="shurima-panel__description">
                <p>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
                    dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip
                    ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore
                    eu fugiat nulla pariatur.
                </p>
                <a className="shurima-panel__learn-more">
                    Learn more about Shurima
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M1 9L9 1M9 1H3M9 1v6" />
                    </svg>
                </a>
            </div>

            <Divider />

            {/* Featured */}
            <div className="shurima-panel__featured-label">Featured in Shurima</div>
            <div className="shurima-panel__featured-card">
                <div className="shurima-panel__featured-art">🏺</div>
                <div className="shurima-panel__featured-text">
                    <div className="shurima-panel__featured-title">Life in Shurima</div>
                    <div className="shurima-panel__featured-sub">People of Shurima</div>
                </div>
            </div>

            <Divider />
            <div className="shurima-panel__spacer" />
        </div>
    );
}