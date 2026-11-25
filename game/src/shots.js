// The screenshot scenes behind ?shot=kitchen|rush|serve|results|start. Each one
// stages a real mid-game state through the world's own stage() (the same items,
// stations and orders live play produces), so the frame is what the game really
// looks like and the same seed always gives the same frame.
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

/**
 * Set `world` to the named scene and return the screen to draw over it and the
 * best score to show.
 */
export function stageShot(name, world) {
  const screen = world.stage(name);
  if (screen === 'over') return { screen: SCREEN_OVER, best: 0 };
  if (screen === 'title') return { screen: SCREEN_TITLE, best: 0 };
  return { screen: SCREEN_PLAY, best: 0 };
}
