import type {RefObject, Touch, TouchEvent} from "react";
import {clampPan, applyTransform} from './panningHelpers.ts'

const TAP_MOVE_THRESHOLD = 15;

function pinchDistance(t1: Touch, t2: Touch): number {
    return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
}

function pinchMidpoint(t1: Touch, t2: Touch): { x: number; y: number } {
    return {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2,
    };
}

export function onTouchStart(
    e: React.TouchEvent<HTMLDivElement>,
    isPanning: RefObject<boolean>,
    lastPanPos: RefObject<{ x: number; y: number }>,
    lastPinchDist: RefObject<number | null>,
    lastPinchMid: RefObject<{ x: number; y: number } | null>,
    touchStartPos: RefObject<{ x: number; y: number } | null>,
    didPan: RefObject<boolean>,
): void {
    if (e.touches.length === 1) {
        if ((e.target as HTMLElement).tagName === "IMG") return;

        const t = e.touches[0];
        touchStartPos.current = { x: t.clientX, y: t.clientY };
        lastPanPos.current = { x: t.clientX, y: t.clientY };
        didPan.current = false;
        isPanning.current = false;
        lastPinchDist.current = null;
        lastPinchMid.current = null;
    } else if (e.touches.length === 2) {
        isPanning.current = false;
        didPan.current = true;
        lastPinchDist.current = pinchDistance(e.touches[0], e.touches[1]);
        lastPinchMid.current = pinchMidpoint(e.touches[0], e.touches[1]);
    }
}

export function onTouchMove(
    e: TouchEvent<HTMLDivElement>,
    isPanning: RefObject<boolean>,
    lastPanPos: RefObject<{ x: number; y: number }>,
    lastPinchDist: RefObject<number | null>,
    lastPinchMid: RefObject<{ x: number; y: number } | null>,
    touchStartPos: RefObject<{ x: number; y: number } | null>,
    didPan: RefObject<boolean>,
    mapViewportRef: RefObject<HTMLDivElement | null>,
    mapContentRef: RefObject<HTMLDivElement | null>,
    pan: RefObject<{ x: number; y: number }>,
    zoom: RefObject<number>,
    mapNaturalWidth: number,
    mapNaturalHeight: number,
    MIN_ZOOM: number,
    MAX_ZOOM: number,
): void {
    if (!mapViewportRef.current) return;
    const rect = mapViewportRef.current.getBoundingClientRect();

    if (e.touches.length === 1) {
        const t = e.touches[0];

        if (!isPanning.current) {
            if (!touchStartPos.current) return;
            const totalDx = t.clientX - touchStartPos.current.x;
            const totalDy = t.clientY - touchStartPos.current.y;
            if (Math.hypot(totalDx, totalDy) < TAP_MOVE_THRESHOLD) return;
            isPanning.current = true;
            didPan.current = true;
            lastPanPos.current = { x: t.clientX, y: t.clientY };
            return;
        }

        const dx = t.clientX - lastPanPos.current.x;
        const dy = t.clientY - lastPanPos.current.y;
        lastPanPos.current = { x: t.clientX, y: t.clientY };
        pan.current = clampPan(
            pan.current.x + dx,
            pan.current.y + dy,
            zoom.current,
            rect,
            mapNaturalWidth,
            mapNaturalHeight,
        );
        applyTransform(mapContentRef, pan, zoom);
        return;
    }

    if (
        e.touches.length === 2 &&
        lastPinchDist.current !== null &&
        lastPinchMid.current !== null
    ) {
        const dist = pinchDistance(e.touches[0], e.touches[1]);
        const mid = pinchMidpoint(e.touches[0], e.touches[1]);

        const factor = dist / lastPinchDist.current;
        const nextZoom = Math.min(
            MAX_ZOOM,
            Math.max(MIN_ZOOM, zoom.current * factor),
        );
        const ratio = nextZoom / zoom.current;

        const anchorX = mid.x - rect.left;
        const anchorY = mid.y - rect.top;

        let nextX = anchorX - ratio * (anchorX - pan.current.x);
        let nextY = anchorY - ratio * (anchorY - pan.current.y);

        nextX += mid.x - lastPinchMid.current.x;
        nextY += mid.y - lastPinchMid.current.y;

        zoom.current = nextZoom;
        pan.current = clampPan(
            nextX,
            nextY,
            nextZoom,
            rect,
            mapNaturalWidth,
            mapNaturalHeight,
        );
        applyTransform(mapContentRef, pan, zoom);

        lastPinchDist.current = dist;
        lastPinchMid.current = mid;
    }
}

export function onTouchEnd(
    e: TouchEvent<HTMLDivElement>,
    isPanning: RefObject<boolean>,
    lastPanPos: RefObject<{ x: number; y: number }>,
    lastPinchDist: RefObject<number | null>,
    lastPinchMid: RefObject<{ x: number; y: number } | null>,
    touchStartPos: RefObject<{ x: number; y: number } | null>,
    didPan: RefObject<boolean>,
    suppressNextClick: RefObject<boolean>,
    mapViewportRef: RefObject<HTMLDivElement | null>,
): void {
    if (e.touches.length === 0) {
        if (didPan.current) {

            suppressNextClick.current = true;
            setTimeout(() => {
                suppressNextClick.current = false;
            }, 400);
        }
        isPanning.current = false;
        didPan.current = false;
        touchStartPos.current = null;
        lastPinchDist.current = null;
        lastPinchMid.current = null;
        if (mapViewportRef.current) mapViewportRef.current.style.cursor = "grab";
    } else if (e.touches.length === 1) {
        isPanning.current = true;
        lastPanPos.current = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY,
        };
        touchStartPos.current = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY,
        };
        lastPinchDist.current = null;
        lastPinchMid.current = null;
    }
}