/**
 * Game configuration constants
 * Centralizes all magic numbers for easy gameplay tuning
 */

// =============================================================================
// CANVAS & DISPLAY
// =============================================================================
export const CANVAS = {
    // Default dimensions
    DEFAULT_WIDTH: 800,
    DEFAULT_HEIGHT: 600,

    // Minimum dimensions for gameplay
    MIN_WIDTH: 600,
    MIN_HEIGHT: 400,

    // Maximum dimensions (prevent too large)
    MAX_WIDTH: 2560,
    MAX_HEIGHT: 1440,

    // Aspect ratios
    CLASSIC_RATIO: 4 / 3, // 800x600, 1024x768, etc.
    WIDESCREEN_RATIO: 16 / 9, // 1920x1080, 1280x720, etc.
    ULTRAWIDE_RATIO: 21 / 9, // 2560x1080, etc.
} as const;

// Geometry modes for different canvas sizing
export type GeometryMode = "fixed" | "fullWindow" | "aspectFit" | "custom";

export const GEOMETRY = {
    // Available geometry modes
    MODES: {
        FIXED: "fixed" as const, // Fixed 800x600 (classic)
        FULL_WINDOW: "fullWindow" as const, // Full window dimensions
        ASPECT_FIT: "aspectFit" as const, // Largest size that fits window maintaining aspect ratio
        CUSTOM: "custom" as const, // Custom width/height
    },

    // Default settings
    DEFAULT_MODE: "fixed" as const,
    DEFAULT_ASPECT_RATIO: 4 / 3,

    // Responsive breakpoints
    BREAKPOINTS: {
        MOBILE: 768,
        TABLET: 1024,
        DESKTOP: 1440,
    },

    // Padding for aspect fit mode (pixels from window edge)
    WINDOW_PADDING: 20,
} as const;

// =============================================================================
// SHIP CONFIGURATION
// =============================================================================
export const SHIP = {
    // Physics
    ROTATION_SPEED: 5, // radians per second
    THRUST_POWER: 300, // pixels per second squared
    MAX_SPEED: 400, // pixels per second
    FRICTION: 0.98, // velocity damping multiplier

    // Dimensions
    WIDTH: 20,
    HEIGHT: 10,

    // Spawn (relative to canvas center)
    SPAWN_X_RATIO: 0.5, // 50% of canvas width (center)
    SPAWN_Y_RATIO: 0.5, // 50% of canvas height (center)

    // Invulnerability
    INVULNERABLE_TIME: 3.0, // seconds

    // Colors
    COLOR: "#00ff00",
    INVULNERABLE_COLOR: "#ffff00",
} as const;

// =============================================================================
// FUEL SYSTEM
// =============================================================================
export const FUEL = {
    MAX_CAPACITY: 100,
    MAIN_THRUST_CONSUMPTION: 2, // units per second
    STRAFE_THRUST_CONSUMPTION: 1, // units per second per thruster
    STRAFE_POWER_MULTIPLIER: 0.5, // 50% of main thrust power

    // Gauge visual settings
    GAUGE_WIDTH: 200,
    GAUGE_HEIGHT: 20,
    GAUGE_X_OFFSET: 0, // centered
    GAUGE_Y: 20,
    GAUGE_CORNER_RADIUS: 4,
    GAUGE_OPACITY: 0.4,
} as const;

// =============================================================================
// WEAPONS & PROJECTILES
// =============================================================================
export const BULLET = {
    SPEED: 500, // pixels per second
    SIZE: 3,
    MAX_AGE: 3, // seconds
    FIRE_RATE: 150, // milliseconds between shots
    COLOR: "#ffff00",
    OUT_OF_BOUNDS_MARGIN: 50, // pixels beyond screen edge
} as const;

// =============================================================================
// ASTEROIDS
// =============================================================================
export const ASTEROID = {
    // Size categories
    LARGE_MIN_SIZE: 30,
    LARGE_MAX_SIZE: 40,
    LARGE_MIN_SPEED: 20,
    LARGE_MAX_SPEED: 60,

    MEDIUM_MIN_SIZE: 20,
    MEDIUM_MAX_SIZE: 30,
    MEDIUM_MIN_SPEED: 40,
    MEDIUM_MAX_SPEED: 100,

    SMALL_MIN_SIZE: 10,
    SMALL_MAX_SIZE: 20,
    SMALL_MIN_SPEED: 60,
    SMALL_MAX_SPEED: 140,

    // Distribution (must sum to 1.0)
    LARGE_SPAWN_CHANCE: 0.3,
    MEDIUM_SPAWN_CHANCE: 0.3,
    // Small chance = 1.0 - large - medium = 0.4

    // Splitting
    MIN_SPLIT_SIZE: 20,
    FRAGMENT_COUNT_MIN: 2,
    FRAGMENT_COUNT_MAX: 4,
    FRAGMENT_SIZE_MIN: 0.4, // 40% of parent
    FRAGMENT_SIZE_MAX: 0.7, // 70% of parent
    FRAGMENT_SPEED_MIN: 80,
    FRAGMENT_SPEED_MAX: 140,
    FRAGMENT_SPAWN_RADIUS: 40,

    // Visual
    COLOR: "#ffffff",
    ROTATION_SPEED: 1, // radians per second

    // Spawn safe zone (distance from ship center)
    SPAWN_SAFE_ZONE: 150,
} as const;

// =============================================================================
// SCORING
// =============================================================================
export const SCORING = {
    // Original Asteroids values
    LARGE_ASTEROID: 20,
    MEDIUM_ASTEROID: 50,
    SMALL_ASTEROID: 100,

    // Gift collection
    GIFT: 150,

    // Thresholds
    EXTRA_LIFE_THRESHOLD: 10000, // Future feature
} as const;

// =============================================================================
// LEVELS
// =============================================================================
export const LEVEL = {
    BASE_ASTEROID_COUNT: 3,
    ASTEROIDS_PER_LEVEL: 1, // 3 + level number
    MAX_ASTEROIDS: 12, // Practical limit for playability
} as const;

// =============================================================================
// GIFT SYSTEM
// =============================================================================
export const GIFT = {
    // Timing
    SPAWN_INTERVAL: 15000, // milliseconds between gifts
    LIFESPAN: 10.0, // seconds before timeout removal
    WARP_BUBBLE_CREATION_DELAY: 5.0, // seconds after gift spawn

    // Movement
    SPEED_MIN: 30,
    SPEED_MAX: 60,
    ROTATION_SPEED: 2, // radians per second

    // Collision
    COLLECTION_DISTANCE: 10, // pixels from center

    // Visual
    SIZE: 20,
    COLOR: "#ffff00",

    // Warp bubbles
    WARP_BUBBLE_SIZE: 80,
    WARP_BUBBLE_COLOR: "#00ffff",
    OPENING_ANIMATION_TIME: 3.0, // seconds
    CLOSING_ANIMATION_TIME: 1.0, // seconds
    DISAPPEAR_ANIMATION_TIME: 0.5, // seconds
    TRAJECTORY_PREDICTION_TIME: 3.0, // seconds ahead
} as const;

// =============================================================================
// AUDIO
// =============================================================================
export const AUDIO = {
    MASTER_VOLUME: 0.1,
    THRUST_INTERVAL: 200, // milliseconds between thrust sounds
} as const;

// =============================================================================
// VISUAL EFFECTS
// =============================================================================
export const VFX = {
    // Thrust flames
    THRUST_FLAME_MIN_LENGTH: 8,
    THRUST_FLAME_MAX_LENGTH: 14,
    STRAFE_FLAME_MIN_LENGTH: 4,
    STRAFE_FLAME_MAX_LENGTH: 7,
    FLAME_COLOR: "#ff6600",

    // Invulnerability blinking
    INVULNERABLE_BLINK_RATE: 5, // Hz (times per second)

    // Warp bubble effects
    WARP_SPARKLE_COUNT: 8,
    WARP_COLLAPSE_LINES: 6,

    // Particle system
    PARTICLE_FRICTION: 0.98,

    // Asteroid explosion particles
    ASTEROID_PARTICLE_SIZE_RATIO: 8, // asteroidSize / 8
    ASTEROID_PARTICLE_ANGLE_VARIATION: 0.5, // radians
    ASTEROID_PARTICLE_SPEED_MIN: 50,
    ASTEROID_PARTICLE_SPEED_MAX: 100,
    ASTEROID_PARTICLE_LIFE_MIN: 0.8,
    ASTEROID_PARTICLE_LIFE_VARIATION: 0.4, // +0.4 seconds
    ASTEROID_PARTICLE_MAX_LIFE: 1.0,
    ASTEROID_PARTICLE_SIZE_MIN: 1,
    ASTEROID_PARTICLE_SIZE_VARIATION: 2,
    ASTEROID_PARTICLE_SPAWN_SPREAD: 10, // pixels

    // Ship explosion particles
    SHIP_EXPLOSION_PARTICLES: 12,
    SHIP_PARTICLE_ANGLE_VARIATION: 0.3, // radians
    SHIP_PARTICLE_SPEED_MIN: 80,
    SHIP_PARTICLE_SPEED_MAX: 120,
    SHIP_PARTICLE_LIFE_MIN: 1.2,
    SHIP_PARTICLE_LIFE_VARIATION: 0.6, // +0.6 seconds
    SHIP_PARTICLE_MAX_LIFE: 1.5,
    SHIP_PARTICLE_SIZE_MIN: 1.5,
    SHIP_PARTICLE_SIZE_VARIATION: 2.5,
    SHIP_PARTICLE_SPAWN_SPREAD: 5, // pixels
    SHIP_PARTICLE_ORANGE_CHANCE: 0.7, // 30% orange, 70% white
} as const;

// =============================================================================
// USER INTERFACE
// =============================================================================
export const UI = {
    // Lives display
    MAX_LIVES_DISPLAY: 3,
    LIVES_SPACING: 30,
    LIVES_ROTATION: -Math.PI / 4, // -45 degrees (up and right)
    LIVES_ICON_SIZE: 0.5,
    LIVES_X_OFFSET: 15,
    LIVES_Y_OFFSET: 15,
} as const;

// =============================================================================
// INPUT
// =============================================================================
export const INPUT = {
    // No constants needed - just key mappings
} as const;

// =============================================================================
// COLORS
// =============================================================================
export const COLORS = {
    BACKGROUND: "#000000",
    SHIP: "#00ff00",
    SHIP_INVULNERABLE: "#ffff00",
    ASTEROID: "#ffffff",
    BULLET: "#ffff00",
    GIFT: "#ffff00",
    WARP_BUBBLE: "#00ffff",
    THRUST_FLAME: "#ff6600",

    // UI Colors
    SCORE_TEXT: "#ffffff",
    LIVES_TEXT: "#ffffff",
    GAME_OVER: "#ff0000",
    RESTART_TEXT: "#ffff88",

    // Fuel gauge colors (calculated dynamically)
    FUEL_CRITICAL: "#ff0000", // < 20%
    FUEL_WARNING: "#ffff00", // 20-100% (interpolated to green)
    FUEL_GOOD: "#00ff00", // 100%
    FUEL_GAUGE_BORDER: "#888888",
} as const;

// =============================================================================
// PERFORMANCE
// =============================================================================
export const PERFORMANCE = {
    TARGET_FPS: 60,
    MAX_PARTICLES: 200, // Future particle system limits
    MAX_OBJECTS: 100, // Future object pooling
} as const;
