# Wingbreaker

A browser shoot-'em-up where the aliens fight dirty. Literally. They throw poop at you.

**Play it here: [wingbreaker.vercel.app](https://wingbreaker.vercel.app)** (phone or desktop, nothing to install)

It's a love letter to the shooters we grew up on, mostly _Star Defender 2_ and _Chicken Invaders 2_: lots of enemies, gifts falling from the sky, big dumb bosses, and jokes nobody asked for.

## What's in it

- **100 levels** in 10 chapters, each one ending with a boss that has opinions.
- **Two pilots on one screen.** Grab a friend. Stay close and you both hit harder; if one of you goes down, the other can fly over and pick them back up.
- **Three weapon families** (Pulse, Neutron, Lance), each with six power levels, plus plungers, bombs and a rubber duck.
- **A shop** where the cash you earn turns into permanent upgrades.
- **Arcade mode** (30 stages, no saves, bragging rights) and a **Daily** run that's the same for everyone that day.
- **52 kinds of critters** and eight flavours of poop, each behaving differently. Some split. Some bounce. One has a bee.

## How to play

Shoot everything. Don't get hit. Catch the gifts.

|              | Pilot 1                        | Pilot 2 (wingman) |
| ------------ | ------------------------------ | ----------------- |
| Move         | `W` `A` `S` `D`                | Arrow keys        |
| Fire         | `Z`, `J`, left `Ctrl` or left click | `K`          |
| Bomb         | `Space` or `X`                 | `L`               |
| Slow, precise | left `Shift`                   | right `Shift`     |

`Enter` confirms, `Esc` pauses. Every key can be changed in Options.

**Gamepads** work too: stick or d-pad to move, A to fire, B or X to bomb. With two pilots and one pad, the pad goes to the wingman, so one of you can stay on the keyboard.

**On a phone** you drag the ship with your thumb. Hold FIRE, or switch on AUTO and let it shoot by itself. The bomb button sits in the corner.

### What falls from the sky

- **Poop** in various shapes and colours: bad. Dodge it.
- **Gift box**: better gun. The colour tells you which weapon family.
- **Toilet roll**: a shield that eats one hit.
- **Spray can**: one more bomb.
- **Plunger**: homing plungers. Yes.
- **Rubber duck**: everyone stops to look at it.
- **Coin**: money for the shop.

Every kill also charges your next bomb a little. The thin bar next to your bombs shows how close you are.

## Run it yourself

You need Node 22.

```bash
npm install
npm run dev
```

Then open <http://localhost:8080>. In dev builds `F8` makes you invincible, which is handy when you just want to look at a boss.

Other useful ones:

```bash
npm run build       # production build
npm run typecheck   # TypeScript check
npm run lint
```

## Where things live

The whole game sits in `src/game/`:

| File             | What it does                                                       |
| ---------------- | ------------------------------------------------------------------ |
| `world.ts`       | The rules: movement, shooting, enemies, bosses, pickups, co-op     |
| `v3.ts`          | Numbers and words: level plans, enemy stats, weapon tables, jokes  |
| `render.ts`      | Everything drawn on the canvas                                     |
| `shots.ts`       | The poop sprites and their colour variants                         |
| `meta.ts`        | Save file, shop upgrades                                           |
| `Wingbreaker.tsx` | Menus, HUD overlays, keyboard / touch / gamepad input              |
| `audio.ts`, `music.ts` | Sound effects and music, all generated in the browser        |

The game logic runs at a fixed 60 steps per second and doesn't touch the DOM, so it can be run headless. That's how balance gets tested: a bot plays all 100 levels and reports where it got stuck or hit too often.

Built with React, TanStack Start, Vite and a plain 2D canvas. Progress is saved in your browser, there are no accounts.

## Status

Still being worked on. Next up: nastier boss attacks, new art for the poops and gifts, proper music, and an online leaderboard for the Daily run.

Found a bug or have an idea for something stupid that should fall from the sky? Open an issue.
