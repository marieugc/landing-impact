import { useEffect, useState } from 'react';

/** Navigation simple par l'adresse (#/eleve/3) : fonctionne en local comme sur GitHub Pages. */
export function useRoute(): string[] {
  const read = () => window.location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  const [parts, setParts] = useState(read);
  useEffect(() => {
    const on = () => {
      setParts(read());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return parts;
}

export function go(path: string): void {
  window.location.hash = '#/' + path.replace(/^\//, '');
}
