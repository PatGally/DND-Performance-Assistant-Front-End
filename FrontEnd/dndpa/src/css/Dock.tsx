'use client';

import {
    motion,
    MotionValue,
    useMotionValue,
    useSpring,
    useTransform,
    type SpringOptions,
    AnimatePresence
} from 'motion/react';
import React, { Children, cloneElement, useEffect, useMemo, useRef, useState } from 'react';

export type DockItemData = {
    icon: React.ReactNode;
    label: React.ReactNode;
    onClick: () => void;
    className?: string;
};

export type DockProps = {
    items: DockItemData[];
    className?: string;
    distance?: number;
    panelHeight?: number;
    baseItemSize?: number;
    dockHeight?: number;
    magnification?: number;
    spring?: SpringOptions;
};

type DockItemProps = {
    className?: string;
    children: React.ReactNode;
    onClick?: () => void;
    mouseY: MotionValue<number>;
    spring: SpringOptions;
    distance: number;
    baseItemSize: number;
    magnification: number;
};

function DockItem({
                      children,
                      className = '',
                      onClick,
                      mouseY,
                      spring,
                      distance,
                      magnification,
                      baseItemSize
                  }: DockItemProps) {
    const ref = useRef<HTMLDivElement>(null);
    const isHovered = useMotionValue(0);

    const mouseDistance = useTransform(mouseY, val => {
        const rect = ref.current?.getBoundingClientRect() ?? {
            y: 0,
            height: baseItemSize
        };
        return val - rect.y - baseItemSize / 2;
    });

    const targetSize = useTransform(
        mouseDistance,
        [-distance, 0, distance],
        [baseItemSize, magnification, baseItemSize]
    );
    const size = useSpring(targetSize, spring);

    return (
        <motion.div //this controls color of bg of icon
            ref={ref}
            style={{
                width: size,
                height: size,
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '10px',
                backgroundColor: 'lavender',
                // backgroundColor: "rgba(15, 24, 40, 0.85)",
                // border: '1px solid #222',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
                cursor: 'pointer',
                outline: 'none',
                flexShrink: 0,
            }}
            onHoverStart={() => isHovered.set(1)}
            onHoverEnd={() => isHovered.set(0)}
            onFocus={() => isHovered.set(1)}
            onBlur={() => isHovered.set(0)}
            onClick={onClick}
            className={className}
            tabIndex={0}
            role="button"
            aria-haspopup="true"
        >
            {Children.map(children, child =>
                React.isValidElement(child)
                    ? cloneElement(child as React.ReactElement<{ isHovered?: MotionValue<number> }>, { isHovered })
                    : child
            )}
        </motion.div>
    );
}

type DockLabelProps = {
    className?: string;
    children: React.ReactNode;
    isHovered?: MotionValue<number>;
};

function DockLabel({ children, className = '', isHovered }: DockLabelProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (!isHovered) return;
        const unsubscribe = isHovered.on('change', latest => {
            setIsVisible(latest === 1);
        });
        return () => unsubscribe();
    }, [isHovered]);

    return (
        // pop up box for name of icon
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6 }}
                    transition={{ duration: 0.2 }}
                    className={className}
                    role="tooltip"
                    style={{
                        position: 'absolute',
                        left: 'calc(100% + 0.6rem)',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 'fit-content',
                        whiteSpace: 'pre',
                        borderRadius: '0.375rem',
                        border: '1px solid #222',
                        // backgroundColor: '#060010',
                        backgroundColor: "rgba(15, 24, 40, 0.85)",
                        padding: '0.125rem 0.5rem',
                        fontSize: '0.75rem',
                        color: '#fff',
                        pointerEvents: 'none',
                        zIndex: 999,
                    }}
                >
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    );
}

type DockIconProps = {
    className?: string;
    children: React.ReactNode;
    isHovered?: MotionValue<number>;
};

function DockIcon({ children, className = '' }: DockIconProps) {
    return (
        <div
            className={className}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
            {children}
        </div>
    );
}

export default function Dock({
                                 items,
                                 className = '',
                                 spring = { mass: 0.1, stiffness: 150, damping: 12 },
                                 magnification = 70,
                                 distance = 150,
                                 panelHeight = 68,
                                 dockHeight = 256,
                                 baseItemSize = 50
                             }: DockProps) {
    const mouseY = useMotionValue(Infinity);
    const isHovered = useMotionValue(0);

    const maxWidth = useMemo(
        () => Math.max(dockHeight, magnification + magnification / 2 + 4),
        [magnification, dockHeight]
    );

    // Width of the outer container expands on hover (equivalent of height in original)
    const widthRow = useTransform(isHovered, [0, 1], [panelHeight, maxWidth]);
    const width = useSpring(widthRow, spring);

    return (
        <motion.div
            style={{
                width,
                scrollbarWidth: 'none',
                display: 'flex',
                alignItems: 'center',
            }}
        >
            <motion.div
                onMouseMove={({ pageY }) => { //removing bg color here
                    //takes away weird bg you didn't want
                    isHovered.set(1);
                    mouseY.set(pageY);
                }}
                onMouseLeave={() => {
                    isHovered.set(0);
                    mouseY.set(Infinity);
                }}
                className={className}
                style={{
                    width: panelHeight,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '1rem',
                    borderRadius: '1rem',
                    // backgroundColor: '#060010',
                    // backgroundColor: "rgba(15, 24, 40, 0.85)",
                    // border: '1px solid #222',
                    padding: '0.5rem 0',
                }}
                role="toolbar"
                aria-label="Application dock"
            >
                {items.map((item, index) => (
                    <DockItem
                        key={index}
                        onClick={item.onClick}
                        className={item.className}
                        mouseY={mouseY}
                        spring={spring}
                        distance={distance}
                        magnification={magnification}
                        baseItemSize={baseItemSize}
                    >
                        <DockIcon>{item.icon}</DockIcon>
                        <DockLabel>{item.label}</DockLabel>
                    </DockItem>
                ))}
            </motion.div>
        </motion.div>
    );
}