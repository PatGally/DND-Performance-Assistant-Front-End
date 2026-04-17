import type {RefObject, MouseEvent, WheelEvent} from "react";

export function clampPan(
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

export const applyTransform = (mapContentRef : RefObject<HTMLDivElement | null>,
                               pan : RefObject<{ x : number, y : number }>,
                               zoom : RefObject<number>) => {
    if (mapContentRef.current) {
            mapContentRef.current.style.transform =
                `translate(${pan.current.x}px, ${pan.current.y}px) scale(${zoom.current})`;
        }
    };

export function onPanStart(
  e: MouseEvent<HTMLDivElement>,
  isPanning: RefObject<boolean>,
  lastPanPos: RefObject<{ x: number; y: number }>,
  mapViewportRef: RefObject<HTMLDivElement | null>
): void {
  if ((e.target as HTMLElement).tagName === "IMG") return;
  isPanning.current = true;
  if (mapViewportRef.current) mapViewportRef.current.style.cursor = "grabbing";
  lastPanPos.current = { x: e.clientX, y: e.clientY };
}

export function onPanMove(
  e: MouseEvent<HTMLDivElement>,
  isPanning: RefObject<boolean>,
  lastPanPos: RefObject<{ x: number; y: number }>,
  mapViewportRef: RefObject<HTMLDivElement | null>,
  mapContentRef: RefObject<HTMLDivElement | null>,
  pan: RefObject<{ x: number; y: number }>,
  zoom: RefObject<number>,
  mapNaturalWidth: number,
  mapNaturalHeight: number
): void {
  if (!isPanning.current || !mapViewportRef.current) return;

  const rect = mapViewportRef.current.getBoundingClientRect();
  const dx = e.clientX - lastPanPos.current.x;
  const dy = e.clientY - lastPanPos.current.y;

  lastPanPos.current = { x: e.clientX, y: e.clientY };
  pan.current = clampPan(
    pan.current.x + dx,
    pan.current.y + dy,
    zoom.current,
    rect,
    mapNaturalWidth,
    mapNaturalHeight
  );

  applyTransform(mapContentRef, pan, zoom);
}

export function onPanEnd(
  isPanning: RefObject<boolean>,
  mapViewportRef: RefObject<HTMLDivElement | null>
): void {
  isPanning.current = false;
  if (mapViewportRef.current) mapViewportRef.current.style.cursor = "grab";
}

export function onWheel(
  e: WheelEvent<HTMLDivElement>,
  mapViewportRef: RefObject<HTMLDivElement | null>,
  mapContentRef: RefObject<HTMLDivElement | null>,
  pan: RefObject<{ x: number; y: number }>,
  zoom: RefObject<number>,
  mapNaturalWidth: number,
  mapNaturalHeight: number,
  MIN_ZOOM: number,
  MAX_ZOOM: number
): void {
  if (!mapViewportRef.current) return;

  const rect = mapViewportRef.current.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  const factor = e.deltaY < 0 ? 1.06 : 0.95;
  const nextZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom.current * factor));
  const ratio = nextZoom / zoom.current;
  const nextX = mouseX - ratio * (mouseX - pan.current.x);
  const nextY = mouseY - ratio * (mouseY - pan.current.y);

  zoom.current = nextZoom;
  pan.current = clampPan(nextX, nextY, nextZoom, rect, mapNaturalWidth, mapNaturalHeight);
  applyTransform(mapContentRef, pan, zoom);
}