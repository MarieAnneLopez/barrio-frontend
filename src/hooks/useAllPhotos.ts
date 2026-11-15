import { useEffect, useState } from 'react';
import { apiGet } from '../lib/apiClient';
import type { GalleryPhoto, Page } from '../lib/apiTypes';

const SIZE = 100; // máximo de la API por página

type State = { status: 'loading' | 'error'; items: GalleryPhoto[] } | { status: 'success'; items: GalleryPhoto[] };

/** Todas las páginas de GET /fotos (H35: con Mapillary son cientos), en orden; `retry` vuelve a pedir. */
export async function fetchAllPhotos(signal?: AbortSignal): Promise<GalleryPhoto[]> {
  const items: GalleryPhoto[] = [];
  for (let page = 1; ; page += 1) {
    const data = await apiGet<Page<GalleryPhoto>>('/fotos', { page, size: SIZE }, signal);
    items.push(...data.items);
    if (page >= data.pages) return items;
  }
}

export function useAllPhotos() {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<State>({ status: 'loading', items: [] });

  useEffect(() => {
    const controller = new AbortController();
    fetchAllPhotos(controller.signal).then(
      (items) => setState({ status: 'success', items }),
      () => !controller.signal.aborted && setState({ status: 'error', items: [] }),
    );
    return () => controller.abort();
  }, [attempt]);

  return {
    ...state,
    retry: () => {
      setState({ status: 'loading', items: [] });
      setAttempt((n) => n + 1);
    },
  };
}
