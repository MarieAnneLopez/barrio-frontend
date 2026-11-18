import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { nextQuality, type QualityTrack } from './qualityPolicy';
import { QUALITY, useQualityStore } from './qualityStore';

const SAMPLE_MS = 500;

/**
 * Mide los cuadros por segundo de la maqueta y aplica la política de calidad (qualityPolicy):
 * fija el tope de la densidad de píxeles del lienzo y publica el nivel para las capas (sombras,
 * densidad de carros y personas, cornisas). Los saltos largos (pestaña oculta, fuera de pantalla)
 * no cuentan como lentitud.
 */
export function QualityProbe() {
  const setDpr = useThree((s) => s.setDpr);
  const level = useQualityStore((s) => s.level);
  const acc = useRef({ frames: 0, ms: 0 });
  const track = useRef<QualityTrack>({ level, lowMs: 0, highMs: 0 });

  useEffect(() => {
    track.current = { level, lowMs: 0, highMs: 0 };
    setDpr(Math.min(window.devicePixelRatio || 1, QUALITY[level].dpr));
  }, [level, setDpr]);

  useFrame((_, delta) => {
    const ms = delta * 1000;
    if (ms > 250) return; // volvió de una pausa: no es lentitud del equipo
    acc.current.frames += 1;
    acc.current.ms += ms;
    if (acc.current.ms < SAMPLE_MS) return;
    const fps = (acc.current.frames * 1000) / acc.current.ms;
    const next = nextQuality(track.current, fps, acc.current.ms);
    acc.current = { frames: 0, ms: 0 };
    track.current = next;
    const store = useQualityStore.getState();
    store.setFps(Math.round(fps));
    if (next.level !== store.level) store.setLevel(next.level);
  });

  return null;
}
