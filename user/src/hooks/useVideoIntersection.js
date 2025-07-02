// hooks/useVideoIntersection.js
import { useEffect, useRef, useState } from 'react';

export const useVideoIntersection = (options = {}) => {
    const [isIntersecting, setIsIntersecting] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const elementRef = useRef(null);

    useEffect(() => {
        const element = elementRef.current;
        if (!element) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                const isInView = entry.isIntersecting;
                setIsIntersecting(isInView);

                // Chỉ set visible = true khi element hiển thị ít nhất 50% trong viewport
                if (isInView && entry.intersectionRatio >= 0.5) {
                    setIsVisible(true);
                } else {
                    setIsVisible(false);
                }
            },
            {
                threshold: [0, 0.5, 1], // Trigger ở 0%, 50%, và 100%
                rootMargin: '-50px 0px', // Chỉ trigger khi cách viewport 50px
                ...options
            }
        );

        observer.observe(element);

        return () => {
            if (element) {
                observer.unobserve(element);
            }
        };
    }, []);

    return { elementRef, isIntersecting, isVisible };
};