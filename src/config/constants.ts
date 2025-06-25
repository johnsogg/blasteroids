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
    FRICTION: 1.0, // velocity damping multiplier (1.0 = no friction, authentic space physics)

    // Dimensions
    WIDTH: 20,
    HEIGHT: 10,
    SCALE: 1.5, // scale factor for size adjustments

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
    LIFE_SUPPORT_CONSUMPTION: 0.1, // units per second for basic life support

    // Gauge visual settings
    GAUGE_WIDTH: 200,
    GAUGE_HEIGHT: 20,
    GAUGE_X_OFFSET: 0, // centered
    GAUGE_Y: 20,
    GAUGE_CORNER_RADIUS: 4,
    GAUGE_OPACITY: 0.4,
} as const;

// =============================================================================
// SHIELD SYSTEM
// =============================================================================
export const SHIELD = {
    // Timing
    RECHARGE_DURATION: 10000, // milliseconds (10 seconds)

    // Movement effects
    MOVEMENT_SLOWDOWN_FACTOR: 0.99, // Per-frame multiplier when shield active (0.99^60 ≈ 0.55 after 1 second)

    // Fuel consumption on collision (per asteroid size)
    FUEL_CONSUMPTION: {
        large: 20,
        medium: 10,
        small: 5,
        default: 10,
    },

    // Physics
    BOUNCE_IMPULSE_STRENGTH: 200, // impulse applied during bouncing
    ASTEROID_BOUNCE_MULTIPLIER: 0.5, // asteroids receive less impulse than ship

    // Visual
    COLOR: "#00bfff", // bright light blue
    ALPHA: 0.4, // transparency for shield circle
    RADIUS_OFFSET: 20, // pixels added to ship radius (dramatically larger for visibility)
    STROKE_WIDTH_CHARGED: 5, // thick stroke when fully charged
    STROKE_WIDTH_RECHARGING: 3, // thin stroke when recharging
} as const;

// =============================================================================
// AI SYSTEM
// =============================================================================
export const AI = {
    // Whether AI player is enabled at start
    ENABLED: false,
} as const;

// =============================================================================
// WEAPONS & PROJECTILES
// =============================================================================
export const BULLET = {
    SCALE: 1.3, // scale factor for size adjustments
    SPEED: 500, // pixels per second
    SIZE: 3,
    MAX_AGE: 1.5, // seconds (reduced by 50% for shorter range)
    FIRE_RATE: 187, // milliseconds between shots (25% slower: 150 / 0.75 = 200, but using 187 for precise 25% reduction)
    COLOR: "#ffff00",
    OUT_OF_BOUNDS_MARGIN: 50, // pixels beyond screen edge
    FUEL_COST: 0.5, // fuel consumed per shot
    BULLETS_PER_ACTIVATION: 3, // maximum bullets per key press
} as const;

// =============================================================================
// ASTEROIDS
// =============================================================================
export const ASTEROID = {
    // Scaling
    SCALE: 3.0, // scale factor for size adjustments

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

    // Repulsor beam effect for fragments
    REPULSOR_STRENGTH: 0.4, // 40% bias away from ship, 30% random
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

    // Gift destruction penalty
    GIFT_DESTRUCTION_PENALTY: 80,

    // Extra life score thresholds (classic arcade style)
    EXTRA_LIFE_THRESHOLDS: [10000, 25000, 50000, 100000], // Score points at which player earns extra lives
} as const;

// =============================================================================
// GAME STATE
// =============================================================================
export const GAME_STATE = {
    MAX_EXTRA_LIVES: 5, // Maximum number of extra lives a player can have
} as const;

// =============================================================================
// LEVEL TIMER
// =============================================================================
export const LEVEL_TIMER = {
    INITIAL_TIME: 60, // seconds per level
    BONUS_POINTS_PER_SECOND: 10, // points awarded per second remaining
} as const;

// =============================================================================
// ZONES AND LEVELS
// =============================================================================
export const ZONES = {
    // Zone progression
    LEVELS_PER_CHOICE: 5, // Show choice screen every N levels
    MAX_ZONES: 10, // Total number of zones planned

    // Zone definitions
    ZONE_CONFIGS: {
        1: {
            name: "Asteroid Field",
            description: "The classic asteroid field where it all began",
            color: "#ffffff",
            baseAsteroidCount: 3,
            asteroidsPerLevel: 1,
            maxAsteroids: 12,
            currencyMultiplier: 1.0,
            hasNebula: false,
        },
        2: {
            name: "Dense Nebula",
            description: "Thicker asteroid clusters in cosmic dust",
            color: "#aa88ff",
            baseAsteroidCount: 4,
            asteroidsPerLevel: 1,
            maxAsteroids: 15,
            currencyMultiplier: 1.2,
            hasNebula: true,
        },
        3: {
            name: "Gravity Wells",
            description: "Asteroids affected by gravitational anomalies",
            color: "#ffaa44",
            baseAsteroidCount: 3,
            asteroidsPerLevel: 2,
            maxAsteroids: 18,
            currencyMultiplier: 1.5,
            hasNebula: false,
        },
        // Additional zones will be added in future updates
    },
} as const;

// Legacy level constants (for backward compatibility)
export const LEVEL = {
    BASE_ASTEROID_COUNT: 3,
    ASTEROIDS_PER_LEVEL: 1, // 3 + level number
    MAX_ASTEROIDS: 12, // Practical limit for playability
} as const;

// =============================================================================
// CURRENCY SYSTEM
// =============================================================================
export const CURRENCY = {
    // Currency earning rates
    BASE_LEVEL_REWARD: 10, // Base currency per level completion
    TIME_BONUS_MULTIPLIER: 0.5, // Extra currency per second remaining
    PERFECT_CLEAR_BONUS: 25, // Bonus for taking no damage

    // Starting currency
    STARTING_AMOUNT: 0,

    // Display
    NAME: "Spacebucks", // Currency name for UI
    SYMBOL: "🪙", // Currency symbol
} as const;

// =============================================================================
// SHOP SYSTEM
// =============================================================================
export const SHOP = {
    // Weapon prices
    WEAPON_PRICES: {
        MISSILES: 50,
        LASER: 75,
        LIGHTNING: 100,
    },

    // Upgrade prices
    UPGRADE_PRICES: {
        // Bullet upgrades
        BULLETS_FIRE_RATE: 30,
        BULLETS_SIZE: 25,

        // Missile upgrades
        MISSILES_SPEED: 40,
        MISSILES_FIRE_RATE: 45,
        MISSILES_HOMING: 60,

        // Laser upgrades
        LASER_RANGE: 50,
        LASER_EFFICIENCY: 55,

        // Lightning upgrades
        LIGHTNING_RADIUS: 65,
        LIGHTNING_CHAIN: 70,
    },

    // Other item prices
    OTHER_PRICES: {
        EXTRA_LIFE: 80,
    },

    // UI configuration
    UI: {
        PANEL_WIDTH: 700,
        PANEL_HEIGHT: 500,
        ITEM_HEIGHT: 50,
        CATEGORY_SPACING: 30,
        ITEM_SPACING: 15, // Increased from 5 to 15 for better legibility
        HEADER_HEIGHT: 120,
        FOOTER_HEIGHT: 80,
        SCROLL_AMOUNT: 100, // Pixels to scroll per page
    },
} as const;

// =============================================================================
// GIFT SYSTEM
// =============================================================================
export const GIFT = {
    SCALE: 3.0, // scale factor for size adjustments
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

    // Warp bubble timing (moved size/color to WARP_BUBBLE section)
    OPENING_ANIMATION_TIME: 3.0, // seconds
    CLOSING_ANIMATION_TIME: 1.0, // seconds
    DISAPPEAR_ANIMATION_TIME: 0.5, // seconds
    TRAJECTORY_PREDICTION_TIME: 3.0, // seconds ahead

    // Gift types and their spawn probabilities
    TYPES: {
        FUEL_REFILL: "fuel_refill" as const,
        EXTRA_LIFE: "extra_life" as const,
        WEAPON_BULLETS: "weapon_bullets" as const,
        WEAPON_MISSILES: "weapon_missiles" as const,
        WEAPON_LASER: "weapon_laser" as const,
        WEAPON_LIGHTNING: "weapon_lightning" as const,
        UPGRADE_BULLETS_FIRE_RATE: "upgrade_bullets_fire_rate" as const,
        UPGRADE_BULLETS_SIZE: "upgrade_bullets_size" as const,
        UPGRADE_MISSILES_SPEED: "upgrade_missiles_speed" as const,
        UPGRADE_MISSILES_FIRE_RATE: "upgrade_missiles_fire_rate" as const,
        UPGRADE_MISSILES_HOMING: "upgrade_missiles_homing" as const,
        UPGRADE_LASER_RANGE: "upgrade_laser_range" as const,
        UPGRADE_LASER_EFFICIENCY: "upgrade_laser_efficiency" as const,
        UPGRADE_LIGHTNING_RADIUS: "upgrade_lightning_radius" as const,
        UPGRADE_LIGHTNING_CHAIN: "upgrade_lightning_chain" as const,
        AI_COMPANION: "ai_companion" as const,
    },

    // Spawn probabilities (higher number = more likely)
    SPAWN_WEIGHTS: {
        FUEL_REFILL: 5, // Reduced significantly
        EXTRA_LIFE: 8,
        WEAPON_BULLETS: 0, // Start with bullets unlocked, no need to spawn
        WEAPON_MISSILES: 25, // Much higher chance for new weapons
        WEAPON_LASER: 20,
        WEAPON_LIGHTNING: 15,
        UPGRADE_BULLETS_FIRE_RATE: 18,
        UPGRADE_BULLETS_SIZE: 18,
        UPGRADE_MISSILES_SPEED: 12,
        UPGRADE_MISSILES_FIRE_RATE: 12,
        UPGRADE_MISSILES_HOMING: 10,
        UPGRADE_LASER_RANGE: 12,
        UPGRADE_LASER_EFFICIENCY: 12,
        UPGRADE_LIGHTNING_RADIUS: 10,
        UPGRADE_LIGHTNING_CHAIN: 8,
        AI_COMPANION: 12, // Medium-high spawn rate for significant upgrade
    },

    // Warp bubble colors for different gift types
    WARP_COLORS: {
        FUEL_REFILL: "#00ff00", // Green
        EXTRA_LIFE: "#ff00ff", // Magenta
        WEAPON_BULLETS: "#ffff00", // Yellow
        WEAPON_MISSILES: "#ff8800", // Orange
        WEAPON_LASER: "#ff0088", // Pink
        WEAPON_LIGHTNING: "#00ffff", // Cyan
        UPGRADE_BULLETS_FIRE_RATE: "#ffff88", // Light yellow
        UPGRADE_BULLETS_SIZE: "#ffff88", // Light yellow
        UPGRADE_MISSILES_SPEED: "#ffaa44", // Light orange
        UPGRADE_MISSILES_FIRE_RATE: "#ffaa44", // Light orange
        UPGRADE_MISSILES_HOMING: "#ffaa44", // Light orange
        UPGRADE_LASER_RANGE: "#ff44aa", // Light pink
        UPGRADE_LASER_EFFICIENCY: "#ff44aa", // Light pink
        UPGRADE_LIGHTNING_RADIUS: "#44ffff", // Light cyan
        UPGRADE_LIGHTNING_CHAIN: "#44ffff", // Light cyan
        AI_COMPANION: "#8800ff", // Purple - distinctive color for AI companion
    },
} as const;

// Gift type union for TypeScript
export type GiftType = (typeof GIFT.TYPES)[keyof typeof GIFT.TYPES];

// =============================================================================
// WARP BUBBLES
// =============================================================================
export const WARP_BUBBLE = {
    SCALE: 3.0, // scale factor for size adjustments
    RADIUS: 40, // base radius in pixels
    COLOR: "#00ffff",
    OPENING_ANIMATION_TIME: 3.0, // seconds
    CLOSING_ANIMATION_TIME: 1.0, // seconds
    SPARKLE_COUNT: 8,
    COLLAPSE_LINES: 6,
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

    // Warp bubble effects (moved to WARP_BUBBLE section)

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
    SHIP_INVULNERABLE: "hsl(60, 83%, 9%)",
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
// WEAPONS SYSTEM
// =============================================================================
export const WEAPONS = {
    // Weapon types
    TYPES: {
        BULLETS: "bullets" as const,
        MISSILES: "missiles" as const,
        LASER: "laser" as const,
        LIGHTNING: "lightning" as const,
    },

    // Default weapon (bullets) - enhanced from original
    BULLETS: {
        FUEL_CONSUMPTION: 0.5, // units per shot (very small amount)
        FIRE_RATE_UPGRADE: 0.75, // 25% faster (multiply fire rate by this)
        SIZE_UPGRADE: 1.5, // 50% larger bullets
        RANGE_UPGRADE: 1.4, // 40% longer range per upgrade (stacks)
        COLOR: "#ffff00",
        UPGRADED_COLOR: "#ffff88",
    },

    // Missiles
    MISSILES: {
        SCALE: 1.0, // scale factor for size adjustments
        FIRE_RATE: 2000, // milliseconds between shots
        FUEL_CONSUMPTION: 5, // units per shot
        INITIAL_SPEED: 300, // pixels per second (initial launch speed)
        ACCELERATION: 150, // pixels per second squared
        MAX_SPEED: 900, // maximum speed after acceleration
        SIZE: 4, // pixels radius
        EXPLOSION_RADIUS: 90, // pixels (large enough to encompass largest asteroid + fragment spawn radius)
        EXPLOSION_DURATION_FRAMES: 45, // frames that explosion zone persists (long enough to catch all fragments)
        MAX_AGE: 3, // seconds before auto-explosion
        SPEED_UPGRADE: 1.5, // 50% faster travel (affects max speed)
        FIRE_RATE_UPGRADE: 0.5, // 50% faster rate of fire
        HOMING_RANGE: 100, // pixels for homing upgrade
        COLOR: "#ff8800",
    },

    // Laser
    LASER: {
        LENGTH: 80, // pixels
        FUEL_CONSUMPTION_RATE: 7, // units per second while firing (reduced by 30%)
        LENGTH_UPGRADE: 1.5, // 50% longer range
        EFFICIENCY_UPGRADE: 0.5, // 50% more efficient fuel usage
        COLOR: "#ff0088",
        WIDTH: 3,
    },

    // Lightning
    LIGHTNING: {
        RADIUS: 60, // pixels
        FUEL_CONSUMPTION: 8, // units per shot
        FIRE_RATE: 1500, // milliseconds between shots
        RADIUS_UPGRADE: 1.2, // 20% larger radius
        ARC_COLOR: "#00ffff",
        ARC_WIDTH: 2,
    },

    // HUD Configuration
    HUD: {
        ICON_SIZE: 20, // Size of weapon icons
        ICON_SPACING: 35, // Vertical spacing between icons
        X_OFFSET: 20, // Distance from left edge
        Y_START: 80, // Starting Y position (below lives display)
        SELECTED_COLOR: "#ffffff",
        ACQUIRED_COLOR: "#888888",
        UNAVAILABLE_COLOR: "#444444",
    },
} as const;

// Weapon type union for TypeScript
export type WeaponType = (typeof WEAPONS.TYPES)[keyof typeof WEAPONS.TYPES];

// =============================================================================
// ANIMATIONS
// =============================================================================
export const ANIMATIONS = {
    // Level complete animation (manual dismissal only)
    LEVEL_COMPLETE_PHASES: {
        PAUSE: 500, // Initial pause after last asteroid destroyed
        TITLE: 1500, // "LEVEL COMPLETE" title display
        STATS: 1500, // Statistics display (then persists until space key)
    },

    // Level bonus calculation
    LEVEL_BONUS_MULTIPLIER: 100, // Points per level (100 * level)

    // Visual effects
    TYPEWRITER_SPEED_RATIO: 0.6, // 60% of phase for typing effect
    PULSE_FREQUENCY: 200, // ms per pulse cycle
    BORDER_APPEAR_DELAY: 0.5, // Relative progress when border appears
} as const;

// =============================================================================
// ANIMATED MESSAGES
// =============================================================================
export const MESSAGE = {
    // Animation timing
    DEFAULT_DURATION: 2000, // milliseconds

    // Visual effects
    SCALE_START: 1.0,
    SCALE_END: 1.5, // Grow by 50%
    OPACITY_START: 1.0,
    OPACITY_END: 0.0,

    // Rainbow animation
    HUE_CYCLE_SPEED: 2.0, // Full rainbow cycle in 2 seconds
    SATURATION: 80, // Rich colors
    LIGHTNESS: 60, // Bright but readable

    // Positioning
    SHIP_DIAMETER_OFFSET_START: 2, // Start 2 ship diameters toward center
    SHIP_DIAMETER_OFFSET_END: 3, // End 3 ship diameters further

    // Font styling
    FONT_SIZE: 24,
    FONT_FAMILY: 'Orbitron, "Courier New", monospace',
    FONT_WEIGHT: "700",
    STROKE_WIDTH: 2,

    // Colors
    STROKE_COLOR: "#000000", // Black outline for readability
} as const;

// =============================================================================
// DEBUG SYSTEM
// =============================================================================
export const DEBUG = {
    // Visual debugging colors
    COLLISION_CIRCLE_COLOR: "#ff00ff", // Magenta
    WEAPON_RANGE_COLOR: "#00ffff", // Cyan

    // Line thickness for debug visuals
    LINE_WIDTH: 1, // Thin lines as specified

    // Transparency for debug visuals
    ALPHA: 0.8, // Slightly transparent to not obstruct gameplay
} as const;

// =============================================================================
// NEBULA SYSTEM
// =============================================================================
export const NEBULA = {
    // Particle configuration
    PARTICLE_COUNT: 200, // Number of nebula particles
    PARTICLE_MIN_SIZE: 40, // Minimum particle radius
    PARTICLE_MAX_SIZE: 140, // Maximum particle radius
    PARTICLE_MIN_OPACITY: 0.2, // Minimum particle opacity
    PARTICLE_MAX_OPACITY: 0.4, // Maximum particle opacity

    // Animation
    DRIFT_SPEED_MIN: 10, // Minimum drift speed (pixels per second)
    DRIFT_SPEED_MAX: 30, // Maximum drift speed (pixels per second)
    OPACITY_PULSE_SPEED: 0.002, // Speed of opacity pulsing animation

    // Zone colors
    ZONE_COLORS: {
        2: "#aa88ff", // Dense Nebula (purple)
        // Future zones can have different nebula colors
    },

    // Shape variety
    SHAPE_TYPES: ["circle", "oval"] as const,
    OVAL_ASPECT_RATIO_MIN: 1.2, // Minimum width/height ratio for ovals
    OVAL_ASPECT_RATIO_MAX: 2.0, // Maximum width/height ratio for ovals
} as const;

// Nebula shape type union for TypeScript
export type NebulaShapeType = (typeof NEBULA.SHAPE_TYPES)[number];

// =============================================================================
// PERFORMANCE
// =============================================================================
export const PERFORMANCE = {
    TARGET_FPS: 60,
    MAX_PARTICLES: 200, // Future particle system limits
    MAX_OBJECTS: 100, // Future object pooling
} as const;
