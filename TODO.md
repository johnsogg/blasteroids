# Blasteroids Development TODO

### 🎨 Visual & Audio Polish

### 🎮 Gameplay Features

### 🔧 Technical Improvements

#### Physics Testing Foundation (for future gravity system)

- [ ] Add physics unit tests as foundation for future gravity system refactor
- [ ] Create baseline physics behavior tests (ship movement, bullet inheritance, collision)
- [ ] Add performance benchmarks for physics calculations with many entities

#### General

- [ ] Performance optimizations for large numbers of objects

## Big New Features

- [ ] Zones and Levels!
    - So far in development, the different levels are identical
    - Our new goal is to have a series of "zones"
    - Each zone will have an infinite number of levels
    - After every N levels in a zone, the player is presented with a choice:
        - Keep playing the zone and go to the next level
        - Proceed to the next zone
        - Buy upgrades using a currency that does not yet exist (but it will!)
    - Each zone will eventually introduce new game mechanics and story
    - A zone and level will be designated with two numbers separated by a dash
        - Example: 1-1 is the starting zone and starting level
        - Example: 3-8 is the third zone, eight level

### 🛠️ Development & Testing Tools

## Known Bugs
