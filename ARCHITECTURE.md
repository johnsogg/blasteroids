# Blasteroids Architecture Documentation

## Overview

Blasteroids is a web-based Asteroids-style game built with TypeScript and HTML5 Canvas. It features authentic vector graphics, classic arcade gameplay mechanics, and modern web development practices. The architecture follows a modular, entity-based design with clear separation of concerns.

## Table of Contents

- [Core Architecture](#core-architecture)
- [Entity System](#entity-system)
- [Game Mechanics](#game-mechanics)
- [Input System](#input-system)
- [Audio System](#audio-system)
- [Visual System](#visual-system)
- [Development Guidelines](#development-guidelines)

## Core Architecture

### Main Components

The game is built around several core systems that work together:

```
src/
├── game/              # Core game loop and state management
├── entities/          # Game object definitions and types
├── input/             # Input handling and context management
├── audio/             # Sound effects and audio management
├── render/            # Graphics rendering and visual effects
├── physics/           # Collision detection and movement
├── utils/             # Utility classes (Vector2, math helpers)
├── config/            # Game constants and configuration
├── display/           # Canvas management and geometry
├── menu/              # Menu system and UI components
└── animations/        # Special animations and effects
```

### Game Loop (`src/game/Game.ts`)

The `Game` class is the central coordinator that manages:

- **Fixed timestep game loop** using `requestAnimationFrame`
- **Entity lifecycle** (creation, updates, destruction)
- **Input context management** based on game state
- **Collision detection** between all game objects
- **State transitions** (gameplay, pause, game over, level complete)
- **Audio triggering** for game events

Key methods:
- `gameLoop()`: Main loop handling update/render cycle
- `update(deltaTime)`: Updates all entities and game state
- `render()`: Draws all entities and UI elements
- `checkCollisions()`: Handles all collision interactions

### Game State (`src/game/GameState.ts`)

The `GameState` class manages:

- **Score and lives** tracking with high score persistence
- **Level progression** and difficulty scaling
- **Fuel system** with consumption tracking
- **Weapon management** including unlocks and upgrades
- **UI updates** for HUD elements
- **Local storage** for persistent data

## Entity System

### Base Entity Architecture (`src/entities/`)

All game objects inherit from `BaseEntity` interface:

```typescript
interface BaseEntity {
    position: Vector2;
    velocity: Vector2;
    size: Vector2;
    rotation: number;
    color: string;
    age?: number;
    maxAge?: number;
}
```

### Entity Types

1. **Ship** (`Ship.ts`)
   - Player-controlled entity with special properties
   - Trail system for visual movement history
   - Weapon states (laser active, lightning targeting)
   - Invulnerability system for respawn protection

2. **Asteroid** (`Asteroid.ts`)
   - Procedurally sized with realistic physics
   - Split into smaller fragments when destroyed
   - Varying speeds based on size (small = fast, large = slow)

3. **Projectiles**
   - **Bullet**: Basic projectile with limited lifespan
   - **Missile**: Self-propelled with acceleration and optional homing

4. **Interactive Objects**
   - **Gift**: Collectible power-ups with warp bubble spawning
   - **WarpBubble**: Animated portals for gift delivery system

### Type Safety and Guards

The entity system uses TypeScript union types and type guards:

```typescript
export type GameEntity = Ship | Asteroid | Bullet | Missile | Gift | WarpBubbleIn | WarpBubbleOut;

export const isShip = (entity: GameEntity): entity is Ship => entity.type === "ship";
```

## Game Mechanics

### Physics System (`src/physics/Collision.ts`)

- **Circle-based collision detection** for performance
- **Realistic momentum** preservation (ship velocity affects bullets)
- **Screen wrapping** for ships and asteroids
- **Friction and acceleration** for realistic movement

### Weapon System (`src/entities/Weapons.ts`)

Four distinct weapon types with unique mechanics:

1. **Bullets**: Rapid-fire projectiles with upgrades for size and fire rate
2. **Missiles**: Self-propelled with acceleration, explosion radius, and optional homing
3. **Laser**: Continuous beam weapon with fuel consumption and instant hit detection
4. **Lightning**: Area-effect weapon with chaining capability and target seeking

Each weapon has:
- **Unlock requirements** (found as gifts)
- **Upgrade system** (enhanced through gift collection)
- **Fuel consumption** balancing
- **Unique audio/visual effects**

### Fuel System

- **Life support consumption**: Continuous fuel drain (0.5 units/second)
- **Thruster consumption**: Main engine (2 units/second), strafe thrusters (1 unit/second each)
- **Weapon consumption**: Each weapon type has different fuel costs
- **Fuel depletion consequences**: Life support failure results in ship destruction

### Gift System

Sophisticated power-up delivery system:

1. **Warp bubble spawning**: Gifts arrive via animated portals
2. **Physics-based movement**: Gifts move toward screen center with realistic trajectories
3. **Exit portals**: Uncollected gifts are retrieved by closing warp bubbles
4. **Weighted distribution**: Gift types selected based on game state and player needs

## Input System

### Context-Based Input Management (`src/input/`)

The input system prevents "input bleeding" between game states:

```typescript
enum InputContext {
    GAMEPLAY,    // Normal game controls
    MENU,        // Menu navigation only
    LEVEL_COMPLETE, // Only space for dismissal
    GAME_OVER,   // Only restart key
    PAUSED       // Only escape to unpause
}
```

### Input Processing

- **Keyboard mapping**: Arrow keys + WASD for movement, Q/E for strafing
- **Single-press detection**: Prevents key repeat for weapon switching
- **Context validation**: Inputs only processed when appropriate for current state
- **Consumption tracking**: Prevents accidental multi-trigger events

## Audio System

### Web Audio API Implementation (`src/audio/AudioManager.ts`)

The audio system uses procedural sound generation:

- **Oscillator-based synthesis** for retro sound effects
- **Dynamic audio context management** handling browser restrictions
- **Procedural effects**: Pink noise for thrust, frequency sweeps for various effects
- **Context-aware playback**: Sounds triggered based on game events

### Sound Categories

1. **Weapon sounds**: Each weapon type has distinct audio signature
2. **Impact sounds**: Different tones for asteroid sizes and destruction types
3. **Ship sounds**: Thrust, hit, and destruction effects
4. **UI sounds**: Menu navigation, gift collection, warp bubbles
5. **Ambient sounds**: Game start fanfare, game over sequence

## Visual System

### Vector Graphics Rendering (`src/render/Shapes.ts`)

Authentic Asteroids-style vector graphics:

- **Canvas 2D context** for high-performance rendering
- **Procedural shape generation** for asteroids (irregular polygons)
- **Screen wrapping visualization** objects drawn at multiple positions when near edges
- **Trail effects**: Ship movement trails with opacity-based fading
- **Particle system**: Explosion effects and missile trails

### Visual Effects

1. **Ship rendering**: 
   - Vector triangle with thrust flames
   - Invulnerability blinking effect
   - Strafe thruster flames based on input

2. **Weapon effects**:
   - Laser beams with glow effects
   - Lightning arcs with procedural jagged paths
   - Missile trail particles

3. **Special effects**:
   - Warp bubble animations with energy sparkles
   - Explosion particle systems
   - HUD elements with retro styling

### UI System

- **Canvas-based HUD**: Score, lives, level display
- **Fuel gauge**: Color-coded fuel percentage indicator
- **Weapon HUD**: Visual indicators for unlocked/selected weapons
- **Responsive geometry**: Canvas sizing adapts to window dimensions

## Development Guidelines

### Code Organization

- **Separation of concerns**: Each system has clearly defined responsibilities
- **TypeScript strict mode**: Full type safety with interfaces and unions
- **Immutable vectors**: `Vector2` class provides immutable vector operations
- **Configuration-driven**: Game constants centralized in `config/constants.ts`

### Performance Considerations

- **Efficient collision detection**: Circle-based rather than complex polygon intersection
- **Optimized rendering**: Minimal canvas state changes, batched operations
- **Entity lifecycle management**: Proper cleanup prevents memory leaks
- **Audio context management**: Handles browser autoplay restrictions

### Extension Points

The architecture supports easy extension:

1. **New entity types**: Implement `BaseEntity` interface and add to `GameEntity` union
2. **Additional weapons**: Extend `WeaponType` and add handling in weapon system
3. **New power-ups**: Add to `GiftType` and implement collection logic
4. **Visual effects**: Add new shape drawing methods to `Shapes` class
5. **Audio effects**: Add new sound generation methods to `AudioManager`

### Testing Strategy

- **Type safety**: TypeScript compiler catches many runtime errors
- **Modular design**: Individual systems can be tested in isolation
- **Constants configuration**: Easy to modify game balance for testing
- **Debug features**: Gift type override system for testing specific scenarios

## Key Design Patterns

1. **Entity-Component pattern**: Entities have type-specific properties and behaviors
2. **State machine**: Input contexts and game states managed as state machines
3. **Observer pattern**: GameState updates trigger UI refreshes
4. **Factory pattern**: Entity creation methods with proper initialization
5. **Strategy pattern**: Different weapon types implement common interface

This architecture provides a solid foundation for classic arcade gameplay while remaining extensible for future enhancements. The clear separation of concerns and strong typing make it easy for developers to understand, modify, and extend the codebase.