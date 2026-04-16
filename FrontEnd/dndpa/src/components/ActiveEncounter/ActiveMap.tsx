import { useEffect, useMemo, useState } from "react";
import {getAoeOverlayBox, getConeImageStyle, getLineImageStyle} from "../../utils/aoeHelpers.ts";
import {
  ArtificerToken,
  BarbarianToken,
  BardToken,
  ClericToken,
  DruidToken,
  FighterToken,
  MonkToken,
  PaladinToken,
  RangerToken,
  RogueToken,
  SorcererToken,
  WarlockToken,
  WizardToken,
  AberrationToken,
  BeastToken,
  CelestialToken,
  ConstructToken,
  DragonToken,
  ElementalToken,
  FeyToken,
  FiendToken,
  GiantToken,
  HumanoidToken,
  MonstrosityToken,
  OozeToken,
  PlantToken,
  UndeadToken,
} from "../../assets/importTokens.ts";

import {
  circleAcid,
  circleBludgeoning,
  circleCold,
  circleDefault,
  circleFire,
  circleForce,
  circleLightning,
  circleNecrotic,
  circlePiercing,
  circlePoison,
  circlePsychic,
  circleRadiant,
  circleSlashing,
  circleThunder,

  coneAcid,
  coneBludgeoning,
  coneCold,
  coneDefault,
  coneFire,
  coneForce,
  coneLightning,
  coneNecrotic,
  conePiercing,
  conePoison,
  conePsychic,
  coneRadiant,
  coneSlashing,
  coneThunder,

  cubeAcid,
  cubeBludgeoning,
  cubeCold,
  cubeDefault,
  cubeFire,
  cubeForce,
  cubeLightning,
  cubeNecrotic,
  cubePiercing,
  cubePoison,
  cubePsychic,
  cubeRadiant,
  cubeSlashing,
  cubeThunder,
} from "../../assets/aoe_tokens/importAoeTokens";

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
  name: string;
  positioning: GridCoord[];
  token_image: string;
  resultID: string;
  cid: string;
  anchor: GridCoord;
  timing: string;
  shape: string;
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
  };
};

type EncounterLike = {
  completed: boolean;
  mapdata: EncounterMapData;
  players: PlayerLike[];
  monsters: MonsterLike[];
};

type ResolvedCreature = {
  cid: string;
  name: string;
  position: GridCoord[];
};

type ActiveMapProps = {
  encounter: EncounterLike;
  aoeTokens: AoeToken[];
  manualMode: boolean;
  encStart: boolean;
  activeEncounter: boolean;
  selectedCID: string | null;
  isAoePlacementActive: boolean;
  onTokenSelect: (cid: string) => void;
  onGridCellClick: (x: number, y: number) => void;
  onGridCellHover: (x: number, y: number) => void;
  onMapSizeLoaded: (width: number, height: number) => void;
};

const creatureTokenAssetMap: Record<string, string> = {
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
const aoeTokenAssetMap: Record<string, string> = {
  "CircleAcid.png": circleAcid,
  "CircleBludgeoning.png": circleBludgeoning,
  "CircleCold.png": circleCold,
  "CircleDefault.png": circleDefault,
  "CircleFire.png": circleFire,
  "CircleForce.png": circleForce,
  "CircleLightning.png": circleLightning,
  "CircleNecrotic.png": circleNecrotic,
  "CirclePiercing.png": circlePiercing,
  "CirclePoison.png": circlePoison,
  "CirclePsychic.png": circlePsychic,
  "CircleRadiant.png": circleRadiant,
  "CircleSlashing.png": circleSlashing,
  "CircleThunder.png": circleThunder,

  "ConeAcid.png": coneAcid,
  "ConeBludgeoning.png": coneBludgeoning,
  "ConeCold.png": coneCold,
  "ConeDefault.png": coneDefault,
  "ConeFire.png": coneFire,
  "ConeForce.png": coneForce,
  "ConeLightning.png": coneLightning,
  "ConeNecrotic.png": coneNecrotic,
  "ConePiercing.png": conePiercing,
  "ConePoison.png": conePoison,
  "ConePsychic.png": conePsychic,
  "ConeRadiant.png": coneRadiant,
  "ConeSlashing.png": coneSlashing,
  "ConeThunder.png": coneThunder,

  "CubeAcid.png": cubeAcid,
  "CubeBludgeoning.png": cubeBludgeoning,
  "CubeCold.png": cubeCold,
  "CubeDefault.png": cubeDefault,
  "CubeFire.png": cubeFire,
  "CubeForce.png": cubeForce,
  "CubeLightning.png": cubeLightning,
  "CubeNecrotic.png": cubeNecrotic,
  "CubePiercing.png": cubePiercing,
  "CubePoison.png": cubePoison,
  "CubePsychic.png": cubePsychic,
  "CubeRadiant.png": cubeRadiant,
  "CubeSlashing.png": cubeSlashing,
  "CubeThunder.png": cubeThunder,
};

//TODO: Use creatureHelpers.ts instead for these 4 helper methods
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

function resolveRuntimeImagePath(imagePath: string): string {
  if (!imagePath) return "";

  if (
    imagePath.startsWith("http://") ||
    imagePath.startsWith("https://") ||
    imagePath.startsWith("data:")
  ) {
    return imagePath;
  }

  if (/^[A-Za-z0-9_-]{20,}$/.test(imagePath)) {
    return `https://drive.google.com/uc?export=view&id=${imagePath}`;
  }

  return imagePath;
}
function resolveCreatureTokenImage(tokenImage: string): string {
  const runtimePath = resolveRuntimeImagePath(tokenImage);

  if (runtimePath !== tokenImage) {
    return runtimePath;
  }

  const filename = tokenImage.split("/").pop() ?? "";
  return creatureTokenAssetMap[filename] ?? tokenImage;
}
function resolveAoeTokenImage(tokenImage: string): string {
  const runtimePath = resolveRuntimeImagePath(tokenImage);

  if (runtimePath !== tokenImage) {
    return runtimePath;
  }

  const filename = tokenImage.split("/").pop() ?? "";
  return aoeTokenAssetMap[filename] ?? aoeTokenAssetMap["CubeDefault.png"] ?? tokenImage;
}

function normalizePosition(position: unknown): GridCoord[] {
  if (!Array.isArray(position) || position.length === 0) return [];

  if (
    position.length === 2 &&
    typeof position[0] === "number" &&
    typeof position[1] === "number"
  ) {
    return [position as GridCoord];
  }

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

function getAoeFallbackFill(shape: string): string {
  switch ((shape ?? "").toLowerCase()) {
    case "line":
      return "rgba(180, 80, 255, 0.35)"
    case "cone":
      return "rgba(255, 180, 80, 0.35)";
    case "circle":
      return "rgba(255, 80, 80, 0.35)";
    default:
      return "rgba(80, 180, 255, 0.35)";
  }
}
function getAoeBorder(shape: string): string {
  switch ((shape ?? "").toLowerCase()) {
    case "line":
      return "1px solid rgba(80, 180, 255, 0.8)";
    case "cone":
      return "1px solid rgba(255, 180, 80, 0.8)";
    case "circle":
      return "1px solid rgba(255, 80, 80, 0.8)";
    default:
      return "1px solid rgba(180, 80, 255, 0.8)";
  }
}

export default function ActiveMap({
  encounter,
  aoeTokens,
  selectedCID,
    isAoePlacementActive,
  onTokenSelect,
  onGridCellClick,
    onGridCellHover,
  onMapSizeLoaded,
}: ActiveMapProps) {
  const mapdata = encounter.mapdata;
  const grid = mapdata.grid;
  const layers = mapdata.layers;

  const cols = grid.cellBounds.cols ?? 0;
  const rows = grid.cellBounds.rows ?? 0;

  const mapRoot = mapdata.map;
  const rawMapLink = mapRoot.mapLink ?? "";
  const mapLink = resolveRuntimeImagePath(rawMapLink);

  const [mapSize, setMapSize] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    if (!mapLink) return;

    const img = new Image();

    img.onload = () => {
        const width = img.naturalWidth;
        const height = img.naturalHeight;

        setMapSize((prev) => {
            if (prev && prev.width === width && prev.height === height) {
                return prev;
            }
            return { width, height };
        });

        onMapSizeLoaded(width, height);
    };
    img.onerror = () => {
        console.error("Failed to load map image, falling back to grid dimensions");
        const fallback = { width: cols * 64, height: rows * 64 };

        setMapSize((prev) => {
            if (prev && prev.width === fallback.width && prev.height === fallback.height) {
                return prev;
            }
            return fallback;
        });
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

  const mapWidth = mapSize.width;
  const mapHeight = mapSize.height;
  const cellWidth = mapWidth / cols;
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
        background: "#1111",
      }}
    >
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

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
          pointerEvents: selectedCID || isAoePlacementActive ? "auto" : "none",
        }}
      >
        {Array.from({ length: cols * rows }).map((_, index) => {
          const x = index % cols;
          const y = Math.floor(index / cols);

          return (
            <div
              key={index}
              onDoubleClick={() => onGridCellClick(x, y)}
              onMouseEnter={() => onGridCellHover(x, y)}
              style={{
                border: "1px solid rgba(255,255,255,0.25)",
                boxSizing: "border-box",
                cursor: selectedCID || isAoePlacementActive ? "pointer" : "default",
                background: isAoePlacementActive
                  ? "rgba(255,180,0,0.04)"
                  : selectedCID
                    ? "rgba(0,180,255,0.04)"
                    : "transparent",
              }}
            />
          );
        })}
      </div>

      {aoeTokens.map((aoe) => {
  const cells = normalizePosition(aoe.positioning);
  if (cells.length === 0) return null;

  const overlaySrc = resolveAoeTokenImage(aoe.token_image);
  const overlayBox = getAoeOverlayBox(aoe, cells, cellWidth, cellHeight);
  const coneImageStyle = getConeImageStyle(aoe, cells, cellWidth, cellHeight);
  const isCone = (aoe.shape ?? "").toLowerCase() === "cone";
  const lineImageStyle = getLineImageStyle(aoe, cells, cellWidth, cellHeight);
  const isLine = (aoe.shape ?? "").toLowerCase() === "line";

  const localCellSet = new Set(
    cells.map(([x, y]) => `${x - overlayBox.minX},${y - overlayBox.minY}`)
  );

  const anchorLocalX = aoe.anchor[0] - overlayBox.minX;
  const anchorLocalY = aoe.anchor[1] - overlayBox.minY;

  return (
    <div key={aoe.resultID}>
      {overlaySrc && isCone && coneImageStyle && (
        <div style={coneImageStyle}>
          <img
            src={overlaySrc}
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "fill",
              opacity: 0.35,
              userSelect: "none",
              pointerEvents: "none",
            }}
            onError={(event) => {
              (event.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      )}

      {overlaySrc && isLine && lineImageStyle && (
          <div style={lineImageStyle}>
            <img
              src={overlaySrc}
              alt=""
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "fill",
                opacity: 0.35,
                userSelect: "none",
                pointerEvents: "none",
              }}
              onError={(event) => {
                (event.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        )}

      <div
        title={`${aoe.name} (${aoe.timing})`}
        style={{
          position: "absolute",
          left: overlayBox.left,
          top: overlayBox.top,
          width: overlayBox.width,
          height: overlayBox.height,
          borderRadius: overlayBox.borderRadius,
          overflow: "hidden",
          zIndex: 2,
          pointerEvents: "none",
        }}
      >
        {overlaySrc && !isCone && !isLine && (
          <img
            src={overlaySrc}
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "fill",
              opacity: 0.35,
              userSelect: "none",
              pointerEvents: "none",
            }}
            onError={(event) => {
              (event.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        )}

        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            gridTemplateColumns: `repeat(${overlayBox.widthCells}, 1fr)`,
            gridTemplateRows: `repeat(${overlayBox.heightCells}, 1fr)`,
          }}
        >
          {Array.from({
            length: overlayBox.widthCells * overlayBox.heightCells,
          }).map((_, index) => {
            const localX = index % overlayBox.widthCells;
            const localY = Math.floor(index / overlayBox.widthCells);
            const isUsedCell = localCellSet.has(`${localX},${localY}`);
            const isAnchorCell =
              localX === anchorLocalX && localY === anchorLocalY;

            return (
              <div
                key={`${aoe.resultID}-cell-${index}`}
                style={{
                  boxSizing: "border-box",
                  background: isAnchorCell
                    ? "rgba(0,255,255,0.28)"
                    : isUsedCell
                      ? overlaySrc
                        ? "rgba(255,255,255,0.08)"
                        : getAoeFallbackFill(aoe.shape)
                      : "transparent",
                  border: isAnchorCell
                    ? "2px solid rgba(0,255,255,0.95)"
                    : isUsedCell
                      ? getAoeBorder(aoe.shape)
                      : "none",
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
})}

      {creatureTokens.map((token) => {
        const creature = creaturesByCid[token.cid];
        if (!creature || creature.position.length === 0) return null;

        const resolvedSrc = resolveCreatureTokenImage(token.token_image);
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
              pointerEvents: isAoePlacementActive ? "none" : "auto",
              cursor: isAoePlacementActive ? "default" : "pointer",
              filter:
                selectedCID === token.cid
                  ? "drop-shadow(0 0 8px rgba(0,255,255,0.95))"
                  : "drop-shadow(0 1px 2px rgba(0,0,0,0.7))",
            }}
          />
        );
      })}
    </div>
  );
}