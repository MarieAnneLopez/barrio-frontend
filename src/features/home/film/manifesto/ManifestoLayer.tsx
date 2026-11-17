import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { numberWords, splitMark, type NumberedWord } from './manifestoWords';

interface ManifestoLayerProps {
  tone: 'noche' | 'papel';
  /** Duplicado solo visual: queda fuera del lector de pantalla y no lleva h1. */
  decorative?: boolean;
}

/** Una palabra en su máscara; el signo final («.») va aparte para poder despegarlo de la letra. */
function MaskedWord({ text, index }: NumberedWord) {
  const { body, mark } = splitMark(text);
  return (
    <span className="manifesto__mask">
      <span data-word={index} className="manifesto__word">
        {body}
        {mark ? <span className="manifesto__mark">{mark}</span> : null}
      </span>
    </span>
  );
}

/**
 * Una capa del manifiesto: el titular en 3 líneas, con cada palabra en su máscara, y abajo el lema
 * y la flecha. Las dos capas son idénticas salvo el color. La real lleva el único h1, con nombre
 * accesible propio: los fragmentos visibles, partidos en líneas y palabras, son decorativos.
 */
export function ManifestoLayer({ tone, decorative = false }: ManifestoLayerProps) {
  const { t } = useTranslation();
  const lines = numberWords(t('home.manifesto.lines', { returnObjects: true }) as string[][]);
  const Title = decorative ? 'p' : 'h1';

  return (
    <div data-layer={tone} aria-hidden={decorative || undefined} className={`manifesto__layer manifesto__layer--${tone}`}>
      <Title className="manifesto__title" aria-label={decorative ? undefined : t('home.manifesto.label')}>
        {lines.map((words, line) => (
          <span key={line} aria-hidden="true" className="manifesto__line">
            {words.map((word, at) => (
              <Fragment key={word.index}>
                {at > 0 ? ' ' : null}
                <MaskedWord {...word} />
              </Fragment>
            ))}
          </span>
        ))}
      </Title>
      <div className="manifesto__foot">
        <svg aria-hidden="true" focusable="false" viewBox="0 0 24 64" fill="none" stroke="currentColor" className="manifesto__arrow">
          <path d="M12 0v63M1.5 52.5 12 63l10.5-10.5" vectorEffect="non-scaling-stroke" />
        </svg>
        <p className="manifesto__tagline">{t('app.tagline')}</p>
      </div>
    </div>
  );
}
