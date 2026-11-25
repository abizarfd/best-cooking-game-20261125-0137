// The whole game state and its rules: the chef, the stations, the orders, the
// cooking timers, the scoring. The renderer only reads this state; input only
// calls moveTarget() and interact(). Nothing here touches the DOM or audio.
import {
  CHEF, CHOPS_NEEDED, COOK, CRATES, FIELD, HEARTS, INGREDIENTS, RECIPES,
  SHIFT_SECONDS, STARS, STATIONS,
} from './config.js';

export const EVENT_SERVED = 1;
export const EVENT_MISSED = 2;
export const EVENT_OVER = 4;
export const EVENT_BURNT = 8;

/** Order patience, in seconds, by rush phase (0 calm, 1 busy, 2 rush hour). */
const PATIENCE = [72, 64, 56];
/** Seconds between new orders, by rush phase. */
const SPAWN_EVERY = [16, 13, 10];
const MAX_ORDERS = 4;

function stationCentre(key) {
  const s = STATIONS[key];
  return { x: s.x + s.w / 2, y: s.y + s.h / 2 };
}

function nearestStation(chef) {
  let best = null;
  let bestD = Infinity;
  for (const key of Object.keys(STATIONS)) {
    const s = STATIONS[key];
    const cx = Math.max(s.x, Math.min(chef.x, s.x + s.w));
    const cy = Math.max(s.y, Math.min(chef.y, s.y + s.h));
    const d = Math.hypot(chef.x - cx, chef.y - cy);
    if (d < bestD) {
      bestD = d;
      best = key;
    }
  }
  return bestD <= 58 + 26 ? best : null;
}

function plateMatches(plateItems, recipe) {
  if (plateItems.length !== recipe.items.length) return false;
  const have = plateItems.map((i) => (i.state === 'raw' ? i.id : `${i.id}_${i.state}`)).sort();
  const want = [...recipe.items].sort();
  return have.every((v, i) => v === want[i]);
}

export function createWorld(random) {
  const state = {
    time: 0,
    timeLeft: SHIFT_SECONDS,
    coins: 0,
    combo: 0,
    bestCombo: 0,
    served: 0,
    missed: 0,
    hearts: HEARTS,
    over: false,
    stars: 0,
    phase: 0,
    rushBanner: 0,
    spawnIn: 6,
    nextOrderId: 1,
    orders: [],
    chef: { x: 640, y: 480, tx: 640, ty: 480, face: 1, moving: false, autoStation: null },
    held: null,
    board1: { item: null, chops: 0 },
    board2: { item: null, chops: 0 },
    grill: { item: null, t: 0, done: false, burnt: false },
    stove: { item: null, t: 0, done: false, burnt: false },
    fryer: { item: null, t: 0, done: false, burnt: false },
    plate: [],
    toasts: [],
    popups: [],
  };

  function toast(text, kind = 'info') {
    state.toasts.push({ text, kind, t: 0 });
    if (state.toasts.length > 4) state.toasts.shift();
  }

  function popup(x, y, text, kind = 'gold') {
    state.popups.push({ x, y, text, kind, t: 0 });
  }

  function spawnOrder(recipeIndex) {
    const recipe = recipeIndex == null ? random.pick(RECIPES) : RECIPES[recipeIndex];
    const patience = PATIENCE[state.phase] + random.int(0, 12);
    state.orders.push({
      id: state.nextOrderId,
      recipe,
      patience,
      patienceMax: patience,
      born: state.time,
    });
    state.nextOrderId += 1;
  }

  function cookTick(slot, kind, dt) {
    if (!slot.item || slot.burnt) return;
    slot.t += dt;
    const spec = COOK[kind];
    if (slot.t >= spec.cook + spec.window) {
      slot.item = { id: slot.item.id, state: 'burnt' };
      slot.burnt = true;
      slot.done = true;
      slot.t = 0;
      toast(`${INGREDIENTS[slot.item.id].name} burnt! Bin it.`, 'bad');
    } else if (slot.t >= spec.cook) {
      slot.done = true;
    }
  }

  function serveOrder(order) {
    const tip = Math.round(order.recipe.price * 0.25 * (order.patience / order.patienceMax));
    const mult = 1 + Math.min(state.combo, 10) * 0.05;
    const earned = Math.round((order.recipe.price + tip) * mult);
    state.coins += earned;
    state.combo += 1;
    state.bestCombo = Math.max(state.bestCombo, state.combo);
    state.served += 1;
    state.orders = state.orders.filter((o) => o !== order);
    state.plate = [];
    const c = stationCentre('plate');
    popup(c.x, c.y - 40, `+${earned} coins`, 'gold');
    toast(`Served ${order.recipe.name}! +${earned} coins${state.combo > 1 ? ` (combo x${state.combo})` : ''}`, 'good');
    return earned;
  }

  function finishShift() {
    state.over = true;
    state.stars = STARS.filter((bar) => state.coins >= bar).length;
  }

  const world = {
    state,

    reset() {
      const fresh = createWorld(random).state;
      for (const key of Object.keys(state)) state[key] = fresh[key];
      spawnOrder(1);
      spawnOrder(0);
      state.spawnIn = SPAWN_EVERY[0];
    },

    /** Click-to-move: walk to a point, optionally auto-using a station on arrival. */
    moveTarget(x, y, station = null) {
      const cx = Math.max(40, Math.min(FIELD.width - 40, x));
      const cy = Math.max(200, Math.min(FIELD.height - 40, y));
      state.chef.tx = cx;
      state.chef.ty = cy;
      state.chef.autoStation = station;
    },

    /** The one interaction button: uses whichever station the chef stands by. */
    interact() {
      const station = nearestStation(state.chef);
      if (!station) return 'none';
      if (station === 'crates') {
        if (state.held) {
          toast('Hands full — serve or bin it first.', 'bad');
          return 'deny';
        }
        const idx = Math.max(0, Math.min(CRATES.length - 1, Math.floor((state.chef.x - STATIONS.crates.x) / 66)));
        const id = CRATES[idx];
        state.held = { id, state: 'raw' };
        return 'pickup';
      }
      if (station === 'board1' || station === 'board2') {
        const board = state[station];
        if (board.item && board.item.state === 'raw') {
          board.chops += 1;
          if (board.chops >= CHOPS_NEEDED) {
            board.item = { id: board.item.id, state: 'chopped' };
            board.chops = 0;
            return 'chopped';
          }
          return 'chop';
        }
        if (board.item && !state.held) {
          state.held = board.item;
          board.item = null;
          board.chops = 0;
          return 'pickup';
        }
        if (!board.item && state.held && INGREDIENTS[state.held.id].chop && state.held.state === 'raw') {
          board.item = state.held;
          board.chops = 0;
          state.held = null;
          return 'place';
        }
        toast('The board only chops raw vegetables.', 'bad');
        return 'deny';
      }
      if (station === 'grill' || station === 'stove' || station === 'fryer') {
        const slot = state[station];
        const kind = station;
        const need = station === 'grill' ? 'grill' : station === 'stove' ? 'stove' : 'fryer';
        if (slot.item && slot.burnt) {
          if (!state.held) {
            state.held = slot.item;
            slot.item = null;
            slot.t = 0;
            slot.done = false;
            slot.burnt = false;
            toast('Burnt food — bin it!', 'bad');
            return 'pickup';
          }
          toast('Hands full — bin what you hold first.', 'bad');
          return 'deny';
        }
        if (slot.item && slot.done && !state.held) {
          const def = INGREDIENTS[slot.item.id];
          state.held = { id: slot.item.id, state: def.prep };
          slot.item = null;
          slot.t = 0;
          slot.done = false;
          return 'pickup';
        }
        if (slot.item && !slot.done) {
          toast('Still cooking — wait for the ding!', 'info');
          return 'deny';
        }
        if (!slot.item && state.held && INGREDIENTS[state.held.id].needs === need && state.held.state === 'raw') {
          slot.item = state.held;
          slot.t = 0;
          slot.done = false;
          slot.burnt = false;
          state.held = null;
          return 'place';
        }
        toast(`This station takes ${need === 'grill' ? 'a raw patty' : need === 'stove' ? 'noodles or rice' : 'a raw egg'}.`, 'bad');
        return 'deny';
      }
      if (station === 'plate') {
        if (state.held) {
          if (state.held.state === 'burnt') {
            toast('Burnt food goes in the bin, not on a plate.', 'bad');
            return 'deny';
          }
          if (state.plate.length >= 4) {
            toast('The plate is full.', 'bad');
            return 'deny';
          }
          state.plate.push(state.held);
          state.held = null;
          const match = state.orders.find((o) => plateMatches(state.plate, o.recipe));
          if (match) {
            serveOrder(match);
            return 'serve';
          }
          return 'place';
        }
        if (state.plate.length > 0) {
          state.held = state.plate.pop();
          return 'pickup';
        }
        toast('Plate is empty — add cooked food first.', 'info');
        return 'deny';
      }
      if (station === 'bin') {
        if (state.held) {
          state.held = null;
          return 'trash';
        }
        toast('Nothing to throw away.', 'info');
        return 'deny';
      }
      return 'none';
    },

    /** Throw away whatever the chef holds (Q key). */
    trashHeld() {
      if (!state.held) return false;
      state.held = null;
      return true;
    },

    step(dt, dirX, dirY) {
      if (state.over) return 0;
      let events = 0;
      state.time += dt;
      state.timeLeft = Math.max(0, SHIFT_SECONDS - state.time);
      const phase = state.timeLeft <= 90 ? 2 : state.timeLeft <= 180 ? 1 : 0;
      if (phase !== state.phase) {
        state.phase = phase;
        state.rushBanner = 3;
        toast(phase === 2 ? 'RUSH HOUR! Orders are pouring in!' : 'Lunch rush is building — faster orders!', 'warn');
      }
      if (state.rushBanner > 0) state.rushBanner -= dt;

      // Chef movement: keyboard wins; otherwise walk to the click target.
      const chef = state.chef;
      let vx = 0;
      let vy = 0;
      if (dirX !== 0 || dirY !== 0) {
        vx = dirX;
        vy = dirY;
        chef.tx = chef.x;
        chef.ty = chef.y;
        chef.autoStation = null;
      } else {
        const dx = chef.tx - chef.x;
        const dy = chef.ty - chef.y;
        const d = Math.hypot(dx, dy);
        if (d > 6) {
          vx = dx / d;
          vy = dy / d;
        } else if (chef.autoStation) {
          const st = chef.autoStation;
          chef.autoStation = null;
          const result = world.interact();
          if (result === 'serve') events |= EVENT_SERVED;
        }
      }
      if (vx !== 0 || vy !== 0) {
        const len = Math.hypot(vx, vy);
        chef.x = Math.max(40, Math.min(FIELD.width - 40, chef.x + (vx / len) * CHEF.speed * dt));
        chef.y = Math.max(200, Math.min(FIELD.height - 40, chef.y + (vy / len) * CHEF.speed * dt));
        chef.face = vx < 0 ? -1 : vx > 0 ? 1 : chef.face;
        chef.moving = true;
      } else {
        chef.moving = false;
      }

      cookTick(state.grill, 'grill', dt);
      cookTick(state.stove, 'stove', dt);
      cookTick(state.fryer, 'fryer', dt);

      // Orders: patience ticks down, new ones arrive, misses cost a heart.
      state.spawnIn -= dt;
      if (state.spawnIn <= 0 && state.orders.length < MAX_ORDERS) {
        spawnOrder();
        state.spawnIn = SPAWN_EVERY[state.phase] + random.int(0, 4);
      }
      for (const order of [...state.orders]) {
        order.patience -= dt;
        if (order.patience <= 0) {
          state.orders = state.orders.filter((o) => o !== order);
          state.missed += 1;
          state.combo = 0;
          state.hearts -= 1;
          toast(`Order missed: ${order.recipe.name}. A customer walked out!`, 'bad');
          events |= EVENT_MISSED;
          if (state.hearts <= 0) {
            finishShift();
            return events | EVENT_OVER;
          }
        }
      }
      for (const t of state.toasts) t.t += dt;
      state.toasts = state.toasts.filter((t) => t.t < 4);
      for (const p of state.popups) p.t += dt;
      state.popups = state.popups.filter((p) => p.t < 1.2);

      if (state.timeLeft <= 0) {
        finishShift();
        return events | EVENT_OVER;
      }
      return events;
    },

    /**
     * Build a staged scene for a screenshot: the same items, stations and orders
     * real play produces, set up directly so the frame is deterministic.
     */
    stage(name) {
      const fresh = createWorld(random).state;
      for (const key of Object.keys(state)) state[key] = fresh[key];
      if (name === 'start') {
        spawnOrder(1);
        spawnOrder(0);
        state.chef.x = 640;
        state.chef.y = 480;
        return 'title';
      }
      if (name === 'kitchen') {
        state.time = 68;
        state.timeLeft = SHIFT_SECONDS - 68;
        state.coins = 86;
        state.combo = 3;
        state.bestCombo = 3;
        state.served = 4;
        spawnOrder(1);
        spawnOrder(3);
        spawnOrder(8);
        state.orders[0].patience = 40;
        state.orders[1].patience = 52;
        state.orders[2].patience = 61;
        state.grill.item = { id: 'patty', state: 'raw' };
        state.grill.t = 4.2;
        state.board1.item = { id: 'tomato', state: 'raw' };
        state.board1.chops = 2;
        state.plate = [{ id: 'bun', state: 'raw' }, { id: 'patty', state: 'grilled' }];
        state.held = { id: 'lettuce', state: 'raw' };
        state.chef.x = 760;
        state.chef.y = 250;
        return 'play';
      }
      if (name === 'rush') {
        state.time = 236;
        state.timeLeft = 64;
        state.phase = 2;
        state.coins = 214;
        state.combo = 5;
        state.bestCombo = 5;
        state.served = 9;
        state.hearts = 2;
        spawnOrder(2);
        spawnOrder(4);
        spawnOrder(8);
        spawnOrder(11);
        state.orders[0].patience = 12;
        state.orders[1].patience = 22;
        state.orders[2].patience = 31;
        state.orders[3].patience = 44;
        state.grill.item = { id: 'patty', state: 'burnt' };
        state.grill.burnt = true;
        state.grill.done = true;
        state.stove.item = { id: 'noodle', state: 'raw' };
        state.stove.t = 6.5;
        state.fryer.item = { id: 'egg', state: 'raw' };
        state.fryer.t = 5.4;
        state.fryer.done = true;
        state.plate = [
          { id: 'bun', state: 'raw' },
          { id: 'patty', state: 'grilled' },
          { id: 'cheese', state: 'raw' },
        ];
        state.held = { id: 'tomato', state: 'chopped' };
        state.chef.x = 1040;
        state.chef.y = 500;
        state.rushBanner = 2;
        return 'play';
      }
      if (name === 'serve') {
        state.time = 150;
        state.timeLeft = SHIFT_SECONDS - 150;
        state.coins = 128;
        state.combo = 4;
        state.bestCombo = 4;
        state.served = 6;
        spawnOrder(1);
        spawnOrder(6);
        state.orders[0].patience = 45;
        state.orders[1].patience = 58;
        state.plate = [
          { id: 'bun', state: 'raw' },
          { id: 'patty', state: 'grilled' },
          { id: 'lettuce', state: 'chopped' },
        ];
        state.chef.x = 1040;
        state.chef.y = 490;
        state.toasts.push({ text: 'Plate matches Burger Kilat — press E to serve!', kind: 'good', t: 0 });
        const c = stationCentre('plate');
        state.popups.push({ x: c.x, y: 402, text: 'READY TO SERVE', kind: 'good', t: 0 });
        return 'play';
      }
      if (name === 'results') {
        state.time = SHIFT_SECONDS;
        state.timeLeft = 0;
        state.coins = 486;
        state.combo = 0;
        state.bestCombo = 7;
        state.served = 14;
        state.missed = 1;
        state.hearts = 2;
        state.stars = 3;
        state.over = true;
        spawnOrder(0);
        return 'over';
      }
      return world.stage('kitchen');
    },
  };

  return world;
}
