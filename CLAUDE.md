# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Blasteroids is a web-based Asteroids-style game built with TypeScript and HTML5 Canvas, featuring authentic vector graphics and classic arcade gameplay mechanics.

## Development Commands

- `npm run dev`: Start development server with hot module reloading
- `npm run build`: Production build with TypeScript compilation and Vite optimization
- `npm run lint:fix`: Run ESLint with auto-fix (includes Prettier formatting)
- `npm run preview`: Preview production build locally

## Architecture

### Core Systems

- **Game Loop**: Fixed timestep game loop using requestAnimationFrame
- **Physics**: Vector2-based position/velocity system with realistic momentum
- **Input**: Keyboard input manager supporting Arrow keys and WASD
- **Collision**: Circle-based collision detection for all game objects
- **Rendering**: Vector graphics using Canvas 2D context, authentic Asteroids styling

### Key Classes

- `Game`: Main game controller managing entities and game loop
- `GameState`: Score tracking, lives management, and game over handling
- `Vector2`: Immutable 2D vector math utilities
- `InputManager`: Keyboard input handling with convenient game key mappings
- `Collision`: Circle collision detection utilities
- `Shapes`: Vector graphics rendering for ship, asteroids, and bullets

### Project Structure

```
src/
├── game/          # Core game classes (Game, GameState)
├── entities/      # Game object classes (planned for refactoring)
├── physics/       # Physics and collision systems
├── input/         # Input handling
├── render/        # Graphics and shape rendering
└── utils/         # Utility classes (Vector2, math helpers)
```

## Game Mechanics

### Controls

- Arrow Keys/WASD: Ship rotation and main thrust (2 fuel/sec)
- Q/E: Port/starboard strafing thrusters (50% power, 1 fuel/sec each)
- Spacebar: Fire bullets (150ms rate limit)

### Fuel System

- Fuel capacity: 100 units displayed in top-center gauge
- Main thruster consumes 2 fuel per second
- Strafe thrusters consume 1 fuel per second each
- Fuel refills to 100% upon level completion
- Ship cannot move without sufficient fuel

### Physics

- Ships have momentum and inertia like classic Asteroids
- Bullets inherit ship velocity for realistic ballistics
- Screen wrapping for ships and asteroids (bullets disappear off-screen)

### Scoring (Classic Asteroids Values)

- Large asteroids: 20 points
- Medium asteroids: 50 points
- Small asteroids: 100 points

## Development Notes

- Game uses authentic vector graphics matching original 1979 Asteroids
- Collision detection is circle-based for performance
- All TypeScript with strict mode enabled
- ESLint configuration optimized for game development patterns
- 4-space indentation, import ordering enforced

## Current Status

See [TODO.md](./TODO.md) for current development tasks and roadmap.

## Memories

- Keep the TODO.md file up to date with the current status, but always ask the user before writing to it to avoid conflicts
- Always run formatting and linting before commits
- Use descriptive commit messages that explain the "why" not just the "what"
- When committing to git, group changes into meaningful sets so their commits are logical
- Keep the README.md up to date before pushing to remote
