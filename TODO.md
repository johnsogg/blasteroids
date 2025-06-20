# Blasteroids Development TODO

### 🎨 Visual & Audio Polish

### 🎮 Gameplay Features

- [x] When gifts appear out of warp bubbles, their movement vector seems to be
      away from the center of the board. Instead, they should have a completely
      random heading.
- [x] If the player has all lives left, do not gift extra lives
- [x] Create a constant that determines the maximum number of extra lives, and set it to 5. Then, use that constant wherever this idea is used, instead of the number literal (which is currently 99).
- [x] When the ship stops thrusting, there seems to be friction. Changing the
      constant for FRICTION does not seem to have any effect.
- [x] Add an audio effect for gifts: wubwubwubwubwubwubwub in a soft, low
      frequency that oscillates a bit
- [x] Add a timer for each level that starts at 60 seconds. Player gets N points
      per second left when they beat the level. The timer stops at zero and
      otherwise has no effect when it reaches zero.
- [x] Add extra life bonus at certain score thresholds

### 🔧 Technical Improvements

#### Physics Testing Foundation (for future gravity system)

- [ ] Add physics unit tests as foundation for future gravity system refactor
- [ ] Create baseline physics behavior tests (ship movement, bullet inheritance, collision)
- [ ] Add performance benchmarks for physics calculations with many entities

#### General

- [ ] Performance optimizations for large numbers of objects

## Big New Features

- [x] Implement cooperative computer player
  - [x] Separate resource management (fuel, weapons, lives, score) between human and AI players
  - [x] AI player has independent weapon progression and fuel consumption
  - [x] AI player respawns without affecting human player's lives
  - [x] Gift collection benefits the player who collected it
  - [x] AI can be controlled via `AI.ENABLED` constant in configuration
- [ ] Support combat between player and computer player
- [ ] Make AI player available as a gift spawned from warp bubbles

### 🛠️ Development & Testing Tools

## Known Bugs

- [ ] The lightning weapon no longer destroys asteroids. It does fire and the
      A/V effects work, but it doesn't remove asteroids.
