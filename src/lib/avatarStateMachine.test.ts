import { describe, expect, it } from 'vitest';
import { AVATAR_STATES, transition, type AvatarState } from './avatarStateMachine';

describe('avatarStateMachine', () => {
  it('cada estado declara frames del spritesheet y su duración', () => {
    expect(AVATAR_STATES.idle).toMatchObject({ frames: [1, 2], frameMs: 1100, holdMs: null });
    expect(AVATAR_STATES.walk_left.frames).toEqual([3]);
    expect(AVATAR_STATES.walk_right.frames).toEqual([4]);
    expect(AVATAR_STATES.wave.frames).toEqual([5]);
    expect(AVATAR_STATES.jump.frames).toEqual([6]);
  });

  it('saludar, celebrar y navegar disparan wave, jump y walk', () => {
    expect(transition('idle', { type: 'GREET' })).toBe('wave');
    expect(transition('idle', { type: 'CELEBRATE' })).toBe('jump');
    expect(transition('idle', { type: 'NAVIGATE', direction: 'left' })).toBe('walk_left');
    expect(transition('wave', { type: 'NAVIGATE', direction: 'right' })).toBe('walk_right');
  });

  it('los estados de un solo gesto vuelven a idle al asentarse', () => {
    const oneShots: AvatarState[] = ['wave', 'jump', 'walk_left', 'walk_right', 'sad', 'alert'];
    for (const state of oneShots) {
      expect(AVATAR_STATES[state].holdMs).toBeGreaterThan(0);
      expect(transition(state, { type: 'SETTLE' })).toBe('idle');
    }
  });

  it('error y alerta interrumpen cualquier gesto', () => {
    expect(transition('jump', { type: 'ERROR' })).toBe('sad');
    expect(transition('walk_left', { type: 'ALERT' })).toBe('alert');
  });

  it('solo se duerme desde idle y despierta con actividad', () => {
    expect(transition('idle', { type: 'INACTIVE' })).toBe('sleep');
    expect(transition('wave', { type: 'INACTIVE' })).toBe('wave');
    expect(transition('sleep', { type: 'ACTIVITY' })).toBe('idle');
    expect(transition('sleep', { type: 'SETTLE' })).toBe('sleep');
    expect(AVATAR_STATES.sleep.holdMs).toBeNull();
  });

  it('dormida, un saludo la despierta saludando', () => {
    expect(transition('sleep', { type: 'GREET' })).toBe('wave');
  });
});
