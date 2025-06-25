# Blasteroids Development TODO

### 🎨 Visual & Audio Polish

### 🕹️ Game Mechanic Polish

- [x] Update the Missile projectile to trigger an area of effect when it strikes
      an asteroid. The effect should be present for a configurable amount of
      time, initially set to 20 frames. The effect's range should be big enough
      to encompass any resulting smaller asteroids, and last long enough for
      those to be destroyed in its effect.

### 🎮 Gameplay Features

- [ ] New weapon: time freeze ray!
    - [ ] The ray shoots in an angular range from the ship, and its range is the
          width or height of the screen (whichever is smaller).
    - [ ] Any asteroids that the ray collides with will become frozen in time
          for some duration - the closer to the ship, the longer it will stay
          frozen. 5 seconds for very close to the ship, 1 second for the extreme
          distance.
    - [ ] During this time the player can switch weapons and have an easier shot
          on the frozen weapons.
    - [ ] While frozen, the asteroids are drawn with a slightly blue fill.
    - [ ] The audio effect for firing the freeze ray is a windy "fwoooosh" sound
          that somewhat descends in tone.
    - [ ] The audio effect for an asteroid getting frozen is like that of
          cracking ice with a high pitched "dee dee dee" sound.
    - [ ] Unlike most other weapons, the freeze ray is not consumed when it hits
          an asteroid, but continues going.

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
