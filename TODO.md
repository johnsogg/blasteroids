# Blasteroids Development TODO

### Misc Thinklist

These are not TODOs - they are simply ideas as a foil for where the game might
go, and what is needed to make them happen.

- [ ] Would like the ability to tweak a parameter to make individual object
      types larger or smaller
- [ ] Would like for dimensions to be reckoned in terms of a board size (e.g.
      "ship is 1/40th of the screen width") - this will take some thinking
- [ ] Possibilities about additional game mechanics and systems:
    - Level types with different rules or conditions
    - Ship types
    - Shields
    - Level objectives or goals
    - Plot or storyline (why are we out there blasting asteroids anyway?)
    - Planet/star: gravity has an effect items with mass
    - Asteroid types that yield items and have different hit points
    - Multiplayer (cooperative, combative)

### 🎨 Visual & Audio Polish

- [x] Implement ship trails/afterimage effect
    - [x] Particle-based trail system with 8 trail points
    - [x] Dim orange color variations using HSL (25-45° hue range)
    - [x] Size variation (0.9 to 2.7 pixel radius range)
    - [x] Opacity variation with 2.5 second fade time
    - [x] Subtle glow effects for larger particles
    - [x] Performance optimized with automatic cleanup

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

#### Physics Testing Foundation (for future gravity system)

- [ ] Add physics unit tests as foundation for future gravity system refactor
- [ ] Create baseline physics behavior tests (ship movement, bullet inheritance, collision)
- [ ] Add performance benchmarks for physics calculations with many entities

#### Game.ts Refactoring (2,312 lines → focused systems)

- [ ] Split Game.ts into smaller collaborating systems for better maintainability and testing
- [ ] Extract EntityManager system from Game.ts (~300 lines) - entity lifecycle, filtering, queries
- [ ] Extract WeaponSystem from Game.ts (~400 lines) - weapon firing, switching, fuel management
- [ ] Extract CollisionSystem from Game.ts (~200 lines) - collision detection and response
- [ ] Extract GiftSystem from Game.ts (~300 lines) - gift spawning, warp bubbles, type selection
- [ ] Extract InputHandler from Game.ts (~200 lines) - context-based input processing
- [ ] Reduce core Game.ts to orchestration only (~200 lines) - game loop, system coordination

#### General

- [ ] Performance optimizations for large numbers of objects

### 🛠️ Development & Testing Tools

## Known Bugs
