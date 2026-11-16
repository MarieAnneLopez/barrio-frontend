import { Html } from '@react-three/drei';
import { useHeroStore, type HeroPlace } from './heroStore';

/**
 * Billboards de lugares: botones HTML reales (enfocables, con nombre accesible)
 * anclados en 3D. Al elegir uno, la cámara vuela hacia él y se abre su ficha.
 */
export function Billboards({ places }: { places: readonly HeroPlace[] }) {
  const selected = useHeroStore((s) => s.selected);
  const select = useHeroStore((s) => s.select);

  return (
    <>
      {places.map((place) => {
        const active = selected?.id === place.id;
        return (
          <Html key={`${place.slug}-${place.id}`} position={place.position} center zIndexRange={[20, 0]}>
            <button
              type="button"
              aria-label={place.name}
              aria-pressed={active}
              onClick={() => select(active ? null : place)}
              className="map-marker"
              data-selected={active}
            >
              <span aria-hidden="true">{place.emoji}</span>
            </button>
          </Html>
        );
      })}
    </>
  );
}
