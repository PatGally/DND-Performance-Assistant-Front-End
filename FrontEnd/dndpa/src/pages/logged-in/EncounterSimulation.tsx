//adding the party size and enemies are here, create character, then create map will be here
import {useEffect, useRef, useState} from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import {ArrowLeftShort, ArrowRightShort} from "react-bootstrap-icons";
import axiosTokenInstance from "../../api/AxiosTokenInstance.ts";
import {useLocation} from "react-router-dom";

import ActiveMap from "../../components/ActiveEncounter/ActiveMap.tsx";
import InitiativeList from "../../components/ActiveEncounter/InitiativeList.tsx";
import ActionList from "../../components/ActiveEncounter/ActionList.tsx";
import Recommendation from "../../components/ActiveEncounter/Recommendation.tsx";
import InputHandler from "../../components/ActiveEncounter/InputHandler.tsx";

import {isMonsterAction, isSpellAction} from "../../utils/ActionTypeChecker.ts";
import {
    getCreatureName, getCreatureCid, getCreatureSize, getCreaturePosition,
    getCurrentTurnCreatureFromEncounter, resolveTargetToCid
} from "../../utils/CreatureHelpers.ts";

import {getEncounter} from "../../api/EncounterGet.ts";
import {fetchUUID} from "../../api/UUIDGet.ts";
import {isPlayerCreature} from "../../api/CreatureGet.ts";
import type {Creature} from "../../types/creature.ts";
import type {CreatureAction, SpellAction} from "../../types/action.ts";

import type {
    Encounter, PreTurnEffect, NormalizedAction, ActionRequestDraft,
    ActionExecutionSession, RollMode, ManualDraftState, ManualAffectedCreature
} from "../../types/SimulationTypes.ts";
const WEAPON_DEFAULTS = {
  targetMode: "single" as const,
  targetCount: 1,
  range: "5",
  shape: "",
  radius: "",
  rollMode: "toHit" as const,
  saveType: "",
  halfSave: false,
  actionCost: "action",
};
import ExitSimulation from "../../components/ActiveEncounter/ExitSimulation.tsx";
import { Card } from "react-bootstrap";
import Orb from '../../css/Orb.tsx';
import {actionsGet} from "../../api/ActionsGet.ts";

function parseCount(value?: string | number): number | null {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
function buildRequiredInputs(normalized: NormalizedAction) {
  const fields: string[] = [];

  if (normalized.rollMode === "toHit" || normalized.rollMode === "onHit") fields.push("attackRoll");
  else if (normalized.rollMode === "save") fields.push("save");
  if (normalized.hasDamage) fields.push("damageRoll");

  return fields;
}
function clampPan(
    x: number,
    y: number,
    zoom: number,
    viewportRect: DOMRect,
    mapNaturalWidth: number,
    mapNaturalHeight: number,
    margin = 100
): { x: number; y: number } {
    const scaledMapW = mapNaturalWidth * zoom;
    const scaledMapH = mapNaturalHeight * zoom;
    const vw = viewportRect.width;
    const vh = viewportRect.height;

    const minX = -(scaledMapW - margin);
    const maxX = vw - margin;
    const minY = -(scaledMapH - margin);
    const maxY = vh - margin;

    return {
        x: Math.min(maxX, Math.max(minX, x)),
        y: Math.min(maxY, Math.max(minY, y)),
    };
}
function normalizeAction(action: CreatureAction): NormalizedAction {
  if (isSpellAction(action)) {
    const target = action.targeting?.[0];
    const count = parseCount(target?.number);
    const isAoe = !!target?.shape;
    const isSelf = !!target?.self;

    return {
      kind: "spell",
      name: action.spellname,
      targetMode: isSelf
        ? "self"
        : isAoe
          ? "aoe"
          : count === 1
            ? "single"
            : (count ?? 0) > 1
              ? "multi"
              : "none",
      targetCount: isSelf ? 0 : count,
      range: target?.actionRange ?? "",
      shape: target?.shape ?? "",
      radius: target?.radius ?? "",
      rollMode: (target?.rolls?.rollType as RollMode) || "none",
      saveType: target?.rolls?.saveType ?? "",
      halfSave: target?.rolls?.halfSave ?? false,
      hasDamage: !!target?.rolls?.damage,
      actionCost: target?.actionCost ?? "",
      damage: target?.rolls?.damage ?? "",
      damageMod: target?.rolls?.damageMod ?? "",
      damageType: target?.damType?.[0] ?? "",
    };
  }
  if (isMonsterAction(action)) {
    const count = parseCount(action.number);
    const isAoe = !!action.shape;

    return {
      kind: "monster",
      name: action.name,
      targetMode: isAoe
        ? "aoe"
        : count === 1
          ? "single"
          : (count ?? 0) > 1
            ? "multi"
            : "none",
      targetCount: count,
      range: action.actionRange ?? "",
      shape: action.shape ?? "",
      radius: "",
      rollMode: (action.rolls?.rollType as RollMode) || "none",
      saveType: action.rolls?.saveType ?? "",
      halfSave: action.rolls?.halfSave ?? false,
      hasDamage: !!action.rolls?.damage,
      actionCost: action.actionCost ?? "",
      damage: action.rolls?.damage ?? "",
      damageMod: action.rolls?.damageMod ?? "",
      damageType: action.damType?.[0] ?? "",
    };
  }

  // Weapon defaults
    //TODO: Account for ranged weapons in terms of range
  return {
  kind: "weapon",
  name: action.name,
  ...WEAPON_DEFAULTS,
  hasDamage: !!action.properties.damage,
  damage: action.properties.damage,
  damageType: action.properties.damageType,
  damageMod: "",
  weaponStat: action.properties.weaponStat,
};
}
function extractActionEffects(action: CreatureAction): {
  conditions: string[];
  statusEffects: Record<string, unknown>[];
} {
  if (isSpellAction(action)) {
    const target = action.targeting?.[0];
    return {
      conditions: Array.isArray(target?.conditions) ? target.conditions : [],
      statusEffects: Array.isArray(target?.statusEffect)
        ? (target.statusEffect as Record<string, unknown>[])
        : [],
    };
  }

  if (isMonsterAction(action)) {
    return {
      conditions: Array.isArray(action.conditions) ? action.conditions : [],
      statusEffects: Array.isArray(action.statusEffect)
        ? (action.statusEffect as Record<string, unknown>[])
        : [],
    };
  }

  return {
    conditions: [],
    statusEffects: [],
  };
}

function EncounterSimulation() {
    const location = useLocation();
    const eid = location.state?.eid;

    //Side components
    const [initiativeOpen, setInitiativeOpen] = useState(false);
    const [initiativeRefreshKey, setInitiativeRefreshKey] = useState(0);
    const [recommendRefreshKey, setRecommendRefreshKey] = useState(0);
    const [actionOpen, setActionOpen] = useState(false);

    //Pre/post enc logic
    const [encStart, setEncStart] = useState(false);
    const [activeEncounter, setActiveEncounter] = useState(true);

    const [encounterData, setEncounterData] = useState<Encounter>();
    const [loadingEncounter, setLoadingEncounter] = useState(true);
    const [encounterError, setEncounterError] = useState<string | null>(null);
    const [currentTurnCreature, setCurrentTurnCreature] = useState<Creature>();

    //selectedCID used for token selection
    const [selectedCID, setSelectedCID] = useState<string | null>(null);
    const [currentTurnActions, setCurrentTurnActions] = useState<CreatureAction[]>();
    //Locks the top three buttons
    const [actionExecutionSession, setActionExecutionSession] = useState<ActionExecutionSession>();
    const [handlingNextTurn, setHandlingNextTurn] = useState(false);
    const [preTurnEffects, setPreTurnEffects] = useState<PreTurnEffect[]>();
    const [manualLock, setManualLock] = useState(false);
    const [manualMode, setManualMode] = useState(false);
    const [manualDraft, setManualDraft] = useState<ManualDraftState>({
      affectedCreatures: [],
    });
    const [initiativeExpandedCid, setInitiativeExpandedCid] = useState<string | null>(null);

    //Pan/zoom state
    const mapViewportRef = useRef<HTMLDivElement>(null);
    const mapContentRef = useRef<HTMLDivElement>(null);

    const zoom = useRef(1);
    const pan = useRef({ x: 0, y: 0 });
    const isPanning = useRef(false);
    const lastPanPos = useRef({ x: 0, y: 0 });
    const [mapNaturalWidth, setMapNaturalWidth] = useState(800);
    const [mapNaturalHeight, setMapNaturalHeight] = useState(600);

    const MIN_ZOOM = 0.25;
    const MAX_ZOOM = 4;

    const applyTransform = () => {
        if (mapContentRef.current) {
            mapContentRef.current.style.transform =
                `translate(${pan.current.x}px, ${pan.current.y}px) scale(${zoom.current})`;
        }
    };
    //ONLOAD EFFECTS
    const loadActions = async (): Promise<void> => {
        if (currentTurnCreature) {
            const currentActions = await actionsGet(eid, getCreatureCid(currentTurnCreature))
            setCurrentTurnActions(currentActions);
            return;
        }
    }

    useEffect(() => {
        //Loads the encounter from the DB
        const loadEncounter = async (): Promise<void> => {
            try {
                setLoadingEncounter(true);
                setEncounterError(null);

                const data = await getEncounter(eid);
                if (!data) {
                    setEncounterError("Encounter was not found.");
                    setEncounterData(undefined);
                    return;
                }

                setEncounterData(data);
            } catch (error) {
                console.error("Failed to load encounter:", error);
                setEncounterError("Failed to load encounter data.");
                setEncounterData(undefined);
            } finally {
                setLoadingEncounter(false);
            }
        };

    loadEncounter();
}, []);
    useEffect(() => {
        //Checks startup logic -> if not startup, then grab currentTurnCreature.
        if (!encounterData || loadingEncounter || encounterError) return;

        const allCreatures: Creature[] = [
            ...(encounterData.players ?? []),
            ...(encounterData.monsters ?? []),
        ];

        const zeroOccupants = allCreatures.filter((creature) => {
            const position = getCreaturePosition(creature);
            return position.some(
                (tile) =>
                    Array.isArray(tile) &&
                    tile.length === 2 &&
                    tile[0] === 0 &&
                    tile[1] === 0
            );
        });
        const noCollisionAtZero = zeroOccupants.length <= 1;

        if (!noCollisionAtZero) {
            setEncStart(true);
            setActiveEncounter(false);
        } else {
            const storedTurn = getCurrentTurnCreatureFromEncounter(encounterData);
            if (storedTurn && storedTurn.name === encounterData.initiative[0].name) {
                simStart();
            }
            if (storedTurn) {
                setCurrentTurnCreature(storedTurn);
            }
        }
    }, [encounterData]);
    useEffect(() => {
        if (currentTurnCreature) {
            loadActions();
        }
    }, [currentTurnCreature, encounterData])
    useEffect(() => {
        const el = mapViewportRef.current;
        if (!el) return;
        const handler = (e: WheelEvent) => e.preventDefault();
        el.addEventListener("wheel", handler, { passive: false });
        return () => el.removeEventListener("wheel", handler);
    }, []);

    //SIM FUNCTIONS
    function simStart(): void {
        if (!encounterData || encounterData.initiative.length === 0) return;

        setEncStart(false);
        setActiveEncounter(true);

        const initStart = encounterData.initiative[0]?.name;
        if (!initStart) return;

        const allCreatures: Creature[] = [
            ...(encounterData.players ?? []),
            ...(encounterData.monsters ?? []),
        ];

        const matchingCreature = allCreatures.find(
            (creature) => getCreatureName(creature) === initStart
        );

        if (!matchingCreature) {
            console.warn("Could not find initiative starting creature.");
            setCurrentTurnCreature(undefined);
            return;
        }

    setCurrentTurnCreature(matchingCreature);
}
    async function basicActionGet(name : string) {
        if (["dodge", "shove", "grapple", "hide"].includes(name.toLowerCase())) {
            const response = await axiosTokenInstance.get("basic-actions");
            const basicActions = response.data as SpellAction[];
            return basicActions.find(basic => basic.spellname === name);
        }
        return;
    }
    function handleTokenSelect(cid: string) {
  if (!encounterData || actionExecutionSession || preTurnEffects) return;

  if (manualMode) {
    setInitiativeOpen(true);
    setInitiativeExpandedCid((prev) => (prev === cid ? null : cid));
    return;
  }

  setSelectedCID((prev) => (prev === cid ? null : cid));
}
    async function handleNextTurn() {
        if (handlingNextTurn || actionExecutionSession || !encounterData || !currentTurnCreature ||
            encStart || !activeEncounter || !eid || preTurnEffects) return;

        try {
            setHandlingNextTurn(true);

            const response = await axiosTokenInstance.get(`/encounter/${eid}/initiative/nextturn`);
            const preEffects = Array.isArray(response.data.preEffects) ? response.data.preEffects : [];
            const updatedEncounter = await getEncounter(eid);
            if (!updatedEncounter) {
                console.error("Failed to reload encounter after advancing turn.");
                return;
            }
            setEncounterData(updatedEncounter);

            const newCurrentTurnCreature = getCurrentTurnCreatureFromEncounter(updatedEncounter);
            if (!newCurrentTurnCreature) {
                console.error("Could not determine current turn creature from updated encounter.");
                setCurrentTurnCreature(undefined);
            } else {
                setCurrentTurnCreature(newCurrentTurnCreature);
            }
            if (Array.isArray(preEffects) && preEffects.length !== 0) {
                setPreTurnEffects(preEffects);
            }

        } catch (error) {
            console.error("Failed to advance turn:", error);
        } finally {
            setInitiativeRefreshKey((prev) => prev + 1);
            setHandlingNextTurn(false);
            setManualLock(false);
        }
    }
    async function handleGridCellClick(cellX: number, cellY: number) {
  if (manualMode) return;
  if (!selectedCID || !encounterData || actionExecutionSession || preTurnEffects) return;

  try {
    const allCreatures: Creature[] = [
      ...(encounterData.players ?? []),
      ...(encounterData.monsters ?? []),
    ];

    const movedCreature = allCreatures.find(
      (creature) => getCreatureCid(creature) === selectedCID
    );

    if (!movedCreature) {
      console.error("Could not find selected creature.");
      return;
    }

    const sizeRaw = getCreatureSize(movedCreature);

    let footprint = 1;
    if (sizeRaw === "large") footprint = 2;
    else if (sizeRaw === "huge") footprint = 3;
    else if (sizeRaw === "gargantuan") footprint = 4;

    const newPos: number[][] = [];
    for (let dy = 0; dy < footprint; dy++) {
      for (let dx = 0; dx < footprint; dx++) {
        newPos.push([cellX + dx, cellY + dy]);
      }
    }

    await axiosTokenInstance.post(
      `/encounter/${eid}/creature/${selectedCID}/simulate/movement`,
      newPos
    );

    const updatedEncounter = await getEncounter(eid);
    if (!updatedEncounter) {
      console.error("Encounter reload failed after movement.");
      return;
    }

    setEncounterData(updatedEncounter);
    setSelectedCID(null);
    setRecommendRefreshKey((prev) => prev + 1);
  } catch (error) {
    console.error("Movement simulation failed:", error);
  }
}
    async function handleActionSubmission(action : CreatureAction) {
        setManualLock(true);
        const { conditions, statusEffects } = extractActionEffects(action);
        const normalized = normalizeAction(action);
        const requiredInputs = buildRequiredInputs(normalized);
        let resultID;
        try {
            resultID = await fetchUUID();
        } catch (err) {
            resultID = "a";
            console.error("Failed to fetch CID", err);
        }
        const draft : ActionRequestDraft = {
            resultID,
            actor : (currentTurnCreature ? getCreatureName(currentTurnCreature) : ""),
            action : (isSpellAction(action) ? action.spellname : action.name),
            actionType : (isSpellAction(action) ? `Lvl ${action.level} Spell`
                : isMonsterAction(action) ? "MonAction" : "Weapon"),
            actionProb : 0,
            actionEDam : 0,
            actionImpact : 0,
            targets : [],
            conditions : conditions,
            statusEffects : statusEffects,
            outcome : {
                rollResults : [],
                diceResults : []
            },
            extraOutcome : {
                extraRollResults : [],
                extraDiceResults : []
            },
            timestamp : ""
        };

        const actionSession = {
            action : normalized,
            requiredInputs : requiredInputs,
            draft : draft,
            error : ""
        }
        setActionExecutionSession(actionSession);
    }
    async function handlePASubmission(name: string, prob: number,
                       eDam: number, impact: number, targets: string[]) {
        if (!currentTurnCreature || !encounterData || !currentTurnActions) return;
        let action;
        action = currentTurnActions.find(a => isSpellAction(a) ?
            a.spellname.toLowerCase() === name.toLowerCase()
            : a.name.toLowerCase() === name.toLowerCase());
        if (!action) {
            action = await basicActionGet(name);
        }
        if (!action) {
            console.error("Action does not exist in statblock!");
            return;
        }
        setManualLock(true);
        let resolvedTargets: string[] = []
        if(targets) {
            resolvedTargets = targets
          .map((target) => resolveTargetToCid(target, encounterData))
          .filter((target): target is string => target !== null);
        }
        const { conditions, statusEffects } = extractActionEffects(action);
        const normalized = normalizeAction(action);
        const requiredInputs = buildRequiredInputs(normalized);
        let resultID;
        try {
            resultID = await fetchUUID();
        } catch (err) {
            resultID = "-1";
            console.error("Failed to fetch CID", err);
        }
        const draft : ActionRequestDraft = {
            resultID,
            actor : (currentTurnCreature ? getCreatureName(currentTurnCreature) : ""),
            action : (isSpellAction(action) ? action.spellname : action.name),
            actionType : (isSpellAction(action) ? `Lvl ${action.level} Spell`
                : isMonsterAction(action) ? "MonAction" : "Weapon"),
            actionProb : prob,
            actionEDam : eDam,
            actionImpact : impact,
            targets : resolvedTargets,
            conditions : conditions,
            statusEffects : statusEffects,
            outcome : {
                rollResults : [],
                diceResults : []
            },
            extraOutcome : {
                extraRollResults : [],
                extraDiceResults : []
            },
            timestamp : ""
        };
        const actionSession = {
            action : normalized,
            requiredInputs : requiredInputs,
            draft : draft,
            error : ""
        }
        setActionExecutionSession(actionSession);
}
    async function handleActionExecution(finalDraft: ActionRequestDraft) {
          if (!eid || !currentTurnCreature || !encounterData || !actionExecutionSession) return;
          try {
            const missingTargets =
              finalDraft.targets.length === 0 &&
              (actionExecutionSession?.action.targetCount ?? 0) > 0;

            if (missingTargets) {
              setActionExecutionSession((prev) =>
                prev ? { ...prev, error: "Targets are required." } : prev
              );
              return;
            }

            await axiosTokenInstance.post(
              `/encounter/${eid}/simulate/ruleset`,
              finalDraft
            );

            const updatedEncounter = await getEncounter(eid);
            if (!updatedEncounter) {
              console.error("Failed to reload encounter after action execution.");
              return;
            }

            setEncounterData(updatedEncounter);

            const newCurrentTurnCreature = getCurrentTurnCreatureFromEncounter(updatedEncounter);
            setCurrentTurnCreature(newCurrentTurnCreature);

            setActionExecutionSession(undefined);
            setManualLock(false);
            setInitiativeRefreshKey((prev) => prev + 1);
          } catch (error) {
            console.error("Failed to execute action:", error);
            setActionExecutionSession((prev) =>
              prev ? { ...prev, error: "Action execution failed." } : prev
            );
          }
}
    async function handleManualSimulate() {
          if (manualLock || !manualMode || !eid) return;

          try {
            setManualLock(true);
            if (manualDraft.affectedCreatures.length > 0) {
              await axiosTokenInstance.post(
                `/encounter/${eid}/simulate/manual`,
                manualDraft
              );

              const updatedEncounter = await getEncounter(eid);
              if (updatedEncounter) {
                setEncounterData(updatedEncounter);
                const newCurrentTurnCreature = getCurrentTurnCreatureFromEncounter(updatedEncounter);
                setCurrentTurnCreature(newCurrentTurnCreature);
              }
            }

            setManualDraft({ affectedCreatures: [] });
            setInitiativeExpandedCid(null);
            // await handleNextTurn();
          } catch (error) {
            console.error("Manual simulation failed:", error);
          } finally {
            setManualLock(false);
            setManualMode(false);
            setInitiativeRefreshKey(initiativeRefreshKey + 1);
          }
        }
    function clearManualState() {
      setManualDraft({ affectedCreatures: [] });
      setInitiativeExpandedCid(null);
    }
    function setManualState() {
        setManualMode(true);
        setInitiativeOpen(true);
        setActionOpen(false);
        clearManualState();
    }
    function handleManualCreatureChange(nextCreature: ManualAffectedCreature) {
          setManualDraft((prev) => {
            const others = prev.affectedCreatures.filter(
              (creature) => creature.cid !== nextCreature.cid
            );

            const changedKeys = Object.keys(nextCreature).filter((key) => key !== "cid");

            if (changedKeys.length === 0) {
              return { affectedCreatures: others };
            }

            return {
              affectedCreatures: [...others, nextCreature],
            };
          });
        }

    //PAN/ZOOM FUNCTIONS
    function onPanStart(e: React.MouseEvent) {
        if ((e.target as HTMLElement).tagName === "IMG") return;
        isPanning.current = true;
        if (mapViewportRef.current) mapViewportRef.current.style.cursor = "grabbing";
        lastPanPos.current = { x: e.clientX, y: e.clientY };
    }
    function onPanMove(e: React.MouseEvent) {
        if (!isPanning.current) return;
        const rect = mapViewportRef.current!.getBoundingClientRect();
        const dx = e.clientX - lastPanPos.current.x;
        const dy = e.clientY - lastPanPos.current.y;
        lastPanPos.current = { x: e.clientX, y: e.clientY };
        pan.current = clampPan(pan.current.x + dx, pan.current.y + dy, zoom.current, rect, mapNaturalWidth, mapNaturalHeight);
        applyTransform();
    }
    function onPanEnd() { isPanning.current = false;
        if (mapViewportRef.current) mapViewportRef.current.style.cursor = "grab";}
    function onWheel(e: React.WheelEvent) {
        const rect = mapViewportRef.current!.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const factor = e.deltaY < 0 ? 1.06 : 0.95;
        const nextZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom.current * factor));
        const ratio = nextZoom / zoom.current;
        const nextX = mouseX - ratio * (mouseX - pan.current.x);
        const nextY = mouseY - ratio * (mouseY - pan.current.y);
        zoom.current = nextZoom;
        pan.current = clampPan(nextX, nextY, nextZoom, rect, mapNaturalWidth, mapNaturalHeight);
        applyTransform();
    }

    return (
        <Container fluid className="p-0 bg-dark"
                   style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
            <Row className="bg-dark text-white px-3 mx-0" style={{ height: "56px", flexShrink: 0 }}>
                <Col className="d-flex align-items-center">
                    {encounterData
                        ? <h3 className="mb-0">{encounterData.name} Simulation</h3>
                        : <h3 className="mb-0">Encounter Simulation</h3>
                    }
                </Col>
                <Col className="d-flex align-items-center gap-2">
                    {activeEncounter && currentTurnCreature && (
                        <>
                            <p className="mb-0">Current Turn: {isPlayerCreature(currentTurnCreature)
                                ? currentTurnCreature.stats.name
                                : currentTurnCreature.name}
                            </p>
                            <button
                                onClick={() => {
                                    setManualMode(false);
                                    clearManualState();
                                }}
                            >
                                Ruleset
                            </button>

                            <button
                                disabled={actionExecutionSession !== undefined || handlingNextTurn || manualLock}
                                onClick={() => {
                                    setManualState()
                                }}
                            >
                                Manual
                            </button>
                            {manualMode && (
                                <button onClick={handleManualSimulate}>Submit</button>
                            )}
                            {!manualMode && (
                                <button disabled={actionExecutionSession !== undefined || preTurnEffects !== undefined}
                                        onClick={handleNextTurn}>Next Turn</button>
                            )}
                        </>
                        )
                    }
                    {encStart && !activeEncounter && (<button onClick={simStart}>Start!</button>)}
                </Col>
                <Col className="d-flex justify-content-end align-items-center">
                    <ExitSimulation />
                </Col>
            </Row>


            <Row className="g-0 mx-0" style={{ flex: 1, minHeight: 0 }}>
                <Col style={{ position: "relative", overflow: "hidden", height: "100%", padding: 0 }}>
                    <div
                        ref={mapViewportRef}
                        style={{
                            position: "absolute",
                            inset: 0,
                            overflow: "hidden",
                            cursor: "grab",
                        }}
                        onMouseDown={onPanStart}
                        onMouseMove={onPanMove}
                        onMouseUp={onPanEnd}
                        onMouseLeave={onPanEnd}
                        onWheel={onWheel}
                    >
                        <div ref={mapContentRef} style={{
                            transform: `translate(${pan.current.x}px, ${pan.current.y}px) scale(${zoom})`,
                            transformOrigin: "0 0",
                            willChange: "transform",
                            display: "inline-block",
                        }}>
                            {!encounterError && !loadingEncounter && encounterData && (
                                <ActiveMap
                                    encounter={encounterData}
                                    manualMode={manualMode}
                                    encStart={encStart}
                                    activeEncounter={activeEncounter}
                                    selectedCID={selectedCID}
                                    onTokenSelect={handleTokenSelect}
                                    onGridCellClick={handleGridCellClick}
                                    onMapSizeLoaded={(w, h) => {
                                        setMapNaturalWidth(w);
                                        setMapNaturalHeight(h);
                                    }}
                                />
                            )}
                        </div>
                    </div>

                    {!initiativeOpen && (
                        <button
                            onClick={() => setInitiativeOpen(true)}
                            style={{
                                position: "absolute",
                                top: "50%",
                                left: 0,
                                transform: "translateY(-50%)",
                                zIndex: 30,
                            }}
                        >
                            <ArrowRightShort />
                        </button>
                    )}
                    {initiativeOpen && (
                        <div style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            height: "100%",
                            width: "15%",
                            minWidth: "220px",
                            maxWidth: "320px",
                            zIndex: 20,
                            display: "flex",
                            flexDirection: "column",
                        }}>
                            <div style={{
                                flex: 1,
                                background: "#222222",
                                color: "white",
                                borderRight: "1px solid #ccc",
                                overflowY: "auto",
                                padding: "12px",
                            }}>
                                <InitiativeList
                                  key={`${eid}-${initiativeRefreshKey}`}
                                  eid={eid}
                                  manualMode={manualMode}
                                  expandedCid={initiativeExpandedCid}
                                  onExpandedCidChange={setInitiativeExpandedCid}
                                  manualDraft={manualDraft}
                                  onManualCreatureChange={handleManualCreatureChange}
                                />
                            </div>
                            <button
                                onClick={() => setInitiativeOpen(false)}
                                style={{
                                    position: "absolute",
                                    top: "50%",
                                    right: "-44px",
                                    transform: "translateY(-50%)",
                                    zIndex: 30,
                                }}
                            >
                                <ArrowLeftShort />
                            </button>
                        </div>
                    )}

                    {!actionOpen && (
                        <button
                            onClick={() => setActionOpen(true)}
                            style={{
                                position: "absolute",
                                top: "50%",
                                right: 0,
                                transform: "translateY(-50%)",
                                zIndex: 30,
                            }}
                        >
                            <ArrowLeftShort />
                        </button>
                    )}
                    {actionOpen && encounterData && currentTurnCreature && !preTurnEffects && !manualMode && (
                        <div style={{
                            position: "absolute",
                            top: 0,
                            right: 0,
                            height: "100%",
                            width: "15%",
                            minWidth: "220px",
                            maxWidth: "320px",
                            zIndex: 20,
                            display: "flex",
                            flexDirection: "column",
                        }}>
                            <div style={{
                                flex: 1,
                                background: "#222222",
                                color: "white",
                                borderLeft: "1px solid #ccc",
                                overflowY: "auto",
                                padding: "12px",
                            }}>
                                <ActionList cid={getCreatureCid(currentTurnCreature)} eid={eid} handleActionSubmission={handleActionSubmission} setManualState={setManualState}/>
                            </div>
                            <button
                                onClick={() => setActionOpen(false)}
                                style={{
                                    position: "absolute",
                                    top: "50%",
                                    left: "-44px",
                                    transform: "translateY(-50%)",
                                    zIndex: 30,
                                }}
                            >
                                <ArrowRightShort />
                            </button>
                        </div>
                    )}

                    {activeEncounter && currentTurnCreature && (
                        <Card className="text-white "
                              style={{
                                  position: "absolute",
                                  bottom: 16,
                                  left: "50%",
                                  transform: "translateX(-50%)",
                                  zIndex: 15,
                                  width: "30%",
                                  backgroundColor: "rgba(15, 24, 40, 0.85)",
                                  backdropFilter: "blur(6px)",
                                  WebkitBackdropFilter: "blur(6px)",
                                  border: "none",
                                  outline: "none",
                                  boxShadow: "none"
                              }}
                        >
                            <Card.Body>
                                <Row>
                                    <Col lg={2}>
                                        <Orb
                                            hoverIntensity={2}
                                            rotateOnHover={false}
                                            hue={0}
                                            forceHoverState={false}
                                            backgroundColor="#100000"
                                        />
                                    </Col>
                                    <Col xs="auto" >
                                        {preTurnEffects && preTurnEffects.length > 0 ? (
                                            <>
                                                <Card.Title>Resolve Pre-Turn Effects</Card.Title>
                                                <Card.Text>
                                                    This creature has effects that must be resolved before continuing.
                                                </Card.Text>

                                                {preTurnEffects.map((effect, index) => (
                                                    <div key={index} className="mb-2">
                                                        <strong>{effect.name ?? "Unnamed Effect"}</strong>
                                                    </div>
                                                ))}
                                            </>
                                        ) : manualMode ? (
                                            <Card.Text>Manual Mode</Card.Text>
                                        ) : encounterData && actionExecutionSession ? (
                                    <InputHandler
                                        encounter={encounterData}
                                        actionSession={actionExecutionSession}
                                        setActionExecutionSession={setActionExecutionSession}
                                        setManualLock={setManualLock}
                                        handleActionExecution={handleActionExecution}
                                    />
                                ) : (
                                    <Recommendation
                                        eid={eid}
                                        cid={getCreatureCid(currentTurnCreature)}
                                        handlePASubmission={handlePASubmission}
                                        key={`${eid}-${recommendRefreshKey}`}
                                    />
                                )}
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    )}
                </Col>
            </Row>
        </Container>
    );
}

export default EncounterSimulation;

