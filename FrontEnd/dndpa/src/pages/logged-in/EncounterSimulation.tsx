import {useCallback, useEffect, useRef, useState} from "react";
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
import {basicActionGet} from "../../api/BasicActionGet.ts";

import type {Creature, GridCoord} from "../../types/creature.ts";
import type {CreatureAction} from "../../types/action.ts";
import type {
    Encounter, ActionRequestDraft,
    ActionExecutionSession, ManualDraftState, ManualAffectedCreature,
    RecommendationTarget, AoeToken, ManualAoePlacement,
    PendingPreTurnResolution
} from "../../types/SimulationTypes.ts";
import {
    normalizeGridCoords, isRecommendationAoeTarget, normalizeAoeShape,
    findActionByName, resolveAoeTokenImageName, extractActionTiming,
    getClosestAnchorToCaster, isDirectionalShape, feetToCells,
    resolveAoeTokenImageNameFromStats, buildAoeTokenFromStats, getAoeTargetsFromPositioning, buildManualAoePositioning
} from "../../utils/aoeHelpers.ts";

import ExitSimulation from "../../components/ActiveEncounter/ExitSimulation.tsx";
import { Card } from "react-bootstrap";
import Orb from '../../css/Orb.tsx';
import {actionsGet} from "../../api/ActionsGet.ts";
import {
    buildPreTurnSession,
    getActorByConcentrationID,
    syncPreTurnQueueFromCreature
} from "../../utils/PreTurnHelpers.ts";
import {buildRequiredInputs, extractActionEffects, normalizeAction} from "../../utils/actionHelpers.ts";

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

function EncounterSimulation() {
    const location = useLocation();
    const eid = location.state?.eid;

    //Side components
    const [initiativeOpen, setInitiativeOpen] = useState(false);
    const [initiativeRefreshKey, setInitiativeRefreshKey] = useState(0);
    const [recommendRefreshKey, setRecommendRefreshKey] = useState(0);
    const latestHoverRequestRef = useRef(0);
    const didHydrateInitialPreTurnRef = useRef(false);
    const [actionOpen, setActionOpen] = useState(false);

    //Pre/post enc logic
    const [encStart, setEncStart] = useState(false);
    const [activeEncounter, setActiveEncounter] = useState(true);
    const [endOfEncounter, setEndOfEncounter] = useState(false);

    const [encounterData, setEncounterData] = useState<Encounter>();
    const [loadingEncounter, setLoadingEncounter] = useState(true);
    const [encounterError, setEncounterError] = useState<string | null>(null);
    const [currentTurnCreature, setCurrentTurnCreature] = useState<Creature>();
    const [aoeTokens, setAoeTokens] = useState<AoeToken[]>([]);
    const [manualAoePlacement, setManualAoePlacement] = useState<ManualAoePlacement | null>(null);

    //selectedCID used for token selection
    const [selectedCID, setSelectedCID] = useState<string | null>(null);
    const [currentTurnActions, setCurrentTurnActions] = useState<CreatureAction[]>();
    //Locks the top three buttons
    const [actionExecutionSession, setActionExecutionSession] = useState<ActionExecutionSession>();
    const [handlingNextTurn, setHandlingNextTurn] = useState(false);
    const [preTurnQueue, setPreTurnQueue] = useState<PendingPreTurnResolution[]>([]);
    const [manualLock, setManualLock] = useState(false);
    const [manualMode, setManualMode] = useState(false);
    const [manualDraft, setManualDraft] = useState<ManualDraftState>({
      affectedCreatures: [],
    });
    const [initiativeExpandedCid, setInitiativeExpandedCid] = useState<string | null>(null);
    const hasPreTurnQueue = preTurnQueue.length > 0;

    // Lair Action state
    const [isLairAction, setIsLairAction] = useState(false);

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
                console.log("Enc", data);

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

              if (!didHydrateInitialPreTurnRef.current) {
                syncPreTurnQueueFromCreature(setPreTurnQueue, storedTurn);
                didHydrateInitialPreTurnRef.current = true;
              }
            }
        }
    }, [encounterData]);
    useEffect(() => {
      const storedAoeTokens = Array.isArray(
        (
          encounterData as
            | { mapdata?: { layers?: { aoeTokens?: unknown[] } } }
            | undefined
        )?.mapdata?.layers?.aoeTokens
      )
        ? (((encounterData as { mapdata?: { layers?: { aoeTokens?: unknown[] } } })
            ?.mapdata?.layers?.aoeTokens ?? []) as AoeToken[])
        : [];

      setAoeTokens((prev) => {
        const previewTokens = prev.filter((token) =>
          token.resultID.startsWith("preview:")
        );

        const merged = [...storedAoeTokens];

        for (const preview of previewTokens) {
          if (!merged.some((token) => token.resultID === preview.resultID)) {
            merged.push(preview);
          }
        }

        return merged;
      });
    }, [encounterData]);
    useEffect(() => {
      didHydrateInitialPreTurnRef.current = false;
    }, [eid]);
    useEffect(() => {
        console.log("currentTurnCreature changed:", currentTurnCreature);
        console.log("_isLairAction flag:", (currentTurnCreature as any)?._isLairAction);

        if (!currentTurnCreature) return;
        if ((currentTurnCreature as any)._isLairAction) {
            // Force manual mode, block ruleset
            setManualMode(true);
            setInitiativeOpen(true);
            setActionOpen(false);
            clearManualState();
            setManualLock(false);
            setIsLairAction(true);
            return;
        }

        setIsLairAction(false);
        loadActions();
    }, [currentTurnCreature, encounterData]);
    useEffect(() => {
        const el = mapViewportRef.current;
        if (!el) return;
        const handler = (e: WheelEvent) => e.preventDefault();
        el.addEventListener("wheel", handler, { passive: false });
        return () => el.removeEventListener("wheel", handler);
    }, []);
    useEffect(() => {
      if (!encounterData || !currentTurnCreature) return;
      if (manualMode) return;
      if (actionExecutionSession) return;

      const nextItem = preTurnQueue[0];
      if (!nextItem) return;
      console.log("Turn queue of", preTurnQueue);

      setManualLock(true);
      setActionExecutionSession(buildPreTurnSession(nextItem, currentTurnCreature));
    }, [preTurnQueue, encounterData, currentTurnCreature,
                                                manualMode, actionExecutionSession]);
    useEffect(() => {
        const loadEndOfEncounter = async (): Promise<void> => {
            const response = await axiosTokenInstance.get(`/encounter/${eid}/completed`)
            if (response.data.isEnd) {
                if (encounterData && !encounterData.completed) {
                    await axiosTokenInstance.get("/encounter/{eid}/setcompleted")
                }
                setEndOfEncounter(true);
            }
        }
        loadEndOfEncounter()
    }, [encounterData, currentTurnCreature])
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
    async function handleNextTurn() {
      const isLairActionTurn = (currentTurnCreature as any)?._isLairAction === true;

      if (handlingNextTurn || actionExecutionSession || !encounterData ||
          (!currentTurnCreature && !isLairActionTurn) || encStart ||
          !activeEncounter || !eid || hasPreTurnQueue || endOfEncounter) return;

      try {
        setHandlingNextTurn(true);

        const response = await axiosTokenInstance.get(`/encounter/${eid}/initiative/nextturn`);
        console.log("Next turn response:", response.data);

        const updatedEncounter = await getEncounter(eid);
        if (!updatedEncounter) {
          console.error("Failed to reload encounter after advancing turn.");
          return;
        }

        setEncounterData(updatedEncounter);

        const newCurrentTurnCreature = getCurrentTurnCreatureFromEncounter(updatedEncounter);
        console.log("About to set creature:", newCurrentTurnCreature);

        if (newCurrentTurnCreature) {
          setCurrentTurnCreature(newCurrentTurnCreature);
          syncPreTurnQueueFromCreature(setPreTurnQueue, newCurrentTurnCreature);
        } else if (isLairActionTurn) {
          console.warn("Sentinel missing but confirmed lair action turn.");
        } else {
          console.error("Could not determine current turn creature from updated encounter.");
          setCurrentTurnCreature(undefined);
          setPreTurnQueue([]);
        }
      } catch (error) {
        console.error("Failed to advance turn:", error);
      } finally {
        setInitiativeRefreshKey((prev) => prev + 1);
        setHandlingNextTurn(false);
        setManualLock(false);
      }
    }
    function handleTokenSelect(cid: string) {
        if (!encounterData || actionExecutionSession || hasPreTurnQueue) return;

        if (manualMode) {
            setInitiativeOpen(true);
            setInitiativeExpandedCid((prev) => (prev === cid ? null : cid));
            return;
        }

        setSelectedCID((prev) => (prev === cid ? null : cid));
    }
    async function handleGridCellClick(cellX: number, cellY: number) {
        const clickedCell: GridCoord = [cellX, cellY];
        if(endOfEncounter) return;

      if (manualAoePlacement && actionExecutionSession && encounterData) {
        console.log("handleGridCellClick for AOEs");

        if (manualAoePlacement.stage === "pick_anchor" && !manualAoePlacement.selfOrigin) {
          if (isDirectionalShape(manualAoePlacement.shape)) {
            setManualAoePlacement((prev) =>
              prev
                ? {
                    ...prev,
                    anchor: clickedCell,
                    stage: "pick_direction",
                  }
                : prev
            );
            return;
          }

          await commitManualAoePlacement(clickedCell, clickedCell);
          return;
        }

        if (manualAoePlacement.stage === "pick_direction" && manualAoePlacement.anchor) {
          await commitManualAoePlacement(manualAoePlacement.anchor, clickedCell);
          return;
        }

        if (manualAoePlacement.stage === "pick_anchor" && manualAoePlacement.selfOrigin && manualAoePlacement.anchor) {
          await commitManualAoePlacement(manualAoePlacement.anchor, clickedCell);
          return;
        }
      }

      if (manualMode) return;
      if (!selectedCID || !encounterData || actionExecutionSession || hasPreTurnQueue) return;

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
      }
      catch (error) {
        console.error("Movement simulation failed:", error);
      }
}
    async function handleGridCellHover(cellX: number, cellY: number) {
      if (!manualAoePlacement) return;

      console.log("In handleGridCellHover");
      const requestId = ++latestHoverRequestRef.current;
      const placementResultID = manualAoePlacement.resultID;

      const hoverCell: GridCoord = [cellX, cellY];

      let anchor = manualAoePlacement.anchor;

      if (manualAoePlacement.stage === "pick_anchor" && !manualAoePlacement.selfOrigin) {
        anchor = hoverCell;
      }

      if (!anchor) return;

      const positioning = await buildManualAoePositioning({
        shape: manualAoePlacement.shape,
        radiusCells: manualAoePlacement.radiusCells,
        anchor,
        cursor: hoverCell
      });

      if (requestId !== latestHoverRequestRef.current) return;
      if (!manualAoePlacement || manualAoePlacement.resultID !== placementResultID) return;

      const previewToken = buildAoeTokenFromStats({
        name: manualAoePlacement.name,
        cid: manualAoePlacement.cid,
        shape: manualAoePlacement.shape,
        timing: manualAoePlacement.timing,
        token_image: manualAoePlacement.token_image,
        resultID: manualAoePlacement.resultID,
        anchor,
        positioning,
      });

      upsertAoePreviewToken(previewToken);
    }
    const buildRecommendationAoeToken = useCallback((
          recommendation: { name: string; target: RecommendationTarget },
          previewResultID: string
    ): AoeToken | null => {
          if (!currentTurnCreature || !currentTurnActions) return null;
          if (!isRecommendationAoeTarget(recommendation.target)) return null;

          const positioning = normalizeGridCoords(recommendation.target.positioning);
          if (positioning.length === 0) return null;

          const action = findActionByName(recommendation.name, currentTurnActions);
          if (!action) return null;

          const casterPosition = normalizeGridCoords(
            getCreaturePosition(currentTurnCreature) as unknown
          );

          const normalizedShape = normalizeAoeShape(normalizeAction(action).shape);

            return {
              name: recommendation.name,
              positioning,
              token_image: resolveAoeTokenImageName(action, normalizedShape),
              resultID: previewResultID,
              cid: getCreatureCid(currentTurnCreature),
              anchor: getClosestAnchorToCaster(positioning, casterPosition),
              timing: extractActionTiming(action),
              shape: normalizedShape,
            };
        }, [currentTurnCreature, currentTurnActions]);
    function upsertAoePreviewToken(token: AoeToken) {
        console.log("Upsert AOE token");
        setAoeTokens((prev) => {
        const withoutOld = prev.filter((existing) => existing.resultID !== token.resultID);
        return [...withoutOld, token];
      });
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

        if (normalized.targetCount === -1 || normalized.targetCount === -2) {
            console.log("AOE logic for handleActionSubmission");
            //Manual placement logic to get targets
          const actorCid = currentTurnCreature ? getCreatureCid(currentTurnCreature) : "";
          const shape = normalizeAoeShape(normalized.shape);
          const selfOrigin = normalized.targetCount === -2;
          const actorPosition = normalizeGridCoords(
            currentTurnCreature ? (getCreaturePosition(currentTurnCreature) as unknown) : []
          );

          let timing = "instantaneous";

          if (
              ("lingEffect" in action && action.lingEffect) ||
              ("lingSave" in action && action.lingSave)
            ) {
              timing = "lingering";
            }

          const autoAnchor = selfOrigin ? actorPosition[0] ?? null : null;

          const placement: ManualAoePlacement = {
            resultID: draft.resultID,
            name: normalized.name,
            cid: actorCid,
            shape,
            radiusCells: feetToCells(normalized.radius),
            rangeCells: feetToCells(normalized.range),
            timing, // or derive from original action if you want lingering support here too
            token_image: resolveAoeTokenImageNameFromStats(shape, normalized.damageType),
            selfOrigin,
            anchor: autoAnchor,
            stage: selfOrigin && isDirectionalShape(shape) ? "pick_direction" : "pick_anchor",
          };

          console.log("manualAoePlacement", placement);

          setManualAoePlacement(placement);
        }

    }
    async function handlePASubmission(
      name: string,
      prob: number,
      eDam: number,
      impact: number,
      targets: RecommendationTarget,
      previewResultID?: string) {
      if (!currentTurnCreature || !encounterData || !currentTurnActions) return;

      let action = findActionByName(name, currentTurnActions);
      if (!action) {
        action = await basicActionGet(name);
      }
      if (!action) {
        console.error("Action does not exist in statblock!");
        return;
      }

      setManualLock(true);

      const targetNames = Array.isArray(targets) ? targets : targets.targetsHit;
      const resolvedTargets = targetNames
        .map((target) => resolveTargetToCid(target, encounterData))
        .filter((target): target is string => target !== null);

      const { conditions, statusEffects } = extractActionEffects(action);
      const normalized = normalizeAction(action);
      const requiredInputs = buildRequiredInputs(normalized);

      let resultID = "-1";
      try {
        resultID = await fetchUUID();
      } catch (err) {
        console.error("Failed to fetch CID", err);
      }

      if (previewResultID) {
        setAoeTokens((prev) =>
          prev.map((token) =>
            token.resultID === previewResultID ? { ...token, resultID } : token
          )
        );
      }

      const draft: ActionRequestDraft = {
        resultID,
        actor: currentTurnCreature ? getCreatureName(currentTurnCreature) : "",
        action: isSpellAction(action) ? action.spellname : action.name,
        actionType: isSpellAction(action)
          ? `Lvl ${action.level} Spell`
          : isMonsterAction(action)
            ? "MonAction"
            : "Weapon",
        actionProb: prob,
        actionEDam: eDam,
        actionImpact: impact,
        targets: resolvedTargets,
        conditions,
        statusEffects,
        outcome: {
          rollResults: [],
          diceResults: [],
        },
        extraOutcome: {
          extraRollResults: [],
          extraDiceResults: [],
        },
        timestamp: "",
      };

      const actionSession = {
        action: normalized,
        requiredInputs,
        draft,
        error: "",
      };

      setActionExecutionSession(actionSession);
    }
    async function handleActionExecution(finalDraft: ActionRequestDraft) {
          if (!eid || !currentTurnCreature || !encounterData || !actionExecutionSession) return;

          const executedAoeToken = aoeTokens.find(
            (token) => token.resultID === finalDraft.resultID
          );

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

            const payload = {
              ...finalDraft,
              token: executedAoeToken ?? null,
            };

            console.log("Final Draft payload", payload);

            await axiosTokenInstance.post(`/encounter/${eid}/simulate/ruleset`, payload);

            const updatedEncounter = await getEncounter(eid);
            if (!updatedEncounter) {
              console.error("Failed to reload encounter after action execution.");
              return;
            }

            setEncounterData(updatedEncounter);

            setAoeTokens((prev) => {
              const withoutExecuted = prev.filter(
                (token) => token.resultID !== finalDraft.resultID
              );

              if (executedAoeToken?.timing === "lingering") {
                return [...withoutExecuted, executedAoeToken];
              }

              return withoutExecuted;
            });

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
    async function handlePreTurnExecution(finalDraft: ActionRequestDraft) {
      if (!eid || !currentTurnCreature || !encounterData) return;

      const activeItem = preTurnQueue[0];
      if (!activeItem) return;

      try {
        setManualLock(true);

        const allCreatures: Creature[] = [
          ...(encounterData.players ?? []),
          ...(encounterData.monsters ?? []),
        ];

        const resolvedActor = getActorByConcentrationID(finalDraft.resultID, allCreatures);

        const cleanedDraft: ActionRequestDraft = {
          ...finalDraft,
          actor: resolvedActor || finalDraft.actor,
          conditions: [],
          statusEffects: [],
        };

        const response = await axiosTokenInstance.post(
          `/encounter/${eid}/simulate/preturn`,
          {
            ...cleanedDraft,
            preTurnMeta: activeItem.effectName,
          }
        );

        const savedOut = response?.data?.savedOut === true;

        if (activeItem.effectName === "lingsave" && savedOut) {
          await axiosTokenInstance.delete(
            `/encounter/${eid}/creature/${getCreatureCid(currentTurnCreature)}/status-effect/${cleanedDraft.resultID}`
          );
        }

        const updatedEncounter = await getEncounter(eid);
        if (!updatedEncounter) {
          console.error("Failed to reload encounter after pre-turn execution.");
          return;
        }

        const updatedCreature = getCurrentTurnCreatureFromEncounter(updatedEncounter);

        setPreTurnQueue((prev) => prev.slice(1));

        setActionExecutionSession(undefined);

        setEncounterData(updatedEncounter);
        setCurrentTurnCreature(updatedCreature);

        setInitiativeRefreshKey((prev) => prev + 1);
      } catch (error) {
        console.error("Failed to execute pre-turn effect:", error);
        setActionExecutionSession((prev) =>
          prev ? { ...prev, error: "Pre-turn execution failed." } : prev
        );
      } finally {
        setManualLock(false);
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
      clearManualAoePreview(actionExecutionSession?.draft.resultID)
      setManualMode(true);
      setInitiativeOpen(true);
      setActionOpen(false);
      clearManualState();
    }
    function handlePreTurnBack() {
      clearManualAoePreview(actionExecutionSession?.draft.resultID);
      setActionExecutionSession(undefined);
      setManualLock(false);
      setPreTurnQueue((prev) => prev.slice(1));
    }
    async function commitManualAoePlacement(
      anchor: GridCoord,
      cursor: GridCoord
    ) {
      if (!manualAoePlacement || !encounterData) return;

      const positioning = await buildManualAoePositioning({
        shape: manualAoePlacement.shape,
        radiusCells: manualAoePlacement.radiusCells,
        anchor,
        cursor
      });

      const targetCids = getAoeTargetsFromPositioning(
        positioning,
        encounterData,
        manualAoePlacement.cid
      );

      const token = buildAoeTokenFromStats({
        name: manualAoePlacement.name,
        cid: manualAoePlacement.cid,
        shape: manualAoePlacement.shape,
        timing: manualAoePlacement.timing,
        token_image: manualAoePlacement.token_image,
        resultID: manualAoePlacement.resultID,
        anchor,
        positioning,
      });

      upsertAoePreviewToken(token);

      setActionExecutionSession((prev) =>
        prev
          ? {
              ...prev,
              draft: {
                ...prev.draft,
                targets: targetCids,
              },
            }
          : prev
      );

      setManualAoePlacement(null);
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
    function clearManualAoePreview(resultID?: string) {
        latestHoverRequestRef.current += 1;

          if (resultID) {
            setAoeTokens((prev) =>
              prev.filter((token) => token.resultID !== resultID)
            );
          }

          setManualAoePlacement(null);
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
    const handleMapSizeLoaded = useCallback((w: number, h: number) => {
    setMapNaturalWidth((prev) => (prev === w ? prev : w));
    setMapNaturalHeight((prev) => (prev === h ? prev : h));
}, []);

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
                    {activeEncounter && !endOfEncounter && (currentTurnCreature || isLairAction) && (
                        <>
                            {currentTurnCreature ? (
                                <p className="mb-0">
                                    Current Turn: {isPlayerCreature(currentTurnCreature)
                                    ? currentTurnCreature.stats.name
                                    : currentTurnCreature.name}
                                </p>
                            ) : (
                                <p className="mb-0">Lair Action</p>
                            )}

                            <button
                                disabled={isLairAction || actionExecutionSession !== undefined}
                                onClick={() => {
                                    setManualMode(false);
                                    clearManualState();
                                }}
                            >
                                Ruleset
                            </button>

                            <button
                                disabled={actionExecutionSession !== undefined || handlingNextTurn || manualLock}
                                onClick={() => setManualState()}
                            >
                                Manual
                            </button>

                            {manualMode && (
                                <button onClick={handleManualSimulate}>Submit</button>
                            )}

                            {!manualMode && (
                                <button
                                    disabled={actionExecutionSession !== undefined || hasPreTurnQueue}
                                    onClick={handleNextTurn}
                                >
                                    Next Turn
                                </button>
                            )}
                        </>
                    )}

                    {encStart && !activeEncounter && (
                        <button onClick={simStart}>Start!</button>
                    )}

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
                                  aoeTokens={aoeTokens}
                                  manualMode={manualMode}
                                  encStart={encStart}
                                  activeEncounter={activeEncounter}
                                  selectedCID={selectedCID}
                                  isAoePlacementActive={manualAoePlacement !== null}
                                  onTokenSelect={handleTokenSelect}
                                  onGridCellClick={handleGridCellClick}
                                  onGridCellHover={handleGridCellHover}
                                  onMapSizeLoaded={handleMapSizeLoaded}
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
                            width: "20%",
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

                    {!actionOpen && !hasPreTurnQueue && !manualMode && !endOfEncounter && (
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
                    {actionOpen && encounterData && currentTurnCreature && !hasPreTurnQueue
                        && !manualMode && !endOfEncounter && (
                        <div style={{
                            position: "absolute",
                            top: 0,
                            right: 0,
                            height: "100%",
                            width: "20%",
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
                                        {hasPreTurnQueue && encounterData && !endOfEncounter && actionExecutionSession ? (
                                          <>
                                            <Card.Title>Resolve Pre-Turn Effects</Card.Title>
                                            <Card.Text>
                                              {preTurnQueue.length} remaining for this creature.
                                            </Card.Text>

                                            <InputHandler
                                              encounter={encounterData}
                                              actionSession={actionExecutionSession}
                                              setActionExecutionSession={setActionExecutionSession}
                                              setManualLock={setManualLock}
                                              clearManualAoePreview={clearManualAoePreview}
                                              handleActionExecution={handlePreTurnExecution}
                                              aoePlacementStage="ready"
                                              onExit={handlePreTurnBack}
                                            />
                                          </>
                                        ) : manualMode ? (
                                            <Card.Text>Manual Mode</Card.Text>
                                        ) : encounterData && actionExecutionSession ? (
                                            <InputHandler
                                              encounter={encounterData}
                                              actionSession={actionExecutionSession}
                                              setActionExecutionSession={setActionExecutionSession}
                                              setManualLock={setManualLock}
                                              clearManualAoePreview={clearManualAoePreview}
                                              handleActionExecution={handleActionExecution}
                                              aoePlacementStage={manualAoePlacement?.stage ?? "ready"}
                                            />
                                        ) : !endOfEncounter ? (
                                            <Recommendation
                                                  eid={eid}
                                                  cid={getCreatureCid(currentTurnCreature)}
                                                  setAoeTokens={setAoeTokens}
                                                  buildRecommendationAoeToken={buildRecommendationAoeToken}
                                                  handlePASubmission={handlePASubmission}
                                                  key={`${eid}-${recommendRefreshKey}`}
                                                />
                                        ) : (
                                            <>
                                                <h5>End of Encounter!</h5>
                                            </>
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

