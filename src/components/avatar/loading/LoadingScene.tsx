import './loading-scene.css';
import { CLOUD_TILE, clouds, skyline, TILE } from './skyline';

// Se generan una vez al cargar el módulo: siempre el mismo barrio.
const FAR = skyline(20261117, 150, 285, false);
const NEAR = skyline(1450, 70, 205, true);
const CLOUDS = clouds(93);
const COPIES = [0, 1, 2, 3]; // cuatro tiras en fila cubren hasta 3600 px; el bucle avanza una

function Strip({ kind }: { kind: 'far' | 'near' | 'clouds' }) {
  const tile = kind === 'clouds' ? CLOUD_TILE : TILE;
  return (
    <div className={`loading-scene__layer loading-scene__layer--${kind}`}>
      {COPIES.map((copy) => (
        <svg key={copy} viewBox={`0 0 ${tile.width} ${tile.height}`} className="loading-scene__tile" preserveAspectRatio="none" focusable="false">
          {kind === 'clouds' ? <path d={CLOUDS} className="loading-scene__cloud" /> : null}
          {kind === 'far' ? <path d={FAR.body} className="loading-scene__far" /> : null}
          {kind === 'near' ? <path d={NEAR.body} className="loading-scene__near" /> : null}
          {kind === 'near' ? <path d={NEAR.windows} className="loading-scene__window" /> : null}
        </svg>
      ))}
    </div>
  );
}

/**
 * Barrio de fondo de la pantalla de carga (gran actualización): cielo de crema a rosa, sol
 * amarillo, nubes y dos filas de edificios (rosa claro lejos, rosa cerca) en parallax lento, solo
 * con transform. El sol queda arriba a la derecha, por encima de la carrera: Mini Marie nunca pasa
 * sobre el amarillo. Decorativo; con movimiento reducido, quieto.
 */
export function LoadingScene() {
  return (
    <div className="loading-scene" aria-hidden="true">
      <span className="loading-scene__sun" />
      <Strip kind="clouds" />
      <Strip kind="far" />
      <Strip kind="near" />
    </div>
  );
}
