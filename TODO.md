# Blasteroids Development TODO

### 🎨 Visual & Audio Polish

### 🎮 Gameplay Features

- [x] When gifts appear out of warp bubbles, their movement vector seems to be
      away from the center of the board. Instead, they should have a completely
      random heading.
- [ ] If the player has all lives left, do not gift extra lives
- [ ] When the ship stops thrusting, there seems to be friction. Changing the
      constant for FRICTION does not seem to have any effect.
- [ ] Add an audio effect for gifts: wubwubwubwubwubwubwub in a soft, low
      frequency that oscillates a bit
- [ ] Add a timer for each level that starts at 60 seconds. Player gets N points
      per second left when they beat the level. The timer stops at zero and
      otherwise has no effect when it reaches zero.
- [ ] Add extra life bonus at certain score thresholds
- [ ] Implement cooperative computer player
- [ ] Support combat between player and computer player

### 🔧 Technical Improvements

#### Physics Testing Foundation (for future gravity system)

- [ ] Add physics unit tests as foundation for future gravity system refactor
- [ ] Create baseline physics behavior tests (ship movement, bullet inheritance, collision)
- [ ] Add performance benchmarks for physics calculations with many entities

#### Visual Scaling System ✅ COMPLETED

#### General

- [ ] Performance optimizations for large numbers of objects

### 🛠️ Development & Testing Tools

## Known Bugs
