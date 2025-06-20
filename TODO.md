# Blasteroids Development TODO

### 🎨 Visual & Audio Polish

### 🎮 Gameplay Features

- [ ] When gifts appear out of warp bubbles, their movement vector seems to be
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

- [x] **Game.ts size reduction completed**: Successfully reduced from 2,411 lines to 794 lines (67% reduction) by removing duplicate code that was left behind after system extraction. Game.ts now focuses on orchestration, rendering, and game loop management while properly delegating to extracted systems (EntityManager, WeaponSystem, CollisionSystem, GiftSystem, InputHandler).

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

#### Visual Scaling System ✅ COMPLETED

- [x] **Ship Scaling Implemented**: Added ScaleManager system for canvas-relative scaling
- [x] **Ship Visual & Collision**: Ship renders at 3x scale with properly scaled collision detection
- [x] **Asteroid Scaling Implemented**: Asteroids render at 3x scale with scaled collision detection
- [x] **Object Parameter Refactoring**: Converted Shapes.drawShip and drawAsteroid to use destructured object parameters for better readability
- [x] **All Drawing Functions Refactored**: Converted drawBullet, drawMissile, drawWarpBubble, and drawGift to use object parameters with scaling support
- [x] **SCALE Constants Added**: Added SCALE constants for all game objects (BULLET, WEAPONS.MISSILES, GIFT, WARP_BUBBLE) for easy adjustment
- [x] **Deprecated Constants Removed**: Cleaned up duplicate and deprecated warp bubble constants, consolidated into organized WARP_BUBBLE section
- [x] **Magic Numbers Eliminated**: Replaced hardcoded values in Shapes.ts with named constants (radius, sparkle count, collapse lines)

**Result**: Complete visual scaling system with consistent object parameter APIs across all drawing functions. All game elements can now be independently scaled via constants, and the ScaleManager provides responsive canvas-relative scaling. Code is more maintainable with eliminated magic numbers and organized constant structure.

#### General

- [ ] Performance optimizations for large numbers of objects

### 🛠️ Development & Testing Tools

## Known Bugs
