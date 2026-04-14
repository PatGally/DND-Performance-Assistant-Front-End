import type {GridCoord} from "../types/creature.ts";
import type {CreatureAction} from "../types/action.ts";
import type {RecommendationTarget, RecommendationAoeTarget} from "../types/SimulationTypes.ts";
import {isMonsterAction, isSpellAction} from "./ActionTypeChecker.ts";
import {type AoeToken} from "../types/SimulationTypes.ts";
export const DAMAGE_TYPE_IMAGE_SUFFIX: Record<string, string> = {
  acid: "Acid",
  bludgeoning: "Bludgeoning",
  cold: "Cold",
  fire: "Fire",
  force: "Force",
  lightning: "Lightning",
  necrotic: "Necrotic",
  piercing: "Piercing",
  poison: "Poison",
  psychic: "Psychic",
  radiant: "Radiant",
  slashing: "Slashing",
  thunder: "Thunder",
};
type PixelPoint = { //AOE logic type
  x: number;
  y: number;
};

export function getCellCenterPx(
  coord: GridCoord,
  cellWidth: number,
  cellHeight: number
): PixelPoint {
  return {
    x: (coord[0] + 0.5) * cellWidth,
    y: (coord[1] + 0.5) * cellHeight,
  };
}

export function getFarthestCellFromAnchor(anchor: GridCoord, cells: GridCoord[]): GridCoord {
  let farthest = cells[0];
  let bestDist = -1;

  for (const cell of cells) {
    const dx = cell[0] - anchor[0];
    const dy = cell[1] - anchor[1];
    const dist = dx * dx + dy * dy;

    if (dist > bestDist) {
      bestDist = dist;
      farthest = cell;
    }
  }

  return farthest;
}

export function getDirectionalImageStyle(
  aoe: AoeToken,
  cells: GridCoord[],
  cellWidth: number,
  cellHeight: number
): React.CSSProperties | null {
  const shape = (aoe.shape ?? "").toLowerCase();

  if (shape !== "cone" && shape !== "line") {
    return null;
  }

  if (cells.length === 0) {
    return null;
  }

  const anchor = aoe.anchor;
  const farthestCell = getFarthestCellFromAnchor(anchor, cells);

  const anchorPx = getCellCenterPx(anchor, cellWidth, cellHeight);
  const farthestPx = getCellCenterPx(farthestCell, cellWidth, cellHeight);

  const dx = farthestPx.x - anchorPx.x;
  const dy = farthestPx.y - anchorPx.y;

  const length = Math.sqrt(dx * dx + dy * dy);
  const angleRad = length === 0 ? 0 : Math.atan2(dy, dx);
  const ux = Math.cos(angleRad);
  const uy = Math.sin(angleRad);

  let maxForward = Math.max(cellWidth, cellHeight) * 0.5;
  let maxPerpendicular = Math.max(cellWidth, cellHeight) * 0.5;

  for (const cell of cells) {
    const center = getCellCenterPx(cell, cellWidth, cellHeight);
    const relX = center.x - anchorPx.x;
    const relY = center.y - anchorPx.y;

    const forward = relX * ux + relY * uy;
    const perpendicular = Math.abs(-relX * uy + relY * ux);

    maxForward = Math.max(maxForward, forward + cellWidth * 0.5);
    maxPerpendicular = Math.max(maxPerpendicular, perpendicular + cellHeight * 0.5);
  }

  const width = Math.max(cellWidth, maxForward);
  const height =
    shape === "line"
      ? Math.max(cellHeight, maxPerpendicular * 2)
      : Math.max(cellHeight, maxPerpendicular * 2);

  return {
    position: "absolute",
    left: anchorPx.x,
    top: anchorPx.y,
    width,
    height,
    transform: `translateY(-50%) rotate(${(angleRad * 180) / Math.PI}deg)`,
    transformOrigin: "0 50%",
    overflow: "visible",
    zIndex: 2,
    pointerEvents: "none",
  };
}

export function normalizeGridCoords(positioning: unknown): GridCoord[] {
  if (!Array.isArray(positioning)) return [];

  return positioning.filter(
    (coord): coord is GridCoord =>
      Array.isArray(coord) &&
      coord.length === 2 &&
      typeof coord[0] === "number" &&
      typeof coord[1] === "number"
  );
}

export function isRecommendationAoeTarget(
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

export function normalizeAoeShape(shape?: string): "line" | "cone" | "circle" | "square" {
  const value = (shape ?? "").toLowerCase();

  if (value.includes("line")) return "line";
  if (value.includes("cone")) return "cone";
  if (value.includes("circle") || value.includes("sphere") || value.includes("radius")) {
    return "circle";
  }
  if (value.includes("square") || value.includes("cube")) return "square";

  return "square";
}

export function findActionByName(
  name: string,
  actions?: CreatureAction[]
): CreatureAction | undefined {
  return actions?.find((action) =>
    (isSpellAction(action) ? action.spellname : action.name).toLowerCase() ===
    name.toLowerCase()
  );
}

export function extractActionDamageTypes(action: CreatureAction): string[] {
  if (isSpellAction(action)) {
    return (
      action.targeting?.flatMap((target) =>
        Array.isArray(target?.damType)
          ? target.damType.map((type) => String(type).toLowerCase())
          : []
      ) ?? []
    );
  }

  if (isMonsterAction(action)) {
    return Array.isArray(action.damType)
      ? action.damType.map((type) => String(type).toLowerCase())
      : [];
  }

  return action.properties?.damageType
    ? [String(action.properties.damageType).toLowerCase()]
    : [];
}

export function getAoeImageShapePrefix(shape: string): "Circle" | "Cone" | "Cube" {
  const normalized = (shape ?? "").toLowerCase();

  if (normalized === "circle") return "Circle";
  if (normalized === "cone") return "Cone";

  // square and line both use the cube art family
  return "Cube";
}

export function resolveAoeTokenImageName(
  action: CreatureAction,
  shape: string
): string {
  const shapePrefix = getAoeImageShapePrefix(shape);

  const rawDamageTypes = [...new Set(extractActionDamageTypes(action))];
  const normalizedDamageTypes = rawDamageTypes
    .map((type) => String(type).toLowerCase().trim())
    .filter(Boolean);

  const imageSuffix =
    normalizedDamageTypes.length === 1
      ? (DAMAGE_TYPE_IMAGE_SUFFIX[normalizedDamageTypes[0]] ?? "Default")
      : "Default";

  return `${shapePrefix}${imageSuffix}.png`;
}

export function extractActionTiming(action: CreatureAction): "instantaneous" | "lingering" {
  if (isSpellAction(action)) {
    const hasLingering = action.targeting?.some((target) => {
      const lingEffect = (target as { lingEffect?: unknown }).lingEffect;
      return (
        !!lingEffect &&
        typeof lingEffect === "object" &&
        Object.keys(lingEffect as Record<string, unknown>).length > 0
      );
    });

    return hasLingering ? "lingering" : "instantaneous";
  }

  if (isMonsterAction(action)) {
    const lingEffect = (action as { lingEffect?: unknown }).lingEffect;
    return lingEffect &&
      typeof lingEffect === "object" &&
      Object.keys(lingEffect as Record<string, unknown>).length > 0
      ? "lingering"
      : "instantaneous";
  }

  return "instantaneous";
}

export function getClosestAnchorToCaster(
  positioning: GridCoord[],
  casterPosition: GridCoord[]
): GridCoord {
  if (positioning.length === 0) return [0, 0];

  const origin = casterPosition[0] ?? positioning[0];

  let best = positioning[0];
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const coord of positioning) {
    const distance =
      Math.abs(coord[0] - origin[0]) + Math.abs(coord[1] - origin[1]);

    if (distance < bestDistance) {
      best = coord;
      bestDistance = distance;
    }
  }

  return best;
}

export function getAoeOverlayStyle(
  aoe: AoeToken,
  cells: GridCoord[],
  cellWidth: number,
  cellHeight: number
) {
  const { minX, maxX, minY, maxY } = getAoeBounds(cells);
  const shape = aoe.shape.toLowerCase();

  if (shape === "circle") {
    const left = (minX + 0.5) * cellWidth;
    const top = (minY + 0.5) * cellHeight;
    const width = Math.max(cellWidth, (maxX - minX) * cellWidth);
    const height = Math.max(cellHeight, (maxY - minY) * cellHeight);

    return {
      left,
      top,
      width,
      height,
      borderRadius: "50%",
      overflow: "hidden" as const,
    };
  }

  return {
    left: minX * cellWidth,
    top: minY * cellHeight,
    width: (maxX - minX + 1) * cellWidth,
    height: (maxY - minY + 1) * cellHeight,
      borderRadius: shape === "square" ? "0" : undefined,
      overflow: "hidden" as const,
  };
}

export function getAoeBounds(cells: GridCoord[]) {
  const xs = cells.map(([x]) => x);
  const ys = cells.map(([, y]) => y);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  return {
    minX,
    maxX,
    minY,
    maxY,
    widthCells: maxX - minX + 1,
    heightCells: maxY - minY + 1,
  };
}

export function getAoeOverlayBox(
  aoe: AoeToken,
  cells: GridCoord[],
  cellWidth: number,
  cellHeight: number
) {
  const { minX, maxX, minY, maxY, widthCells, heightCells } = getAoeBounds(cells);
  const shape = aoe.shape.toLowerCase();

  if (shape === "circle") {
    return {
      minX,
      minY,
      widthCells,
      heightCells,
      left: (minX + 0.5) * cellWidth,
      top: (minY + 0.5) * cellHeight,
      width: Math.max(cellWidth, (maxX - minX) * cellWidth),
      height: Math.max(cellHeight, (maxY - minY) * cellHeight),
      borderRadius: "50%",
    };
  }

  return {
    minX,
    minY,
    widthCells,
    heightCells,
    left: minX * cellWidth,
    top: minY * cellHeight,
    width: widthCells * cellWidth,
    height: heightCells * cellHeight,
    borderRadius: shape === "square" ? "0" : undefined,
  };
}

export function getAverageConeDirection(anchor: GridCoord, cells: GridCoord[]) {
  let sumDx = 0;
  let sumDy = 0;

  for (const [x, y] of cells) {
    const dx = x - anchor[0];
    const dy = y - anchor[1];

    if (dx === 0 && dy === 0) continue;

    sumDx += dx;
    sumDy += dy;
  }

  if (sumDx === 0 && sumDy === 0) {
    return { x: 1, y: 0 };
  }

  const mag = Math.sqrt(sumDx * sumDx + sumDy * sumDy);
  return {
    x: sumDx / mag,
    y: sumDy / mag,
  };
}

function getAverageDirection(anchor: GridCoord, cells: GridCoord[]) {
  let sumDx = 0;
  let sumDy = 0;

  for (const [x, y] of cells) {
    const dx = x - anchor[0];
    const dy = y - anchor[1];

    if (dx === 0 && dy === 0) continue;

    sumDx += dx;
    sumDy += dy;
  }

  if (sumDx === 0 && sumDy === 0) {
    return { x: 1, y: 0 };
  }

  const mag = Math.sqrt(sumDx * sumDx + sumDy * sumDy);
  return {
    x: sumDx / mag,
    y: sumDy / mag,
  };
}

export function getConeImageStyle(
  aoe: AoeToken,
  cells: GridCoord[],
  cellWidth: number,
  cellHeight: number
): React.CSSProperties | null {
  if ((aoe.shape ?? "").toLowerCase() !== "cone") {
    return null;
  }

  if (cells.length === 0) {
    return null;
  }

  const anchorPx = getCellCenterPx(aoe.anchor, cellWidth, cellHeight);
  const dir = getAverageDirection(aoe.anchor, cells);

  let maxForward = Math.max(cellWidth, cellHeight) * 0.5;
  let maxPerp = Math.max(cellWidth, cellHeight) * 0.5;

  for (const cell of cells) {
    const center = getCellCenterPx(cell, cellWidth, cellHeight);
    const relX = center.x - anchorPx.x;
    const relY = center.y - anchorPx.y;

    const forward = relX * dir.x + relY * dir.y;
    const perp = Math.abs(-relX * dir.y + relY * dir.x);

    maxForward = Math.max(maxForward, forward + cellWidth * 0.5);
    maxPerp = Math.max(maxPerp, perp + cellHeight * 0.5);
  }

  const angleDeg = (Math.atan2(dir.y, dir.x) * 180) / Math.PI;

  return {
    position: "absolute",
    left: anchorPx.x,
    top: anchorPx.y,
    width: maxForward,
    height: maxPerp * 2,
    transform: `translate(0, -50%) rotate(${angleDeg}deg)`,
    transformOrigin: "0 50%",
    zIndex: 2,
    pointerEvents: "none",
    overflow: "visible",
  };
}

export function getLineImageStyle(
  aoe: AoeToken,
  cells: GridCoord[],
  cellWidth: number,
  cellHeight: number
): React.CSSProperties | null {
  if ((aoe.shape ?? "").toLowerCase() !== "line") {
    return null;
  }

  if (cells.length === 0) {
    return null;
  }

  const anchorPx = getCellCenterPx(aoe.anchor, cellWidth, cellHeight);

  let farthestCell = cells[0];
  let bestDist = -1;

  for (const cell of cells) {
    const dx = cell[0] - aoe.anchor[0];
    const dy = cell[1] - aoe.anchor[1];
    const dist = dx * dx + dy * dy;

    if (dist > bestDist) {
      bestDist = dist;
      farthestCell = cell;
    }
  }

  const farthestPx = getCellCenterPx(farthestCell, cellWidth, cellHeight);
  const dirX = farthestPx.x - anchorPx.x;
  const dirY = farthestPx.y - anchorPx.y;

  const magnitude = Math.sqrt(dirX * dirX + dirY * dirY) || 1;
  const unitX = dirX / magnitude;
  const unitY = dirY / magnitude;
  const angleDeg = (Math.atan2(unitY, unitX) * 180) / Math.PI;

  let maxForward = Math.max(cellWidth, cellHeight) * 0.5;
  let maxPerpendicular = Math.min(cellWidth, cellHeight) * 0.45;

  for (const cell of cells) {
    const center = getCellCenterPx(cell, cellWidth, cellHeight);
    const relX = center.x - anchorPx.x;
    const relY = center.y - anchorPx.y;

    const forward = relX * unitX + relY * unitY;
    const perpendicular = Math.abs(-relX * unitY + relY * unitX);

    maxForward = Math.max(maxForward, forward + cellWidth * 0.5);
    maxPerpendicular = Math.max(
      maxPerpendicular,
      perpendicular + Math.min(cellWidth, cellHeight) * 0.5
    );
  }

  return {
    position: "absolute",
    left: anchorPx.x,
    top: anchorPx.y,
    width: maxForward,
    height: maxPerpendicular * 2,
    transform: `translate(0, -50%) rotate(${angleDeg}deg)`,
    transformOrigin: "0 50%",
    zIndex: 2,
    pointerEvents: "none",
    overflow: "visible",
  };
}