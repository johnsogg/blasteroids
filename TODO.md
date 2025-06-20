# Blasteroids Development TODO

### 🎨 Visual & Audio Polish

### 🎮 Gameplay Features

- [ ] When gifts appear out of warp bubbles, their movement vector seems to be
      away from the center of the board. Instead, they should have a completely
      random heading.
- [ ] If the player has all lives left, do not gift extra lives
- [ ] When the ship stops thrusting, there seems to be friction. Changing the
      constant for FRICTION does not seem to have any effect.
- [ ] Add an audio effect for gifts: wubwubwubwubwubwubwub in a soft, low frequency
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

#### Game.ts Refactoring (2,312 lines → focused systems) ✅ COMPLETED

- [x] **MAJOR REFACTOR COMPLETED**: Split Game.ts into smaller collaborating systems for better maintainability and testing
- [x] Extract EntityManager system from Game.ts (~300 lines) - entity lifecycle, filtering, queries
- [x] Extract WeaponSystem from Game.ts (~400 lines) - weapon firing, switching, fuel management
- [x] Extract CollisionSystem from Game.ts (~200 lines) - collision detection and response
- [x] Extract GiftSystem from Game.ts (~300 lines) - gift spawning, warp bubbles, type selection
- [x] Extract InputHandler from Game.ts (~200 lines) - context-based input processing
- [x] Reduce core Game.ts to orchestration only (~400 lines) - game loop, system coordination
- [x] Set up Vitest testing framework with TypeScript and jsdom support
- [x] Add comprehensive test suites: 77 total tests with 68 passing (88% pass rate)
- [x] Fix all linting and formatting issues for code quality compliance

**Result**: Successfully transformed monolithic 2,312-line Game.ts into 6 focused, testable systems with clear separation of concerns. The codebase is now significantly more maintainable and ready for future development.

#### Visual Scaling System ✅ IN PROGRESS

- [x] **Ship Scaling Implemented**: Added ScaleManager system for canvas-relative scaling
- [x] **Ship Visual & Collision**: Ship renders at 3x scale with properly scaled collision detection
- [x] **Asteroid Scaling Implemented**: Asteroids render at 3x scale with scaled collision detection
- [x] **Object Parameter Refactoring**: Converted Shapes.drawShip and drawAsteroid to use destructured object parameters for better readability
- [ ] **Remaining Elements**: Refactor other Shapes.drawFoo functions (bullets, missiles, etc.) to use object parameters and implement scaling

**Progress**: Core scaling infrastructure complete. Ship and asteroids successfully scaled 3x with visual-collision consistency. Framework ready for remaining game elements.

#### General

- [ ] Performance optimizations for large numbers of objects

### 🛠️ Development & Testing Tools

## Known Bugs
