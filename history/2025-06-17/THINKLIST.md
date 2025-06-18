# Blasteroids Architecture Analysis for Future Features

This document analyzes the current Blasteroids architecture's ability to support the three key items from the Misc Thinklist in TODO.md.

## Feature Analysis

### 1. Object Scaling Parameters
**Goal**: Ability to tweak parameters to make individual object types larger or smaller

**Current Architecture Assessment**: ✅ **Supportable with minor changes**

**Current State**:
- All entities inherit `BaseEntity.size: Vector2` property
- Size handling exists in collision detection (`src/physics/Collision.ts`)
- Rendering system respects entity sizes (`src/render/Shapes.ts`)

**Required Changes**:
- Add scaling configuration system in `src/config/constants.ts`
- Implement scaling multipliers per entity type
- Update entity factories to apply scaling during creation

**Implementation Strategy**:
```typescript
// New scaling config
interface EntityScaling {
    ship: number;
    asteroid: number;
    bullet: number;
    missile: number;
    gift: number;
}

// Apply during entity creation
const scaledSize = baseSize.multiply(ENTITY_SCALING[entityType]);
```

### 2. Board-Relative Dimension System
**Goal**: Dimensions reckoned in terms of board size (e.g., "ship is 1/40th of the screen width")

**Current Architecture Assessment**: ⚠️ **Requires significant refactoring**

**Current State**:
- Canvas management exists in `src/display/` but uses absolute pixel coordinates
- Screen wrapping system understands canvas bounds
- No relative unit system currently implemented

**Architectural Challenges**:
- All current code uses absolute pixel values
- Vector2 operations assume pixel coordinates
- Collision detection uses pixel-based circle radii
- Rendering system draws with pixel precision

**Required Changes**:
1. **New coordinate system layer**:
   - Board units vs. pixel units distinction
   - Conversion utilities between coordinate systems
   - Updated Vector2 class or new BoardVector2 class

2. **Entity system updates**:
   - Entity sizes defined in board units
   - Position/velocity can remain in pixels for performance
   - Size conversion during rendering/collision

3. **Configuration refactoring**:
   - All size constants moved to board-relative units
   - Resolution-independent entity definitions

**Implementation Strategy**:
```typescript
interface BoardDimensions {
    width: number;  // e.g., 100 board units
    height: number; // e.g., 75 board units
}

class BoardUnit {
    static toPixels(boardUnits: number, axis: 'x' | 'y'): number;
    static fromPixels(pixels: number, axis: 'x' | 'y'): number;
}

// Entity sizes in board units
const SHIP_SIZE = new Vector2(2, 2); // 2% of board width/height
```

### 3. Additional Game Mechanics
**Goal**: Level types, ship types, shields, objectives, gravity, asteroid types, multiplayer

**Current Architecture Assessment**: 🔄 **Mixed - some well-supported, others need major additions**

#### Well-Supported by Current Architecture:
- **Ship types**: Entity system supports type variations easily
- **Asteroid types**: Current asteroid system can be extended
- **Shields**: Could be implemented as ship property/state
- **Level objectives**: GameState system provides framework

#### Requires Major Architectural Changes:
- **Level types with different rules**: No level definition system exists
- **Gravity system**: Physics system lacks force-based mechanics
- **Multiplayer**: Entire architecture is single-player focused

**Detailed Analysis**:

**Ship Types** ✅ **Well-supported**:
- Current `Ship` entity can be extended with ship type property
- Weapon system already demonstrates entity variation
- Input system supports different control schemes

**Shields** ✅ **Well-supported**:
- Can be implemented as ship state with visual rendering
- Collision system can check shield status before damage
- Fuel system can power shield operation

**Level Types/Objectives** ⚠️ **Needs framework expansion**:
- Current level progression is simple asteroid count based
- No level definition or rule system exists
- GameState would need objective tracking capabilities

**Gravity System** ❌ **Requires physics overhaul**:
- Current physics is velocity-based, not force-based
- No concept of mass or gravitational attraction
- Would need fundamental physics engine changes

**Multiplayer** ❌ **Requires complete networking layer**:
- Architecture is single-player only
- No client-server communication
- State synchronization would be complex
- Input system would need multi-player support

## Architecture Recommendations

### Short-term Enhancements (Low effort, high impact)
1. **Implement object scaling system** - extends current entity framework
2. **Add ship type variations** - leverages existing entity system
3. **Implement shield system** - natural extension of current mechanics

### Medium-term Refactoring (Moderate effort)
1. **Board-relative dimension system** - requires coordinate system overhaul
2. **Level definition framework** - needs new game progression system
3. **Enhanced asteroid types** - extends current asteroid mechanics

### Long-term Architectural Changes (High effort)
1. **Force-based physics system** - fundamental physics engine replacement
2. **Multiplayer networking** - complete architectural paradigm shift
3. **Complex level types** - requires rule engine and scripting system

## Conclusion

The current Blasteroids architecture is well-designed for extension in many areas, particularly around entity variations and gameplay mechanics. The modular structure, strong typing, and clear separation of concerns provide excellent foundations.

However, some features (board-relative dimensions, gravity, multiplayer) would require significant architectural investment. The codebase's current quality and organization make these changes feasible, but they represent substantial development efforts.

**Recommendation**: Implement features in the suggested order above, starting with object scaling and ship types to validate the extension patterns before undertaking larger architectural changes.