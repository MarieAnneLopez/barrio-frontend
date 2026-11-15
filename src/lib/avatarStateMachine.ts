// Máquina de estados de Mini Marie (§11.4.2): función pura, sin temporizadores.
// AvatarSprite pinta el estado; quien lo use despacha SETTLE al cumplirse holdMs.
export type FrameNumber = 1 | 2 | 3 | 4 | 5 | 6;

export type AvatarState =
  | 'idle'
  | 'walk_left'
  | 'walk_right'
  | 'wave'
  | 'jump'
  | 'sad'
  | 'alert'
  | 'sleep';

export type AvatarEvent =
  | { type: 'GREET' }
  | { type: 'CELEBRATE' }
  | { type: 'NAVIGATE'; direction: 'left' | 'right' }
  | { type: 'ERROR' }
  | { type: 'ALERT' }
  | { type: 'INACTIVE' }
  | { type: 'ACTIVITY' }
  | { type: 'SETTLE' };

export interface StateSpec {
  /** Frames del spritesheet; con dos, alternan cada frameMs. */
  frames: readonly FrameNumber[];
  frameMs: number;
  /** Duración del gesto antes de volver a idle; null = se mantiene. */
  holdMs: number | null;
}

export const AVATAR_STATES: Record<AvatarState, StateSpec> = {
  idle: { frames: [1, 2], frameMs: 1100, holdMs: null },
  walk_left: { frames: [3], frameMs: 150, holdMs: 1200 },
  walk_right: { frames: [4], frameMs: 150, holdMs: 1200 },
  wave: { frames: [5], frameMs: 450, holdMs: 1800 },
  jump: { frames: [6], frameMs: 900, holdMs: 900 },
  sad: { frames: [1], frameMs: 1600, holdMs: 1600 },
  alert: { frames: [2], frameMs: 1200, holdMs: 1200 },
  sleep: { frames: [1], frameMs: 1100, holdMs: null },
};

export function transition(state: AvatarState, event: AvatarEvent): AvatarState {
  switch (event.type) {
    case 'ERROR':
      return 'sad';
    case 'ALERT':
      return 'alert';
    case 'GREET':
      return 'wave';
    case 'CELEBRATE':
      return 'jump';
    case 'NAVIGATE':
      return event.direction === 'left' ? 'walk_left' : 'walk_right';
    case 'INACTIVE':
      return state === 'idle' ? 'sleep' : state;
    case 'ACTIVITY':
      return state === 'sleep' ? 'idle' : state;
    case 'SETTLE':
      return AVATAR_STATES[state].holdMs === null ? state : 'idle';
  }
}
