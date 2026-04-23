import type {Creature, GridCoord} from "../../types/creature.ts";
import type {CreatureAction} from "../../types/action.ts";
import type {RecommendationTarget, RecommendationAoeTarget, Encounter} from "../../types/SimulationTypes.ts";
import {isMonsterAction, isSpellAction} from "./ActionTypeChecker.ts";
import {type AoeToken} from "../../types/SimulationTypes.ts";
import {getCreatureCid, getCreaturePosition} from "./CreatureHelpers.ts";
import axiosTokenInstance from "../../api/AxiosTokenInstance.ts";
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
): GridCoord{
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
export function feetToCells(value?: string | number): number {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n) || n <= 0) return 1;
  return Math.max(1, Math.ceil(n / 5));
}
export function resolveAoeTokenImageNameFromStats(
  shape: string,
  damageType?: string
): string {
  const normalizedShape = normalizeAoeShape(shape);

  const shapePrefix =
    normalizedShape === "circle"
      ? "Circle"
      : normalizedShape === "cone"
        ? "Cone"
        : "Cube"; // square + line both use Cube art family

  const damageMap: Record<string, string> = {
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

  const suffix = damageType ? damageMap[damageType.toLowerCase()] ?? "Default" : "Default";
  return `${shapePrefix}${suffix}.png`;
}
export function buildAoeTokenFromStats(input: {
  name: string;
  cid: string;
  shape: string;
  timing: string;
  token_image: string;
  resultID: string;
  anchor: GridCoord;
  positioning: GridCoord[];
}): AoeToken {
  return {
    name: input.name,
    cid: input.cid,
    shape: normalizeAoeShape(input.shape),
    timing: input.timing,
    token_image: input.token_image,
    resultID: input.resultID,
    anchor: input.anchor,
    positioning: input.positioning,
  };
}
export function isDirectionalShape(shape: string): boolean {
  const normalized = normalizeAoeShape(shape);
  return normalized === "cone" || normalized === "line";
}
export function getAoeTargetsFromPositioning(
  positioning: GridCoord[],
  encounter: Encounter,
  actorCid: string
): string[] {
  const occupied = new Set(positioning.map(([x, y]) => `${x},${y}`));
  const allCreatures: Creature[] = [
    ...(encounter.players ?? []),
    ...(encounter.monsters ?? []),
  ];

  return allCreatures
    .filter((creature) => getCreatureCid(creature) !== actorCid)
    .filter((creature) =>
      normalizeGridCoords(getCreaturePosition(creature) as unknown).some(
        ([x, y]) => occupied.has(`${x},${y}`)
      )
    )
    .map((creature) => getCreatureCid(creature));
}
function chooseOrientation(anchor: [number, number], cursor: [number, number]) {
  const dx = cursor[0] - anchor[0];
  const dy = cursor[1] - anchor[1];

  if (dx === 0 && dy === 0) return "right";

  const angle = Math.atan2(-dy, dx) * (180 / Math.PI);

  const dirs = [
    { name: "right", deg: 0 },
    { name: "up_right", deg: 45 },
    { name: "up", deg: 90 },
    { name: "up_left", deg: 135 },
    { name: "left", deg: 180 },
    { name: "down_left", deg: -135 },
    { name: "down", deg: -90 },
    { name: "down_right", deg: -45 },
  ];

  let best = "right";
  let bestDelta = Infinity;

  for (const dir of dirs) {
    let delta = Math.abs(angle - dir.deg);
    if (delta > 180) delta = 360 - delta;

    if (delta < bestDelta) {
      bestDelta = delta;
      best = dir.name;
    }
  }

  return best;
}
function applyMaskAtAnchor(
  anchor: [number, number],
  offsets: [number, number][]
): [number, number][] {
  return offsets.map(([dx, dy]) => [anchor[0] + dx, anchor[1] + dy]);
}

export async function buildManualAoePositioning({
  shape,
  radiusCells,
  anchor,
  cursor = null,
  lineWidthCells = 1,
}: {
  shape: string;
  radiusCells: number;
  anchor: [number, number];
  cursor?: [number, number] | null;
  lineWidthCells?: number;
}): Promise<[number, number][]> {
  const response = await axiosTokenInstance.get("/aoe/template-masks", {
    params: {
      shape,
      sizeCells: radiusCells,
      lineWidthCells,
    },
  });

  const masks = response.data.masks as {
    orientation: string;
    offsets: [number, number][];
  }[];

  const normalizedShape = shape.toLowerCase();

  if (normalizedShape === "circle" || normalizedShape === "square") {
    const firstMask = masks[0]?.offsets ?? [];
    return applyMaskAtAnchor(anchor, firstMask);
  }

  const orientation = chooseOrientation(anchor, cursor ?? anchor);
  const selectedMask =
    masks.find((m) => m.orientation === orientation)?.offsets ?? [];

  return applyMaskAtAnchor(anchor, selectedMask);
}

export function getLineImageStyleFromCells(
  cells: GridCoord[],
  cellWidth: number,
  cellHeight: number
): React.CSSProperties | null {
  if (cells.length === 0) return null;

  const centers = cells.map(([x, y]) => ({
    x: (x + 0.5) * cellWidth,
    y: (y + 0.5) * cellHeight,
  }));

  const meanX = centers.reduce((sum, p) => sum + p.x, 0) / centers.length;
  const meanY = centers.reduce((sum, p) => sum + p.y, 0) / centers.length;

  let sxx = 0;
  let syy = 0;
  let sxy = 0;

  for (const p of centers) {
    const dx = p.x - meanX;
    const dy = p.y - meanY;
    sxx += dx * dx;
    syy += dy * dy;
    sxy += dx * dy;
  }

  // Principal axis of the occupied cells
  const rawAngle = 0.5 * Math.atan2(2 * sxy, sxx - syy);

  const candidateAngles = [
    0,
    Math.PI / 4,
    Math.PI / 2,
    (3 * Math.PI) / 4,
    Math.PI,
    (-3 * Math.PI) / 4,
    -Math.PI / 2,
    -Math.PI / 4,
  ];

  let snappedAngle = candidateAngles[0];
  let bestDelta = Number.POSITIVE_INFINITY;

  for (const candidate of candidateAngles) {
    let delta = Math.abs(rawAngle - candidate);
    if (delta > Math.PI) delta = 2 * Math.PI - delta;

    if (delta < bestDelta) {
      bestDelta = delta;
      snappedAngle = candidate;
    }
  }

  const ux = Math.cos(snappedAngle);
  const uy = Math.sin(snappedAngle);

  const vx = -uy;
  const vy = ux;

  let minU = Number.POSITIVE_INFINITY;
  let maxU = Number.NEGATIVE_INFINITY;
  let minV = Number.POSITIVE_INFINITY;
  let maxV = Number.NEGATIVE_INFINITY;

  for (const [x, y] of cells) {
    const corners = [
      { x: x * cellWidth, y: y * cellHeight },
      { x: (x + 1) * cellWidth, y: y * cellHeight },
      { x: (x + 1) * cellWidth, y: (y + 1) * cellHeight },
      { x: x * cellWidth, y: (y + 1) * cellHeight },
    ];

    for (const corner of corners) {
      const u = corner.x * ux + corner.y * uy;
      const v = corner.x * vx + corner.y * vy;

      if (u < minU) minU = u;
      if (u > maxU) maxU = u;
      if (v < minV) minV = v;
      if (v > maxV) maxV = v;
    }
  }

  const originX = ux * minU + vx * minV;
  const originY = uy * minU + vy * minV;
  const width = maxU - minU;
  const height = maxV - minV;
  const angleDeg = (snappedAngle * 180) / Math.PI;

  return {
    position: "absolute",
    left: originX,
    top: originY,
    width,
    height,
    transform: `rotate(${angleDeg}deg)`,
    transformOrigin: "0 0",
    zIndex: 2,
    pointerEvents: "none",
    overflow: "hidden",
  };
}