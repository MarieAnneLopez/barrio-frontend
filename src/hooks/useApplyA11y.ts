import { useEffect } from 'react';
import { fontScaleOf, useA11yStore } from '../store/a11yStore';

/**
 * Refleja las preferencias en <html>: clase .high-contrast (contrast.css),
 * --font-scale (tokens.css) y clase .reduce-motion.
 */
export function useApplyA11y() {
  const highContrast = useA11yStore((s) => s.highContrast);
  const scaleIndex = useA11yStore((s) => s.scaleIndex);
  const reducedMotion = useA11yStore((s) => s.reducedMotion);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('high-contrast', highContrast);
    root.classList.toggle('reduce-motion', reducedMotion);
    root.style.setProperty('--font-scale', String(fontScaleOf(scaleIndex)));
  }, [highContrast, scaleIndex, reducedMotion]);
}
