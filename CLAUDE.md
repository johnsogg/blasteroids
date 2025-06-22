# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Blasteroids is a sophisticated web-based Asteroids game built with TypeScript and HTML5 Canvas. It has evolved into a comprehensive game with multiple weapon systems, AI companions, shields, power-ups, and multiplayer support.

## Development Commands

- `npm run dev`: Start development server
- `npm run build`: Production build  
- `npm run lint:fix`: Run ESLint with auto-fix
- `npm run test:run`: Run unit tests with vitest

## Architecture Essentials

### Core Systems
- **EntityManager**: Centralized entity management and queries
- **WeaponSystem**: Multi-weapon support (bullets, missiles, laser, lightning) with upgrades
- **ShieldSystem**: Active defense with fuel consumption and bouncing physics
- **GiftSystem**: Power-ups through animated warp bubble portals
- **AISystem**: Computer players + AI companions with behavioral states
- **GameState**: Player state management via playerIds (fuel, weapons, lives)

### Key Directories
- `game/`: Core game systems
- `config/constants.ts`: ALL configuration values (no magic numbers)
- `entities/`: Game objects with typed interfaces
- `*.test.ts`: vitest tests (co-located with source)

## Development Approach

- **Use TDD by default**: Write tests first, then implement
- **Use vitest** (not Jest) for all testing
- **Use EntityManager** for entity queries and lifecycle
- **Use GameState** for player state, not Ship entities directly
- **Check constants.ts** for configuration before hardcoding values
- **Explore existing patterns** before creating new systems

## Memories

- "update the TODOs" = update TODO.md file, not internal TodoWrite system
- Always ask before writing to TODO.md to avoid conflicts
- Run `npm run lint:fix` before commits
- Use descriptive commit messages explaining "why" not "what"
- Leave temporary TODOs as `// TODO(claude): <comment>`
- This codebase is complex - understand existing systems before adding new features
- Use console.warn for console statements that we intend to keep
- Use console.log statements for temporary debugging. If the log statements are part of a debugging function that we might use again, use eslint-disable-next-line no-console to silence linter warnings