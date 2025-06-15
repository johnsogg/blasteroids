# Blasteroids Development TODO

## Current Sprint: Score and Lives System

### ✅ Completed
- [x] Create GameState class to track score and lives
- [x] Add scoring system for destroying asteroids (20/50/100 points based on size)

### 🚧 In Progress  
- [ ] Implement lives system with respawn mechanics (partially done - needs restart functionality)

### 📋 Pending
- [ ] Update UI to show current score and lives (GameState updates DOM but needs testing)
- [ ] Add game over state when lives reach zero (basic implementation done, needs restart)
- [ ] Add restart functionality (R key to reset game)

## Next Phase: Game Polish

### 🎯 High Priority
- [ ] Add level progression (spawn new asteroids when screen clear)
- [ ] Implement proper game over screen with restart
- [ ] Add invincibility period after ship respawn
- [ ] Improve asteroid generation (more variety in sizes and speeds)

### 🎨 Medium Priority  
- [ ] Add particle effects for explosions
- [ ] Implement thrust visual effect for ship
- [ ] Add sound effects (shooting, explosions, thrust)
- [ ] Improve UI styling and layout

### 🔧 Low Priority
- [ ] Add local high score storage
- [ ] Implement ship trails/afterimage effect
- [ ] Add extra life bonus at certain score thresholds
- [ ] Performance optimizations for large numbers of objects

## Technical Debt
- [ ] Refactor GameObject interface into proper entity classes
- [ ] Extract magic numbers into constants file
- [ ] Add unit tests for physics and collision systems
- [ ] Improve TypeScript types for better type safety

## Notes
- Game currently fully playable with core Asteroids mechanics
- Vector graphics match original 1979 aesthetic
- Physics system handles momentum, friction, and screen wrapping correctly
- Collision detection working for bullets, asteroids, and ship