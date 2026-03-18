import React, { useRef, useState, useEffect, useCallback} from 'react';
import type {ReactNode, MouseEventHandler, UIEvent } from "react";

import { motion, useInView } from 'motion/react';
import './AnimatedList.css';

interface AnimatedItemProps {
    children: ReactNode;
    delay?: number;
    index: number;
    onMouseEnter?: MouseEventHandler<HTMLDivElement>;
    onClick?: MouseEventHandler<HTMLDivElement>;
}

const AnimatedItem: React.FC<AnimatedItemProps> = ({ children, delay = 0, index, onMouseEnter, onClick }) => {
    const ref = useRef<HTMLDivElement>(null);
    const inView = useInView(ref, { amount: 0.5, once: false });
    return (
        <motion.div
            ref={ref}
            data-index={index}
            onMouseEnter={onMouseEnter}
            onClick={onClick}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={inView ? { scale: 1, opacity: 1 } : { scale: 0.7, opacity: 0 }}
            transition={{ duration: 0.09, delay }}
            style={{ marginBottom: '1rem', cursor: 'pointer' }}
        >
            {children}
        </motion.div>
    );
};

interface AnimatedListProps {
    items?: ReactNode[];
    onItemSelect?: (index: number) => void;
    showGradients?: boolean;
    enableArrowNavigation?: boolean;
    className?: string;
    itemClassName?: string;
    displayScrollbar?: boolean;
    selectedIndices?: number[];
}

const AnimatedList: React.FC<AnimatedListProps> = ({
                                                       items = [],
                                                       onItemSelect,
                                                       showGradients = true,
                                                       enableArrowNavigation = true,
                                                       className = '',
                                                       itemClassName = '',
                                                       displayScrollbar = true,
                                                       selectedIndices = [],
                                                   }) => {
    const listRef = useRef<HTMLDivElement>(null);
    const [cursorIndex, setCursorIndex] = useState<number>(-1);
    const [keyboardNav, setKeyboardNav] = useState<boolean>(false);
    const [topGradientOpacity, setTopGradientOpacity] = useState<number>(0);
    const [bottomGradientOpacity, setBottomGradientOpacity] = useState<number>(1);

    const handleItemMouseEnter = useCallback((index: number) => {
        setCursorIndex(index);
    }, []);

    const handleItemClick = useCallback(
        (index: number) => {
            setCursorIndex(index);
            if (onItemSelect) {
                onItemSelect(index);
            }
        },
        [onItemSelect]
    );

    const handleScroll = useCallback((e: UIEvent<HTMLDivElement>) => {
        const target = e.target as HTMLDivElement;
        const { scrollTop, scrollHeight, clientHeight } = target;
        setTopGradientOpacity(Math.min(scrollTop / 50, 1));
        const bottomDistance = scrollHeight - (scrollTop + clientHeight);
        setBottomGradientOpacity(scrollHeight <= clientHeight ? 0 : Math.min(bottomDistance / 50, 1));
    }, []);

    useEffect(() => {
        if (!enableArrowNavigation) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
                e.preventDefault();
                setKeyboardNav(true);
                setCursorIndex(prev => Math.min(prev + 1, items.length - 1));
            } else if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
                e.preventDefault();
                setKeyboardNav(true);
                setCursorIndex(prev => Math.max(prev - 1, 0));
            } else if (e.key === 'Enter') {
                if (cursorIndex >= 0 && cursorIndex < items.length) {
                    e.preventDefault();
                    if (onItemSelect) {
                        onItemSelect(cursorIndex);
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [items, cursorIndex, onItemSelect, enableArrowNavigation]);

    useEffect(() => {
        if (!keyboardNav || cursorIndex < 0 || !listRef.current) return;
        const container = listRef.current;
        const selectedItem = container.querySelector(`[data-index="${cursorIndex}"]`) as HTMLElement | null;
        if (selectedItem) {
            const extraMargin = 50;
            const containerScrollTop = container.scrollTop;
            const containerHeight = container.clientHeight;
            const itemTop = selectedItem.offsetTop;
            const itemBottom = itemTop + selectedItem.offsetHeight;
            if (itemTop < containerScrollTop + extraMargin) {
                container.scrollTo({ top: itemTop - extraMargin, behavior: 'smooth' });
            } else if (itemBottom > containerScrollTop + containerHeight - extraMargin) {
                container.scrollTo({ top: itemBottom - containerHeight + extraMargin, behavior: 'smooth' });
            }
        }
        setKeyboardNav(false);
    }, [cursorIndex, keyboardNav]);

    return (
        <div className={`scroll-list-container ${className}`}>
            <div ref={listRef} className={`scroll-list ${!displayScrollbar ? 'no-scrollbar' : ''}`} onScroll={handleScroll}>
                {items.map((item, index) => (
                    <AnimatedItem
                        key={index}
                        delay={0.1}
                        index={index}
                        onMouseEnter={() => handleItemMouseEnter(index)}
                        onClick={() => handleItemClick(index)}
                    >
                        <div className={`item ${selectedIndices.includes(index) ? 'selected' : ''} ${cursorIndex === index ? 'hovered' : ''} ${itemClassName}`}>
                            <div className="item-text">{item}</div>
                        {/*    changed from <p> to <div>*/}
                        </div>
                    </AnimatedItem>
                ))}
            </div>
            {showGradients && (
                <>
                    <div className="top-gradient" style={{ opacity: topGradientOpacity }}></div>
                    <div className="bottom-gradient" style={{ opacity: bottomGradientOpacity }}></div>
                </>
            )}
        </div>
    );
};

export default AnimatedList;