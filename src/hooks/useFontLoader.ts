import { useEffect, useRef } from 'react';
import type { StyleSpec } from '../types/theme';

const MINIMAL_FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap';

export function useFontLoader(spec: StyleSpec) {
  const linkRef = useRef<HTMLLinkElement | null>(null);

  useEffect(() => {
    if (spec === 'minimal') {
      if (!linkRef.current) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = MINIMAL_FONTS_URL;
        link.id = 'minimal-fonts';
        document.head.appendChild(link);
        linkRef.current = link;
      }
    } else {
      // Remove after a short delay so transition isn't jarring
      const el = linkRef.current;
      if (el) {
        const timer = setTimeout(() => {
          el.remove();
          linkRef.current = null;
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [spec]);
}
