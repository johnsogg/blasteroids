# Blasteroids Development TODO

### 🎨 Visual & Audio Polish

### 🕹️ Game Mechanic Polish

### 🎮 Gameplay Features

### 🔧 Technical Improvements

#### Code Quality & Testing

#### Physics Testing Foundation (for future gravity system)

- [ ] Add physics unit tests as foundation for future gravity system refactor
- [ ] Create baseline physics behavior tests (ship movement, bullet inheritance, collision)
- [ ] Add performance benchmarks for physics calculations with many entities

#### General

- [ ] Performance optimizations for large numbers of objects

## Big New Features

### 🛠️ Development & Testing Tools

- [ ] Escape Menu: Add a debugging option to add +50 credits, one per activation

### 🎨 UI Enhancements

- [ ] (low priority) Merchant Store Tech Tree Graph Visualization
    - [ ] Convert list-based merchant UI to interactive tech tree graph
    - [ ] Canvas-based node positioning with dependency connection lines
    - [ ] 2D mouse interaction for clicking nodes at arbitrary positions
    - [ ] Visual layout algorithms to prevent overlapping nodes
    - [ ] Animated connection lines showing upgrade paths

## Known Bugs

- [x] After pressing Escape from the Merchant Menu, the game is stuck. If I
      re-enter the Merchant menu and press escape, the game is un-stuck. The
      game should never get stuck, and it should always be paused when the user
      is looking at either the game menu or the merchant shop.
- [x] Missiles should not inherit the ship's velocity (even though this is not
      physically correct, it still feels right). When a missile is launched it
      should have zero acceleration or velocity at the instant it is created,
      though it will begin to accelerate on its own right away.
- [x] Merchant menu: the bottom right text below item price should match the
      mocks in ![this image](<history/2025-06-22/Merchant Shop.png>).
      Specifically four things: 1. "can't afford :broken_heart:" for items that
      are available but you don't have enough money (this is done correctly, you
      should refer to it). 2. Items that are available and you have enough money
      should say "Need it :heart:". 3. Items that you already have say "Got it
      :green_check:". 4. Items that are unavailable because of missing
      dependencies should say "Need <whatever> :lock:" where <whatever> is a
      short string like "Missiles" to let the user know what they need.
