import './avatar.css';
import './avatar-reduced.css';
import { useMemo } from 'react';
import { AVATAR_STATES, type AvatarState } from '../../lib/avatarStateMachine';
import { avatarLayout } from './avatarLayout';

interface Props {
  state: AvatarState;
  /** Alto en px del avatar (del suelo a la cima). */
  height: number;
  /** Texto alternativo; sin él la imagen es decorativa. */
  label?: string;
  className?: string;
}

/**
 * Mini Marie en pixel art (§11.4): pinta las poses del estado sobre una línea
 * base común. La alternancia de frames y los gestos son CSS (transform/opacity).
 */
export function AvatarSprite({ state, height, label, className = '' }: Props) {
  const layout = useMemo(() => avatarLayout(height), [height]);
  const frames = AVATAR_STATES[state].frames;

  return (
    <span
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      data-state={state}
      className={`avatar ${className}`}
      style={{ width: layout.width, height: layout.height }}
    >
      <span className="avatar__body">
        {frames.map((frame, i) => {
          const p = layout.frames[frame];
          if (!p) return null;
          return (
            <img
              key={frame}
              src={p.file}
              alt=""
              draggable={false}
              data-alt-frame={i === 1 || undefined}
              className="avatar__frame pixel-art"
              style={{ left: p.left, top: p.top, width: p.width, height: p.height }}
            />
          );
        })}
      </span>
      {state === 'sleep' ? (
        <span aria-hidden="true" className="avatar__zzz pixel-font">
          zZz
        </span>
      ) : null}
    </span>
  );
}
