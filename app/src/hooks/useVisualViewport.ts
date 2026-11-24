import { useEffect } from 'react';

export function useVisualViewport() {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const onResize = () => {
      const kbHeight = window.innerHeight - vv.height;
      document.documentElement.style.setProperty('--kb-h', `${kbHeight}px`);
    };

    vv.addEventListener('resize', onResize);
    vv.addEventListener('scroll', onResize);
    onResize();

    return () => {
      vv.removeEventListener('resize', onResize);
      vv.removeEventListener('scroll', onResize);
    };
  }, []);
}
