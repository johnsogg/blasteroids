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
- [x] Merchant store in Zone Complete UI
    - [x] You can buy upgrades (which are gifts, but you pay for them so we
          can't call them gifts here)
    - [x] Merchant UI is a modal on top of the the Zone Complete screen
    - [x] Also entirely done in HTML Canvas
    - [x] Spend Credits. Can not go below zero (no credit cards here)
    - [x] Includes new weapons, weapon upgrades and extra lives
    - [x] Does not include AI companion because that requires position info at
          collection time and there is no way to deploy it
    - [x] Shows you a list of all the available weapons and their
          dependencies (tech tree graph moved to future enhancement)
    - [x] Two ways to interact:
        - [x] Keyboard keys to select
            - [x] Space to purchase
            - [x] Escape or Enter to exit
        - [x] Mouse
            - [x] Single click to select
            - [x] Double click to purchase
            - [x] Click "Done Shopping" button to exit

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

### 🎨 UI Enhancements

- [ ] Merchant Store Tech Tree Graph Visualization
    - [ ] Convert list-based merchant UI to interactive tech tree graph
    - [ ] Canvas-based node positioning with dependency connection lines
    - [ ] 2D mouse interaction for clicking nodes at arbitrary positions
    - [ ] Visual layout algorithms to prevent overlapping nodes
    - [ ] Animated connection lines showing upgrade paths

## Known Bugs
