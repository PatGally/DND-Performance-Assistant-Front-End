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
type PixelPoint = {
  x: number;
  y: number;
};
type Orientation =
  | "up"
  | "up_right"
  | "right"
  | "down_right"
  | "down"
  | "down_left"
  | "left"
  | "up_left";

type Point = {
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
function hasLingeringValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;

  if (typeof value === "boolean") return value;

  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (typeof value === "object") {
    return Object.keys(value as Record<string, unknown>).length > 0;
  }

  return false;
}

function hasLingeringFields(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;

  const record = value as Record<string, unknown>;

  return (
    hasLingeringValue(record.lingEffect) ||
    hasLingeringValue(record.lingSave)
  );
}

export function extractActionTiming(
  action: CreatureAction
): "instantaneous" | "lingering" {
  const maybe = action as any;

  if (isSpellAction(action) || Array.isArray(maybe?.targeting)) {
    const hasLingering = Array.isArray(maybe?.targeting)
      ? maybe.targeting.some((target: unknown) => hasLingeringFields(target))
      : false;

    console.log("In extractActionTiming with result", hasLingering);

    return hasLingering ? "lingering" : "instantaneous";
  }

  if (isMonsterAction(action)) {
    const hasLingering = hasLingeringFields(action);

    console.log("In extractActionTiming with result", hasLingering);

    return hasLingering ? "lingering" : "instantaneous";
  }

  console.log("Failed checks, returning instant");

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

export function feetToCells(value?: string | number): number {
  const n = Number(value);
  console.log("feetToCells", n);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error(`Invalid AOE size: ${value}`);
  }
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

function applyMaskAtAnchors(
  anchors: GridCoord[],
  offsets: GridCoord[]
): GridCoord[] {
  const cells: GridCoord[] = [];
  for (const anchor of anchors) {
    cells.push(...applyMaskAtAnchor(anchor, offsets));
  }
  return dedupeCoords(cells);
}

function getCellCenter(coord: GridCoord): Point {
  return {
    x: coord[0] + 0.5,
    y: coord[1] + 0.5,
  };
}

function getBounds(cells: GridCoord[]) {
  const xs = cells.map(([x]) => x);
  const ys = cells.map(([, y]) => y);

  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
}

function getFootprintCenterPoint(casterCells: GridCoord[]): Point {
  const { minX, maxX, minY, maxY } = getBounds(casterCells);

  return {
    x: (minX + maxX + 1) / 2,
    y: (minY + maxY + 1) / 2,
  };
}

function dedupeCoords(cells: GridCoord[]): GridCoord[] {
  const seen = new Set<string>();
  const out: GridCoord[] = [];

  for (const [x, y] of cells) {
    const key = `${x},${y}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push([x, y]);
  }

  return out;
}

function subtractCasterCells(cells: GridCoord[], casterCells: GridCoord[]): GridCoord[] {
  const casterSet = new Set(casterCells.map(([x, y]) => `${x},${y}`));
  return cells.filter(([x, y]) => !casterSet.has(`${x},${y}`));
}

function applyMaskAtAnchor(
  anchor: GridCoord,
  offsets: GridCoord[]
): GridCoord[] {
  return offsets.map(([dx, dy]) => [anchor[0] + dx, anchor[1] + dy]);
}

function directionToVector(orientation: Orientation): GridCoord {
  switch (orientation) {
    case "up": return [0, -1];
    case "up_right": return [1, -1];
    case "right": return [1, 0];
    case "down_right": return [1, 1];
    case "down": return [0, 1];
    case "down_left": return [-1, 1];
    case "left": return [-1, 0];
    case "up_left": return [-1, -1];
  }
}

function chooseOrientationFromPoints(origin: Point, target: Point): Orientation {
  const dx = target.x - origin.x;
  const dy = target.y - origin.y;

  if (dx === 0 && dy === 0) return "right";

  const angle = Math.atan2(-dy, dx) * (180 / Math.PI);

  const dirs: { name: Orientation; deg: number }[] = [
    { name: "right", deg: 0 },
    { name: "up_right", deg: 45 },
    { name: "up", deg: 90 },
    { name: "up_left", deg: 135 },
    { name: "left", deg: 180 },
    { name: "down_left", deg: -135 },
    { name: "down", deg: -90 },
    { name: "down_right", deg: -45 },
  ];

  let best: Orientation = "right";
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

function getPerimeterAnchorCells(casterCells: GridCoord[]): GridCoord[] {
  const { minX, maxX, minY, maxY } = getBounds(casterCells);

  return casterCells.filter(([x, y]) =>
    x === minX || x === maxX || y === minY || y === maxY
  );
}

function angularDelta(a: number, b: number): number {
  let delta = Math.abs(a - b);
  if (delta > Math.PI) delta = 2 * Math.PI - delta;
  return delta;
}

function choosePerimeterAnchorByCursor(
  casterCells: GridCoord[],
  cursor: GridCoord
): GridCoord {
  const center = getFootprintCenterPoint(casterCells);
  const cursorPoint = getCellCenter(cursor);
  const desiredAngle = Math.atan2(
    -(cursorPoint.y - center.y),
    cursorPoint.x - center.x
  );

  const perimeter = getPerimeterAnchorCells(casterCells);

  let best = perimeter[0];
  let bestAngleDelta = Infinity;
  let bestProjection = -Infinity;
  let bestCursorDistance = Infinity;

  const ux = Math.cos(desiredAngle);
  const uy = -Math.sin(desiredAngle);

  for (const anchor of perimeter) {
    const p = getCellCenter(anchor);
    const vx = p.x - center.x;
    const vy = p.y - center.y;

    const anchorAngle = Math.atan2(-vy, vx);
    const angleDelta = angularDelta(desiredAngle, anchorAngle);
    const projection = vx * ux + vy * uy;
    const cursorDistance =
      Math.abs(p.x - cursorPoint.x) + Math.abs(p.y - cursorPoint.y);

    const isBetter =
      angleDelta < bestAngleDelta - 1e-6 ||
      (Math.abs(angleDelta - bestAngleDelta) < 1e-6 &&
        projection > bestProjection + 1e-6) ||
      (Math.abs(angleDelta - bestAngleDelta) < 1e-6 &&
        Math.abs(projection - bestProjection) < 1e-6 &&
        cursorDistance < bestCursorDistance);

    if (isBetter) {
      best = anchor;
      bestAngleDelta = angleDelta;
      bestProjection = projection;
      bestCursorDistance = cursorDistance;
    }
  }

  return best;
}

function getFrontEdgeCells(
  casterCells: GridCoord[],
  orientation: Orientation
): GridCoord[] {
  const [dx, dy] = directionToVector(orientation);
  const maxProj = Math.max(...casterCells.map(([x, y]) => x * dx + y * dy));
  return casterCells.filter(([x, y]) => x * dx + y * dy === maxProj);
}

function getFrontCornerCell(
  casterCells: GridCoord[],
  orientation: Orientation
): GridCoord {
  const { minX, maxX, minY, maxY } = getBounds(casterCells);

  switch (orientation) {
    case "up_right":
      return [maxX, minY];
    case "down_right":
      return [maxX, maxY];
    case "down_left":
      return [minX, maxY];
    case "up_left":
      return [minX, minY];
    default:
      throw new Error(`getFrontCornerCell called with non-diagonal orientation: ${orientation}`);
  }
}

function isDiagonalOrientation(orientation: Orientation): boolean {
  return (
    orientation === "up_right" ||
    orientation === "down_right" ||
    orientation === "down_left" ||
    orientation === "up_left"
  );
}

export async function buildManualAoePositioning({
  shape,
  radiusCells,
  anchor,
  cursor = null,
  lineWidthCells = 1,
  originMode = "placed",
  casterCells = [],
}: {
  shape: string;
  radiusCells: number;
  anchor: GridCoord;
  cursor?: GridCoord | null;
  lineWidthCells?: number;
  originMode?: "placed" | "self";
  casterCells?: GridCoord[];
}): Promise<GridCoord[]> {
  const response = await axiosTokenInstance.get("/aoe/template-masks", {
    params: {
      shape,
      sizeCells: radiusCells,
      lineWidthCells,
    },
  });

  const masks = response.data.masks as {
    orientation: string;
    offsets: GridCoord[];
  }[];

  const normalizedShape = shape.toLowerCase();
  const maskMap = new Map<string, GridCoord[]>(
    masks.map((m) => [m.orientation, m.offsets])
  );

  // Existing placed-origin behavior
  if (originMode !== "self" || casterCells.length === 0) {
    if (normalizedShape === "circle" || normalizedShape === "square") {
      const firstMask = masks[0]?.offsets ?? [];
      return applyMaskAtAnchor(anchor, firstMask);
    }

    const orientation = chooseOrientationFromPoints(
      getCellCenter(anchor),
      getCellCenter(cursor ?? anchor)
    );
    const selectedMask = maskMap.get(orientation) ?? [];
    return applyMaskAtAnchor(anchor, selectedMask);
  }

  const centerPoint = getFootprintCenterPoint(casterCells);
  const cursorCell = cursor ?? anchor;
  const orientation = chooseOrientationFromPoints(
    centerPoint,
    getCellCenter(cursorCell)
  );

  // Self-origin circle / square
  if (normalizedShape === "circle" || normalizedShape === "square") {
    const firstMask = masks[0]?.offsets ?? [];
    const cells = applyMaskAtAnchors(casterCells, firstMask);
    return dedupeCoords(cells);
  }

  // Self-origin line: choose ONE perimeter anchor based on angle
  if (normalizedShape === "line") {
    const selectedAnchor = choosePerimeterAnchorByCursor(casterCells, cursorCell);
    const selectedMask = maskMap.get(orientation) ?? [];
    const cells = applyMaskAtAnchor(selectedAnchor, selectedMask);
    return subtractCasterCells(dedupeCoords(cells), casterCells);
  }

  // Self-origin cone
  if (normalizedShape === "cone") {
    const selectedMask = maskMap.get(orientation) ?? [];

    if (isDiagonalOrientation(orientation)) {
      const frontCorner = getFrontCornerCell(casterCells, orientation);
      const cells = applyMaskAtAnchor(frontCorner, selectedMask);
      return subtractCasterCells(dedupeCoords(cells), casterCells);
    }

    const frontEdge = getFrontEdgeCells(casterCells, orientation);
    const cells = applyMaskAtAnchors(frontEdge, selectedMask);
    return subtractCasterCells(dedupeCoords(cells), casterCells);
  }

  const fallbackMask = masks[0]?.offsets ?? [];
  return applyMaskAtAnchor(anchor, fallbackMask);
}

export function getFootprintCenterCell(cells: [number, number][]): [number, number] | null {
  if (!cells.length) return null;

  const xs = cells.map(([x]) => x);
  const ys = cells.map(([, y]) => y);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  return [Math.floor((minX + maxX) / 2), Math.floor((minY + maxY) / 2)];
}

export function extractLineWidthFeet(shape?: string): number | null {
  if (!shape) return null;

  const s = shape.toLowerCase().trim();

  if (s === "line") return 5;

  const match = s.match(/line.*?(\d+)\s*(?:ft|feet)\s+wide/);
  if (match) {
    const n = Number(match[1]);
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  return s.includes("line") ? 5 : null;
}

export function extractLineWidthCells(shape?: string): number {
  const widthFeet = extractLineWidthFeet(shape);
  return feetToCells(widthFeet ?? 5);
}