// Keyboard and mouse: WASD/arrows to walk, E or Space to use a station, Q to bin
// what you hold, P or Escape to pause, M to mute. Clicking walks the chef there;
// clicking a station walks there and uses it on arrival.
import { FIELD, STATIONS } from './config.js';

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_TRASH = 4;
export const ACTION_MUTE = 8;

function stationAt(x, y) {
  for (const key of Object.keys(STATIONS)) {
    const s = STATIONS[key];
    if (x >= s.x - 10 && x <= s.x + s.w + 10 && y >= s.y - 10 && y <= s.y + s.h + 10) return key;
  }
  return null;
}

export function createInput(canvas, onMove, onInteract) {
  const keys = new Set();
  let actions = 0;
  let interactQueued = false;

  function toGame(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const v = canvas._view || { scale: 1, ox: 0, oy: 0 };
    return {
      x: ((clientX - rect.left - v.ox) / v.scale),
      y: ((clientY - rect.top - v.oy) / v.scale),
    };
  }

  function keyDown(event) {
    const key = event.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) event.preventDefault();
    if (event.repeat) return;
    keys.add(key);
    if (key === 'e' || key === ' ') {
      actions |= ACTION_CONFIRM;
      interactQueued = true;
    }
    if (key === 'p' || key === 'escape') actions |= ACTION_PAUSE;
    if (key === 'q') actions |= ACTION_TRASH;
    if (key === 'm') actions |= ACTION_MUTE;
  }

  function keyUp(event) {
    keys.delete(event.key.toLowerCase());
  }

  function mouseDown(event) {
    const p = toGame(event.clientX, event.clientY);
    const station = stationAt(p.x, p.y);
    if (station) {
      const s = STATIONS[station];
      onMove(s.x + s.w / 2, s.y + s.h + 70, station);
    } else {
      onMove(p.x, p.y, null);
    }
  }

  window.addEventListener('keydown', keyDown);
  window.addEventListener('keyup', keyUp);
  canvas.addEventListener('mousedown', mouseDown);

  return {
    /** Normalised keyboard direction for this frame. */
    direction() {
      let x = 0;
      let y = 0;
      if (keys.has('a') || keys.has('arrowleft')) x -= 1;
      if (keys.has('d') || keys.has('arrowright')) x += 1;
      if (keys.has('w') || keys.has('arrowup')) y -= 1;
      if (keys.has('s') || keys.has('arrowdown')) y += 1;
      return { x, y };
    },
    /** True once when E/Space was pressed; the game loop consumes it. */
    takeInteract() {
      const v = interactQueued;
      interactQueued = false;
      return v;
    },
    takeActions() {
      const v = actions;
      actions = 0;
      return v;
    },
  };
}
