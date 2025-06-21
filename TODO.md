# Blasteroids Development TODO

### 🎨 Visual & Audio Polish

- [ ] Visual elements that are currently rendered with DOM and CSS should
      instead be rendered in HTMLCanvas. This will facilitate taking screenshots
      that involve the entire UI.

### 🕹️ Game Mechanic Polish

- [ ] Missiles and pea shooter bullets currently behave differently when fired:
      pea shooter bullets go perfectly straight (as confirmed by turning on the
      debug graphics). Missiles do not stay on that line, as though they are
      experiencing friction differently. Missiles should behave more like pea
      shooter bullets.

### 🎮 Gameplay Features

- [x] Nebula Gameplay mechanic ✨
    - This is a mechanic that applies to an entire zone
    - In the game, a nebula adds a groovy cloud visual effect to the entire
      board. It is rendered as dozens of simple shapes with various levels of
      opacity. They are drawn on top of the rest of the board, so the ship and
      asteroids and other game elements are somewhat harder to see.
    - The HUD should be drawn on top of the nebula, and since there will now be
      colors below, we should draw HUD items with a black and semi-transparent
      background so we can read them easier.
    - This will likely require the use of graphical layering.
- [ ] Screenshot keyboard shortcut: defaults to T

### 🔧 Technical Improvements

#### Physics Testing Foundation (for future gravity system)

- [ ] Add physics unit tests as foundation for future gravity system refactor
- [ ] Create baseline physics behavior tests (ship movement, bullet inheritance, collision)
- [ ] Add performance benchmarks for physics calculations with many entities

#### General

- [ ] Performance optimizations for large numbers of objects

## Big New Features

### 🛠️ Development & Testing Tools

- [x] Escape Menu ✨
    - [x] Debugging option to let player choose which zone to load - it should
          load the zone immediately
    - [ ] Debugging option to add +50 credits, one per click
- [x] Persistent debugging state ✨
    - [x] Use local storage to retain things like requested gifts, or the
          graphic debug toggle, or which zone to play

## Known Bugs
