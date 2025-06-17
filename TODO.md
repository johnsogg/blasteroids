# Blasteroids Development TODO

### 🎨 Visual & Audio Polish

- [ ] Implement ship trails/afterimage effect

### 🎮 Gameplay Features

- [ ] Allow the game area to take on different geometries:
    - [ ] Arbitrary width/height
    - [ ] Full window width or height
    - [ ] Largest size that fits in window to match some aspect ratio
- [ ] When the player beats a level, show an animation to let the user know they're on the next level
- [ ] Add gift benefits (fuel refill, extra life, weapon upgrades, etc.)
- [ ] Add extra life bonus at certain score thresholds
- [ ] Implement UFO enemy ships (original Asteroids feature)
- [ ] Add power-ups or weapon variants

### 🔧 Technical Improvements

- [ ] Add unit tests for physics and collision systems
- [ ] Performance optimizations for large numbers of objects
- [ ] Constants should be symbols (not literals) and coded as config objects

## Known Bugs

- [ ] The display text has a strange line rendered on all the zeros but it should not be there
