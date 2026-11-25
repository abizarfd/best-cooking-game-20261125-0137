# Dapur Kilat — Chop, Fry & Plate: 12 Recipes, 3 Stations, One 5-Minute Dinner Rush

[![make.fun](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/arrow199sky/best-cooking-game-20261125-0137/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/arrow199sky/best-cooking-game-20261125-0137/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)

A make.fun competition entry (`best-cooking-game-20261125-0137`).

You run a small warung kitchen through one 5-minute dinner shift. Orders land
on the board with a patience bar; you walk the chef between the stations,
prepare each dish, and serve it before the customer walks out.

## How it plays

- **10 ingredient crates** — tomato, lettuce, onion, chili, bun, patty, cheese,
  egg, noodle, rice. Pick one up (hands hold one item).
- **2 chopping boards** — raw vegetables take 3 chops each (press E).
- **Grill (patty, 6s), stove pot (noodle/rice, 8s), fryer (egg, 5s)** — every
  dish cooks on a timer, dings when ready, and burns if you leave it past its
  window. Burnt food goes in the bin.
- **Plating counter** — build the dish (up to 4 items). When the plate matches
  an order on the board, press E to serve: price + a speed tip, times a combo
  multiplier for consecutive serves without a miss.
- **12 recipes** — Garden Salad, Burger Kilat, Cheese Burger, Mie Kuah, Nasi
  Goreng, Omelette Keju, Sandwich Taman, Mie Goreng, Burger Pedas, Rice Bowl,
  Salad Pedas, Double Burger.
- **Rush hour** — orders arrive faster and patience shrinks as the shift goes
  on; the last 90 seconds are full rush. Three missed orders end the shift
  early. Stars at 150 / 300 / 450 coins.
- **Sound** — chops, sizzles, serve dings and a fail buzz, all synthesised
  with WebAudio (no audio files). M mutes.

## Controls

- **WASD / arrow keys** — walk the chef
- **E or Space** — use the station you stand by
- **Click** — walk there; click a station to walk to it and use it on arrival
- **Q** — throw away what you hold
- **P / Esc** — pause, **M** — mute

## Run

```sh
node serve.ts   # then open http://localhost:8080
```

The game is plain static files under `game/` — no build step, no network
request. Screenshots are real renders of the game's own code
(`?shot=kitchen|rush|serve|results|start&seed=1` stages each scene).

## Files

- `game/index.html` — the page; `game/src/main.js` — boot + game loop
- `game/src/config.js` — tuning, ingredients, recipes, station layout
- `game/src/world.js` — state, cooking timers, orders, scoring
- `game/src/render.js` — all drawing (kitchen, order board, food icons)
- `game/src/input.js` — keyboard + mouse
- `game/src/audio.js` — synthesised sound effects
- `game/src/shots.js` — staged screenshot scenes
- `main.ts` — hands the game in (copies `game/` + `screenshots/`, writes `dossier.json`)
