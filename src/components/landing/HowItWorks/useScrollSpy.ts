import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for the 3-step How It Works scroll-spy section.
 * Observes step trigger elements as the user scrolls, updating the activeStep (0, 1, 2).
 * Provides a scrollToStep method to navigate cleanly on click.
 */
export function useScrollSpy(stepCount: number) {
  const [activeStep, setActiveStep] = useState<number>(0);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  const registerStepRef = useCallback((index: number) => (el: HTMLDivElement | null) => {
    stepRefs.current[index] = el;
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') return;

    const observers: IntersectionObserver[] = [];

    stepRefs.current.forEach((el, index) => {
      if (!el) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveStep(index);
            }
          });
        },
        {
          rootMargin: '-30% 0px -40% 0px',
          threshold: 0.2,
        },
      );

      observer.observe(el);
      observers.push(observer);
    });

    return () => {
      observers.forEach((obs) => obs.disconnect());
    };
  }, [stepCount]);

  const scrollToStep = useCallback((index: number) => {
    const el = stepRefs.current[index];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setActiveStep(index);
    }
  }, []);

  return {
    activeStep,
    setActiveStep,
    registerStepRef,
    scrollToStep,
  };
}
