import { type CSSProperties, Fragment } from 'react';
import { splitMark } from '../../features/home/film/manifesto/manifestoWords';

export interface IntroWord {
  text: string;
  /** Turno de arranque de la palabra (0 = la primera): fija su retraso. */
  start: number;
}

export interface IntroContent {
  title: string;
  description: string;
  eyebrow?: string | undefined;
  emoji?: string | undefined;
}

interface IntroLayerProps extends IntroContent {
  layer: 'base' | 'papel';
  lines: IntroWord[][];
  indents: readonly number[];
}

/** Una palabra en su máscara; el signo final va aparte para despegarlo de la letra (manifiesto). */
function MaskedWord({ text, start }: IntroWord) {
  const { body, mark } = splitMark(text);
  return (
    <span className="intro__mask">
      <span data-word={start} className="intro__word">
        {body}
        {mark ? <span className="intro__mark">{mark}</span> : null}
      </span>
    </span>
  );
}

/**
 * Una capa de la entrada de sección. Las dos son idénticas salvo el color: la de base es solo
 * visual (fuera del lector de pantalla, sin h1); la revelada lleva el único h1 de la página, con el
 * título real en texto oculto y los fragmentos animados como decorativos.
 */
export function IntroLayer({ layer, lines, indents, title, description, eyebrow, emoji }: IntroLayerProps) {
  const real = layer === 'papel';
  const Title = real ? 'h1' : 'p';
  return (
    <div data-layer={layer} aria-hidden={real ? undefined : true} className={`intro__layer intro__layer--${layer}`}>
      <span aria-hidden="true" className="intro__rule" />
      {eyebrow || emoji ? (
        <p className="intro__badge ui-eyebrow">
          {emoji ? <span aria-hidden="true">{emoji} </span> : null}
          {eyebrow}
        </p>
      ) : null}
      <Title className="intro__title">
        {real ? <span className="sr-only">{title}</span> : null}
        {lines.map((words, line) => (
          <span key={line} aria-hidden="true" className="intro__line" style={{ '--indent': indents[line] ?? 0 } as CSSProperties}>
            {words.map((word, at) => (
              <Fragment key={word.start}>
                {at > 0 ? ' ' : null}
                <MaskedWord {...word} />
              </Fragment>
            ))}
          </span>
        ))}
      </Title>
      <p className="intro__lede">{description}</p>
    </div>
  );
}
