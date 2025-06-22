# Blasteroids Development TODO

### 🎨 Visual & Audio Polish

- [x] Visual elements that are currently rendered with DOM and CSS should
      instead be rendered in HTMLCanvas. This will facilitate taking screenshots
      that involve the entire UI.

### 🕹️ Game Mechanic Polish

- [ ] Missiles and pea shooter bullets currently behave differently when fired:
      pea shooter bullets go perfectly straight (as confirmed by turning on the
      debug graphics). Missiles do not stay on that line, as though they are
      experiencing friction differently. Missiles should behave more like pea
      shooter bullets.

### 🎮 Gameplay Features

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

- [ ] Escape Menu ✨
    - [ ] Debugging option to add +50 credits, one per click

## Known Bugs
