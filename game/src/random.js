// A small seeded random source, so a ?seed=N run stages the same kitchen every time.
export function createRandom(seed) {
  let state = (seed >>> 0) || 1;
  function next() {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  }
  return {
    next,
    int(min, max) {
      return min + Math.floor(next() * (max - min + 1));
    },
    pick(list) {
      return list[Math.floor(next() * list.length)];
    },
  };
}
