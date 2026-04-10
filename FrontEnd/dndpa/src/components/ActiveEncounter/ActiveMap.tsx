import { useEffect, useMemo, useState } from "react";
import {ArtificerToken, BarbarianToken, BardToken, ClericToken, DruidToken, FighterToken, MonkToken, PaladinToken,
    RangerToken, RogueToken, SorcererToken, WarlockToken, WizardToken, AberrationToken, BeastToken, CelestialToken,
    ConstructToken , DragonToken, ElementalToken, FeyToken, FiendToken, GiantToken, HumanoidToken, MonstrosityToken,
    OozeToken, PlantToken, UndeadToken} from "../../assets/importTokens.ts"

type GridCoord = [number, number];
type PlayerLike = {
    stats: {
        cid: string;
        name: string;
        position: GridCoord[];
        [key: string]: unknown;
    };
    [key: string]: unknown;
};
type MonsterLike = {
    cid: string;
    name: string;
    position: GridCoord[];
    [key: string]: unknown;
};
type CreatureToken = {
    cid: string;
    token_image: string;
};
type AoeToken = {
    tid: string;
    cid: string;
    resultID: number;
    name: string;
    shape: {
        type: string;
        radiusCells?: number;
    };
    anchor: {
        x: number;
        y: number;
    };
    timing: string;
};
type MapImage = {
    mapLink: string;
    sourceType: string;
    originPx: { x: number; y: number };
    naturalSizePx: { w: number; h: number };
};
type EncounterMapData = {
    map: MapImage;
    grid: {
        cellBounds: {
            cols: number;
            rows: number;
        };
        cellSizePx: number;
    };
    layers: {
        creatureTokens: CreatureToken[];
        aoeTokens: AoeToken[];
    };
};
type EncounterLike = {
    completed: boolean;
    mapdata: EncounterMapData;
    players: PlayerLike[];
    monsters: MonsterLike[];
};
type ActiveMapProps = {
    encounter: EncounterLike;
    manualMode: boolean;
    encStart: boolean;
    activeEncounter: boolean;
    selectedCID: string | null;
    onTokenSelect: (cid: string) => void;
    onGridCellClick: (x: number, y: number) => void;
    onMapSizeLoaded: (width: number, height: number) => void;
};
type ResolvedCreature = {
    cid: string;
    name: string;
    position: GridCoord[];
};
const tokenAssetMap: Record<string, string> = {
    "Artificer.png": ArtificerToken,
    "Barbarian.png": BarbarianToken,
    "Bard.png": BardToken,
    "Cleric.png": ClericToken,
    "Druid.png": DruidToken,
    "Fighter.png": FighterToken,
    "Monk.png": MonkToken,
    "Paladin.png": PaladinToken,
    "Ranger.png": RangerToken,
    "Rogue.png": RogueToken,
    "Sorcerer.png": SorcererToken,
    "Warlock.png": WarlockToken,
    "Wizard.png": WizardToken,
    "Abberation.png": AberrationToken,
    "Beast.png": BeastToken,
    "Celestial.png": CelestialToken,
    "Construct.png": ConstructToken,
    "Dragon.png": DragonToken,
    "Elemental.png": ElementalToken,
    "Fey.png": FeyToken,
    "Fiend.png": FiendToken,
    "Giant.png": GiantToken,
    "Humanoid.png": HumanoidToken,
    "Monstrosity.png": MonstrosityToken,
    "Ooze.png": OozeToken,
    "Plant.png": PlantToken,
    "Undead.png": UndeadToken,
};

function isPlayerCreature(creature: PlayerLike | MonsterLike): creature is PlayerLike {
    return "stats" in creature;
}
function getCreatureCid(creature: PlayerLike | MonsterLike): string {
    if (isPlayerCreature(creature)) {
        return creature.stats.cid ?? "";
    }
    return creature.cid;
}
function getCreatureName(creature: PlayerLike | MonsterLike): string {
    if (isPlayerCreature(creature)) {
        return creature.stats?.name ?? "Unknown Player";
    }
    return creature.name ?? "Unknown Monster";
}
function getCreaturePosition(creature: PlayerLike | MonsterLike): GridCoord[] {
    if (isPlayerCreature(creature)) {
        return normalizePosition(creature.stats.position ?? []);
    }
    return normalizePosition(creature.position ?? []);
}
function resolveTokenImage(tokenImage: string): string {
    if (!tokenImage) return "";

    // Already a real runtime path or full URL
    if (
        tokenImage.startsWith("http://") ||
        tokenImage.startsWith("https://") ||
        tokenImage.startsWith("data:")
    ) {
        return tokenImage;
    }

    if (/^[A-Za-z0-9_-]{20,}$/.test(tokenImage)) {
        return `https://drive.google.com/uc?export=view&id=${tokenImage}`;
    }

    // Convert /src/assets/.../Humanoid.png -> Humanoid.png
    const filename = tokenImage.split("/").pop() ?? "";
    return tokenAssetMap[filename] ?? tokenImage;
}
function normalizePosition(position: unknown): GridCoord[] {
    if (!Array.isArray(position) || position.length === 0) return [];

    // Case: [x, y]
    if (
        position.length === 2 &&
        typeof position[0] === "number" &&
        typeof position[1] === "number"
    ) {
        return [position as GridCoord];
    }

    // Case: [[x, y], [x2, y2]]
    return position.filter(
        (p): p is GridCoord =>
            Array.isArray(p) &&
            p.length === 2 &&
            typeof p[0] === "number" &&
            typeof p[1] === "number"
    );
}
function normalizeCreatures(encounter: EncounterLike): Record<string, ResolvedCreature> {
    const allCreatures = [...(encounter.players ?? []), ...(encounter.monsters ?? [])];
    const byCid: Record<string, ResolvedCreature> = {};

    for (const creature of allCreatures) {
        const cid = getCreatureCid(creature);
        if (!cid) continue;
        byCid[cid] = {
            cid,
            name: getCreatureName(creature),
            position: getCreaturePosition(creature),
        };
    }
    return byCid;
}

function clamp(n: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, n));
}

export default function ActiveMap({
                                      encounter,
                                      selectedCID,
                                      onTokenSelect,
                                      onGridCellClick,
                                      onMapSizeLoaded,
                                  }: ActiveMapProps) {

    const mapdata = encounter.mapdata;
    const grid = mapdata.grid;
    const layers = mapdata.layers;

    const cols = grid.cellBounds.cols ?? 0;
    const rows = grid.cellBounds.rows ?? 0;

    const mapRoot = mapdata.map;
    const rawMapLink = mapRoot.mapLink ?? "";
    const mapLink = resolveTokenImage(rawMapLink);

    const [mapSize, setMapSize] = useState<{ width: number; height: number } | null>(null);

    useEffect(() => {
        if (!mapLink) return;
        setMapSize(null);
        const img = new Image();
        img.onload = () => {
            setMapSize({ width: img.naturalWidth, height: img.naturalHeight });
            onMapSizeLoaded(img.naturalWidth, img.naturalHeight); // added this line
        };
        img.onerror = () => {
            console.error("Failed to load map image, falling back to grid dimensions");
            setMapSize({ width: cols * 64, height: rows * 64 });
        };
        img.src = mapLink;
    }, [mapLink, cols, rows, onMapSizeLoaded]);

    const creaturesByCid = useMemo(() => normalizeCreatures(encounter), [encounter]);

    const creatureTokens = useMemo(() => {
        const seen = new Set<string>();
        return (layers.creatureTokens ?? []).filter((token) => {
            if (seen.has(token.cid)) {
                console.warn(`Duplicate creatureToken cid filtered: ${token.cid}`);
                return false;
            }
            seen.add(token.cid);
            return true;
        });
    }, [layers.creatureTokens]);

    const aoeTokens = layers.aoeTokens ?? [];

    function handleTokenClick(cid: string) {
        onTokenSelect(cid);
    }

    if (!mapdata || !mapLink || cols <= 0 || rows <= 0) {
        return <div>No active map data found.</div>;
    }

    if (!mapSize) {
        return (
            <div style={{ color: "#aaa", padding: 24, background: "#111", borderRadius: 8 }}>
                Loading map...
            </div>
        );
    }

    const mapWidth  = mapSize.width;
    const mapHeight = mapSize.height;
    const cellWidth  = mapWidth  / cols;
    const cellHeight = mapHeight / rows;

    return (
        <div
            style={{
                position: "relative",
                width: mapWidth,
                height: mapHeight,
                flexShrink: 0,
                border: "1px solid #666",
                borderRadius: "8px",
                overflow: "hidden",
                background: "#111",
            }}
        >
            {/* Map image */}
            <img
                src={mapLink}
                alt="Encounter map"
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "fill",
                    display: "block",
                    userSelect: "none",
                    pointerEvents: "none",
                }}
            />

            {/* Grid overlay */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    display: "grid",
                    gridTemplateColumns: `repeat(${cols}, 1fr)`,
                    gridTemplateRows: `repeat(${rows}, 1fr)`,
                    pointerEvents: selectedCID ? "auto" : "none",
                }}
            >
                {Array.from({ length: cols * rows }).map((_, index) => {
                    const x = index % cols;
                    const y = Math.floor(index / cols);
                    return (
                        <div
                            key={index}
                            onClick={() => onGridCellClick(x, y)}
                            style={{
                                border: "1px solid rgba(255,255,255,0.25)",
                                boxSizing: "border-box",
                                cursor: selectedCID ? "pointer" : "default",
                                background: selectedCID ? "rgba(0,180,255,0.04)" : "transparent",
                            }}
                        />
                    );
                })}
            </div>

            {/* AOE tokens are here blow */}
            {aoeTokens.map((aoe) => {
                const anchorX = clamp(aoe.anchor.x, 0, cols - 1);
                const anchorY = clamp(aoe.anchor.y, 0, rows - 1);
                const radiusCells = aoe.shape.radiusCells ?? 1;
                const shapeType = (aoe.shape.type ?? "").toLowerCase();
                const centerX = (anchorX + 0.5) * cellWidth;
                const centerY = (anchorY + 0.5) * cellHeight;
                const size = radiusCells * 2 * Math.min(cellWidth, cellHeight);
                return (
                    <div
                        key={aoe.tid}
                        title={`${aoe.name} (${aoe.timing})`}
                        style={{
                            position: "absolute",
                            left: centerX - size / 2,
                            top: centerY - size / 2,
                            width: size,
                            height: size,
                            borderRadius: shapeType === "circle" ? "50%" : undefined,
                            background: shapeType === "circle" ? "rgba(255,80,80,0.20)" : "rgba(255,180,80,0.20)",
                            border: shapeType === "circle" ? "2px solid rgba(255,80,80,0.75)" : "2px solid rgba(255,180,80,0.75)",
                            boxSizing: "border-box",
                            pointerEvents: "none",
                        }}
                    />
                );
            })}

            {creatureTokens.map((token) => {
                const creature = creaturesByCid[token.cid];
                if (!creature || creature.position.length === 0) return null;

                const resolvedSrc = resolveTokenImage(token.token_image);
                if (!resolvedSrc) return null;

                const xs = creature.position.map(([x]) => x);
                const ys = creature.position.map(([, y]) => y);
                const minX = Math.max(0, Math.min(...xs));
                const maxX = Math.min(cols - 1, Math.max(...xs));
                const minY = Math.max(0, Math.min(...ys));
                const maxY = Math.min(rows - 1, Math.max(...ys));

                return (
                    <img
                        key={token.cid}
                        src={resolvedSrc}
                        alt={creature.name}
                        title={`${creature.name} (${maxX - minX + 1}x${maxY - minY + 1})`}
                        onClick={() => handleTokenClick(token.cid)}
                        onError={() => console.error("Failed to load token image", token.cid)}
                        style={{
                            position: "absolute",
                            left: minX * cellWidth,
                            top: minY * cellHeight,
                            width: (maxX - minX + 1) * cellWidth,
                            height: (maxY - minY + 1) * cellHeight,
                            objectFit: "contain",
                            zIndex: 3,
                            userSelect: "none",
                            pointerEvents: "auto",
                            cursor: "pointer",
                            filter: selectedCID === token.cid
                                ? "drop-shadow(0 0 8px rgba(0,255,255,0.95))"
                                : "drop-shadow(0 1px 2px rgba(0,0,0,0.7))",
                        }}
                    />
                );
            })}
        </div>
    );
}
