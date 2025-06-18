# Blasteroids Development TODO

### 🎨 Visual & Audio Polish

- [ ] Implement ship trails/afterimage effect

### 🎮 Gameplay Features

- [x] Weapon mechanics: different weapons, each with their own upgrades

    - [x] Lasers!
        - [x] Keyboard shortcut: 3
        - [x] Firing emits a solid beam, like a laser sword, but it is not very long
        - [x] It drains fuel quickly (7 units/sec, reduced by 30% from original design)
        - [x] Gift Upgrade: 50% longer range
        - [x] Gift Upgrade: 50% more efficient fuel usage
        - [x] Instant hit-scan beam with line-circle collision detection
        - [x] Multi-layer visual rendering with glow effects
        - [x] Sci-fi audio effects with frequency modulation
        - [x] Auto-switch to newly acquired weapons
    - [x] Lightning
        - [x] Keyboard shortcut: 4
        - [x] An electrical arc will zap the nearest object in a circle around the ship
        - [x] Consumes 8 fuel per shot with 1.5 second cooldown
        - [x] 60 pixel base radius for target finding
        - [x] Gift Upgrade: 20% larger radius
        - [x] Gift Upgrade: Chain lightning jumps to additional targets (max 3 total)
        - [x] Animated jagged electrical arcs with glow effects
        - [x] Electrical crackling sound effects with frequency modulation
        - [x] Muffled "urk" sound when no targets in range (no fuel consumed)
        - [x] Only consumes fuel and cooldown when valid target found

- [x] **Repulsor Beam**: Asteroid fragments now fly away from ship instead of toward it
    - [x] 40% bias away from ship position with 60% randomness
    - [x] Applied to all weapon destructions (bullets, missiles, laser, lightning)
    - [x] Prevents cheap deaths from debris created by successful attacks
    - [x] Configurable repulsor strength in constants

- [x] **Life Support Fuel System**: Running out of fuel now kills you
    - [x] Continuous fuel drain: 0.1 units per second for life support
    - [x] Fuel depletion triggers immediate death with explosion effects
    - [x] Automatic fuel refill on respawn (if lives remaining)
    - [x] Adds survival tension and strategic resource management
    - [x] "Hey, life support takes fuel too, right?" gameplay mechanic

- [ ] Add extra life bonus at certain score thresholds
- [ ] Implement UFO enemy ships (original Asteroids feature)
- [ ] Add power-ups or weapon variants

### 🔧 Technical Improvements

- [ ] Add unit tests for physics and collision systems
- [ ] Performance optimizations for large numbers of objects

### 🛠️ Development & Testing Tools

## Known Bugs
