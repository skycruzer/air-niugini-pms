/**
 * @fileoverview Accessibility Utilities
 * Helper functions and hooks for improving accessibility (A11Y)
 */

import { useEffect, useRef } from 'react';

/**
 * Announce message to screen readers
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Hook to manage focus trap in modals
 */
export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          lastFocusable?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          firstFocusable?.focus();
          e.preventDefault();
        }
      }
    };

    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Emit custom event that can be listened to
        container.dispatchEvent(new CustomEvent('escape-key'));
      }
    };

    container.addEventListener('keydown', handleTabKey as EventListener);
    container.addEventListener('keydown', handleEscapeKey as EventListener);

    // Focus first element on mount
    firstFocusable?.focus();

    return () => {
      container.removeEventListener('keydown', handleTabKey as EventListener);
      container.removeEventListener('keydown', handleEscapeKey as EventListener);
    };
  }, [isActive]);

  return containerRef;
}

/**
 * Hook to announce route changes to screen readers
 */
export function useRouteAnnouncement() {
  useEffect(() => {
    const handleRouteChange = () => {
      const title = document.title;
      announceToScreenReader(`Navigated to ${title}`, 'polite');
    };

    // Listen for history changes
    window.addEventListener('popstate', handleRouteChange);

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);
}

/**
 * Generate accessible button props
 */
export function getAccessibleButtonProps(label: string, isDisabled = false) {
  return {
    'aria-label': label,
    'aria-disabled': isDisabled,
    role: 'button',
    tabIndex: isDisabled ? -1 : 0,
  };
}

/**
 * Generate accessible link props
 */
export function getAccessibleLinkProps(label: string, opensInNewTab = false) {
  const props: Record<string, any> = {
    'aria-label': label,
  };

  if (opensInNewTab) {
    props['aria-label'] = `${label} (opens in new tab)`;
    props.target = '_blank';
    props.rel = 'noopener noreferrer';
  }

  return props;
}

/**
 * Check if element has sufficient color contrast
 */
export function hassufficientContrast(
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA'
): boolean {
  const getLuminance = (hex: string): number => {
    const rgb = parseInt(hex.slice(1), 16);
    const r = ((rgb >> 16) & 0xff) / 255;
    const g = ((rgb >> 8) & 0xff) / 255;
    const b = (rgb & 0xff) / 255;

    const [rs, gs, bs] = [r, g, b].map((c) => {
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

  const threshold = level === 'AAA' ? 7 : 4.5;
  return ratio >= threshold;
}

/**
 * Hook to manage keyboard navigation in lists
 */
export function useKeyboardNavigation(itemCount: number, onSelect: (index: number) => void) {
  const selectedIndexRef = useRef(0);

  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        selectedIndexRef.current = Math.min(selectedIndexRef.current + 1, itemCount - 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        selectedIndexRef.current = Math.max(selectedIndexRef.current - 1, 0);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        onSelect(selectedIndexRef.current);
        break;
      case 'Home':
        e.preventDefault();
        selectedIndexRef.current = 0;
        break;
      case 'End':
        e.preventDefault();
        selectedIndexRef.current = itemCount - 1;
        break;
    }
  };

  return { handleKeyDown, selectedIndex: selectedIndexRef.current };
}

/**
 * Generate unique ID for form field associations
 */
let idCounter = 0;
export function useUniqueId(prefix = 'id'): string {
  const idRef = useRef<string>();

  if (!idRef.current) {
    idRef.current = `${prefix}-${++idCounter}`;
  }

  return idRef.current;
}

/**
 * Validation utilities for WCAG compliance
 */
export const a11yValidation = {
  /**
   * Check if touch target is at least 44x44px
   */
  isValidTouchTarget(width: number, height: number): boolean {
    return width >= 44 && height >= 44;
  },

  /**
   * Check if text size is readable (at least 16px for body text)
   */
  isReadableTextSize(size: number): boolean {
    return size >= 16;
  },

  /**
   * Check if interactive element has visible focus indicator
   */
  hasVisibleFocus(element: HTMLElement): boolean {
    const computedStyle = window.getComputedStyle(element, ':focus');
    return (
      computedStyle.outlineWidth !== '0px' ||
      computedStyle.boxShadow !== 'none' ||
      computedStyle.borderColor !== 'transparent'
    );
  },
};
