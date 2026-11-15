# Wingbreaker

A browser shoot-'em-up where your bathroom has had enough. The Toilet Empire invades room by room, and it fights dirty. Literally. It throws poop at you.

**Play it here: [wingbreaker.vercel.app](https://wingbreaker.vercel.app)** (phone or desktop, nothing to install)

It's a love letter to the shooters we grew up on, mostly _Star Defender 2_ and _Chicken Invaders 2_: lots of enemies, gifts falling from the sky, big dumb bosses, and jokes nobody asked for.

## What's in it

- **100 levels** in 10 rooms of the house, from the Old Bathroom through the Sewer and the Hot Kitchen to the Throne Room. Every room has its own army and its own boss.
- **Two pilots on one screen.** Grab a friend. Stay close and you both hit harder; if one of you goes down, the other can fly over and pick them back up. Fill both Super Flush bars, press bomb together, and the whole screen goes down the drain. After every level a card says who shot more, and gives the other one a title they did not ask for.
- **Duel.** The same friend, now your enemy. One of you at the bottom, one at the top, gifts drifting down the middle, first to three rounds. Loser cleans the bathroom.
- **Six guns**, each with six power levels and its own way of working: Bubble Blaster, Soap Cannon, Toothpaste Laser, Zap Brush, Flush Wave and Freshener Mist. More power means more of it in the air at once.
- **Three second weapons** with limited ammo: homing plunger missiles, bath bombs and a paper roll that unrolls across a whole line.
- **Fourteen ships** that all fly differently. A bathtub with two extra lives. A shopping cart that makes everything worth more. A toilet that brings its own brush.
- **Enemies that fly in formation.** They loop in from the sides, settle into rows, diamonds, columns and arrowheads, and peel off to dive at you.
- **No two levels in a row feel the same.** Every room has a poop storm to survive (shoot it or dodge it), a bonus round, a mini-boss with bodyguards, and a pipe run where you thread the gaps or blast the valve and burst the whole pipe.
- **Bosses with a move of their own.** Each one arrives with a name card and marks a column or a strip of the screen before it strikes, so you always get to see it coming.
- **A shop** where the cash you earn turns into permanent upgrades.
- **Three difficulty levels**, and **New Game+** once the Toilet King is down: the whole house again, tougher and better paid.
- **Arcade mode** (no saves, no end, it just keeps getting worse) and a **Daily** run of 30 stages that's the same for everyone that day.
- **Twenty achievements** that pay cash the moment you earn them.
- **84 kinds of enemies**, ten bosses and 24 drawings of poop. Some split. Some bounce. One has a bee.

## How to play

Shoot everything. Don't get hit. Catch the gifts.

|              | Pilot 1                        | Pilot 2 (wingman) |
| ------------ | ------------------------------ | ----------------- |
| Move         | `W` `A` `S` `D`                | Arrow keys        |
| Fire         | `Z`, `J`, left `Ctrl` or left click | `K`          |
| Bomb         | `Space` or `X`                 | `L`               |
| Second weapon | `C`, `E` or right click        | `O`               |
| Slow, precise | left `Shift`                   | right `Shift`     |

`Enter` confirms, `Esc` pauses. Every key can be changed in Options.

**In a duel** pilot 1 flies the bottom half and pilot 2 the top half, with the same keys as above. There are no bombs: fly up to the middle line for a gift, if you dare.

**Gamepads** work too: stick or d-pad to move (the stick is analog, a light push is a slow slide), A to fire, B or X to bomb, Y for the second weapon. With two pilots and one pad, the pad goes to the wingman, so one of you can stay on the keyboard.

**On a phone** you drag anywhere and the ship moves exactly as far as your thumb does. Hold FIRE, or switch on AUTO and let it shoot by itself; the second weapon fires along with it while it has ammo. The bomb button sits in the corner.

### What falls from the sky

- **Poop** in various shapes and colours: bad. Dodge it.
- **Gift box**: a gun. The picture on it says which. Your own gun on the box means a power-up; any other box swaps guns and keeps your power.
- **Ammo crate**: plunger missiles, bath bombs or paper rolls for the second weapon.
- **Shield bubble**: eats one hit.
- **Spray can**: one more bomb.
- **Rubber duck**: everyone stops to look at it.
- **Magnet**: pulls every gift toward you for a while.
- **Brush Buddy**: a little toilet brush that circles your ship and shoots along.
- **Coffee**: you fire faster for a while.
- **Silver star**: nothing can touch you for a few seconds.
- **Winged toilet seat**: an extra life. Rare.
- **Pizza, fries, a drumstick**: bonus rounds only. They are worth cash.
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
| `army.ts`        | Which enemies and which boss belong to which room                  |
| `v3.ts`          | Numbers and words: level plans, enemy stats, weapon tables, jokes  |
| `render.ts`      | Everything drawn on the canvas                                     |
| `shots.ts`       | The poop: every kind and its drawings                              |
| `meta.ts`        | Save file, shop upgrades, the fourteen ships                       |
| `Wingbreaker.tsx` | Menus, HUD overlays, keyboard / touch / gamepad input              |
| `audio.ts`, `music.ts` | Sound effects and music, all generated in the browser        |

The game logic runs at a fixed 60 steps per second and doesn't touch the DOM, so it can be run headless. That's how balance gets tested: a bot plays all 100 levels and reports where it got stuck or hit too often.

Built with React, TanStack Start, Vite and a plain 2D canvas. Progress is saved in your browser, there are no accounts.

## Status

Still being worked on. Next up: proper music.

The pictures live in `public/art` and were drawn with ChatGPT to our brief; the backgrounds come from the first version of the game, built with Grok.

Found a bug or have an idea for something stupid that should fall from the sky? Open an issue.
