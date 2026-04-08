import { useEffect, type RefObject } from 'react';

export function useFocusTrap(
  ref: RefObject<HTMLElement | null>,
  isActive: boolean,
  triggerRef?: RefObject<HTMLElement | null>
) {
  useEffect(() => {
    if (!isActive || !ref.current) return;

    const el = ref.current;
    
    // Select all potentially focusable elements
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',');

    const focusableElements = el.querySelectorAll<HTMLElement>(focusableSelectors);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    let rafId: number;
    let attempts = 0;

    const attemptFocus = () => {
      // Small failsafe to prevent infinite loops if element remains un-focusable
      if (attempts > 10) return;
      attempts++;
      
      const target = firstElement || el;
      target.focus();

      if (document.activeElement !== target) {
        rafId = requestAnimationFrame(attemptFocus);
      }
    };

    rafId = requestAnimationFrame(attemptFocus);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    };

    el.addEventListener('keydown', handleKeyDown);

    return () => {
      cancelAnimationFrame(rafId);
      el.removeEventListener('keydown', handleKeyDown);
      // Return focus to trigger
      if (triggerRef?.current) {
        triggerRef.current.focus();
      }
    };
  }, [isActive, ref, triggerRef]);
}