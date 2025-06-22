# Blasteroids Development TODO

### 🎨 Visual & Audio Polish

- [x] Visual elements that are currently rendered with DOM and CSS should
      instead be rendered in HTMLCanvas. This will facilitate taking screenshots
      that involve the entire UI.

### 🕹️ Game Mechanic Polish

- [x] Missiles and pea shooter bullets currently behave differently when fired:
      pea shooter bullets go perfectly straight (as confirmed by turning on the
      debug graphics). Missiles do not stay on that line, as though they are
      experiencing friction differently. Missiles should behave more like pea
      shooter bullets.

### 🎮 Gameplay Features

- [x] Screenshot keyboard shortcut: defaults to T
- [ ] Merchant store in Zone Complete UI
    - [ ] You can buy upgrades (which are gifts, but you pay for them so we
          can't call them gifts here)
    - [ ] Merchant UI is a modal on top of the the Zone Complete screen
    - [ ] Also entirely done in HTML Canvas
    - [ ] Includes new weapons, weapon upgrades and extra lives
    - [ ] Does not include AI companion because that requires position info at
          collection time and there is no way to deploy it
    - [ ] Shows you a 'tech tree' of all the available weapons and their
          dependencies in a sort of graph
    - [ ] Two ways to interact:
        - [ ] Keyboard keys to select
            - [ ] Space to purchase
            - [ ] Escape or Enter to exit
        - [ ] Mouse
            - [ ] Single click to select
            - [ ] Double click to purchase
            - [ ] Click "Done Shopping" button to exit

### 🔧 Technical Improvements

#### Physics Testing Foundation (for future gravity system)

- [ ] Add physics unit tests as foundation for future gravity system refactor
- [ ] Create baseline physics behavior tests (ship movement, bullet inheritance, collision)
- [ ] Add performance benchmarks for physics calculations with many entities

#### General

- [ ] Performance optimizations for large numbers of objects

## Big New Features

### 🛠️ Development & Testing Tools

- [ ] Escape Menu ✨
    - [ ] Debugging option to add +50 credits, one per click

## Known Bugs
