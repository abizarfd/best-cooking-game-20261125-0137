// Every tuning number, colour, ingredient, recipe and station in one place.
// The playfield is a fixed 1280x720 logical area; the renderer scales it to the
// window, so no rule below depends on the screen size.
export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

/** One dinner shift, in seconds. */
export const SHIFT_SECONDS = 300;

/** Missed orders before the shift ends early. */
export const HEARTS = 3;

export const CHEF = { radius: 26, speed: 300 };

/** How close the chef must be to a station's edge to use it. */
export const REACH = 58;

/** Coins that earn each star at the end of the shift. */
export const STARS = [150, 300, 450];

/**
 * Ingredients. `prep` says what a station turns the raw item into, and `needs`
 * says which station does it: board chops, grill grills, stove boils, fryer fries.
 * Bun and cheese are used as they come.
 */
export const INGREDIENTS = {
  tomato: { name: 'Tomato', short: 'Tom', color: '#e23b2e', dark: '#a81f16', prep: 'chopped', needs: 'board', chop: true },
  lettuce: { name: 'Lettuce', short: 'Let', color: '#58b368', dark: '#2f7d3d', prep: 'chopped', needs: 'board', chop: true },
  onion: { name: 'Onion', short: 'Oni', color: '#b678d8', dark: '#7d4a9e', prep: 'chopped', needs: 'board', chop: true },
  chili: { name: 'Chili', short: 'Chi', color: '#d21f2b', dark: '#8f1018', prep: 'chopped', needs: 'board', chop: true },
  bun: { name: 'Bun', short: 'Bun', color: '#e8b06a', dark: '#b57e35', prep: null, needs: null },
  patty: { name: 'Patty', short: 'Pat', color: '#8a5a33', dark: '#5d3a1e', prep: 'grilled', needs: 'grill' },
  cheese: { name: 'Cheese', short: 'Chs', color: '#f2c230', dark: '#c08d12', prep: null, needs: null },
  egg: { name: 'Egg', short: 'Egg', color: '#f6ead2', dark: '#d8c49a', prep: 'fried', needs: 'fryer' },
  noodle: { name: 'Noodle', short: 'Ndl', color: '#f0c94e', dark: '#c39a1d', prep: 'boiled', needs: 'stove' },
  rice: { name: 'Rice', short: 'Ric', color: '#f4f1e4', dark: '#cfc9a8', prep: 'boiled', needs: 'stove' },
};

/** An item in play: { id, state } where state is raw, chopped, grilled, boiled, fried or burnt. */
export function itemKey(item) {
  return item.state === 'raw' ? item.id : `${item.id}_${item.state}`;
}

export function itemLabel(item) {
  const def = INGREDIENTS[item.id];
  if (item.state === 'burnt') return `Burnt ${def.name}`;
  if (item.state === 'raw') return def.name;
  return `${def.name} (${item.state})`;
}

/** Seconds a station cooks before the food is done, and the window before it burns. */
export const COOK = {
  grill: { cook: 6, window: 5 },
  stove: { cook: 8, window: 5 },
  fryer: { cook: 5, window: 5 },
};

/** Chops that turn a raw vegetable into a chopped one. */
export const CHOPS_NEEDED = 3;

/**
 * The 12 recipes. `items` are item keys; a plate must hold exactly that multiset
 * (order does not matter, duplicates count) to serve the matching order.
 */
export const RECIPES = [
  { name: 'Garden Salad', items: ['tomato_chopped', 'lettuce_chopped'], price: 22 },
  { name: 'Burger Kilat', items: ['bun', 'patty_grilled', 'lettuce_chopped'], price: 32 },
  { name: 'Cheese Burger', items: ['bun', 'patty_grilled', 'cheese', 'tomato_chopped'], price: 38 },
  { name: 'Mie Kuah', items: ['noodle_boiled', 'onion_chopped', 'chili_chopped'], price: 30 },
  { name: 'Nasi Goreng', items: ['rice_boiled', 'egg_fried', 'chili_chopped'], price: 34 },
  { name: 'Omelette Keju', items: ['egg_fried', 'cheese'], price: 24 },
  { name: 'Sandwich Taman', items: ['bun', 'tomato_chopped', 'lettuce_chopped', 'cheese'], price: 30 },
  { name: 'Mie Goreng', items: ['noodle_boiled', 'egg_fried', 'onion_chopped'], price: 34 },
  { name: 'Burger Pedas', items: ['bun', 'patty_grilled', 'chili_chopped', 'lettuce_chopped'], price: 40 },
  { name: 'Rice Bowl', items: ['rice_boiled', 'egg_fried', 'tomato_chopped'], price: 32 },
  { name: 'Salad Pedas', items: ['tomato_chopped', 'lettuce_chopped', 'chili_chopped'], price: 26 },
  { name: 'Double Burger', items: ['bun', 'patty_grilled', 'patty_grilled', 'cheese'], price: 46 },
];

/** Station rectangles on the kitchen floor (x, y, w, h, label). */
export const STATIONS = {
  crates: { x: 16, y: 112, w: 660, h: 66, label: 'Ingredient crates' },
  board1: { x: 700, y: 112, w: 150, h: 66, label: 'Chopping board' },
  grill: { x: 872, y: 112, w: 150, h: 66, label: 'Grill' },
  stove: { x: 1044, y: 112, w: 220, h: 66, label: 'Stove pot' },
  board2: { x: 700, y: 300, w: 150, h: 66, label: 'Chopping board 2' },
  fryer: { x: 1112, y: 300, w: 152, h: 66, label: 'Fryer' },
  plate: { x: 1112, y: 420, w: 152, h: 130, label: 'Plating counter' },
  bin: { x: 16, y: 600, w: 152, h: 66, label: 'Bin' },
};

/** The ten crates in a row, each 64 wide with a 2px gap. */
export const CRATES = ['tomato', 'lettuce', 'onion', 'chili', 'bun', 'patty', 'cheese', 'egg', 'noodle', 'rice'];

export const PALETTE = {
  floor: '#c98f4e',
  floorDark: '#b57a3e',
  wall: '#7d4a2d',
  wallTop: '#a8643c',
  counter: '#8a5a33',
  counterTop: '#d9b380',
  board: '#e8d3a2',
  steel: '#b9c0c9',
  steelDark: '#7e8794',
  panel: '#fff6e6',
  panelEdge: '#d9b380',
  text: '#2b1d12',
  muted: '#8a6d4f',
  orderGood: '#3f9e4d',
  orderWarn: '#e8a13a',
  orderBad: '#d23b2e',
  gold: '#f2c230',
  chef: '#f2f2f2',
  chefHat: '#ffffff',
  skin: '#f0c08a',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best coins total is kept between visits (this browser only). */
export const BEST_KEY = 'dapur-kilat.best-coins';
