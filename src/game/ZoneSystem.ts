import { ZONES } from "~/config/constants";
import type { GameState } from "./GameState";

export interface ZoneConfig {
    name: string;
    description: string;
    color: string;
    baseAsteroidCount: number;
    asteroidsPerLevel: number;
    maxAsteroids: number;
    currencyMultiplier: number;
    hasNebula?: boolean;
}

export interface ZoneInfo {
    zone: number;
    level: number;
    config: ZoneConfig;
    isUnlocked: boolean;
}

/**
 * Zone System - Foundation for future zone-specific mechanics
 * This system manages zone configurations and provides hooks for future features
 */
export class ZoneSystem {
    private gameState: GameState;

    constructor(gameState: GameState) {
        this.gameState = gameState;
    }

    /**
     * Get configuration for a specific zone
     */
    getZoneConfig(zone: number): ZoneConfig | null {
        const config =
            ZONES.ZONE_CONFIGS[zone as keyof typeof ZONES.ZONE_CONFIGS];
        return config || null;
    }

    /**
     * Get current zone information
     */
    getCurrentZoneInfo(): ZoneInfo {
        const zone = this.gameState.zone;
        const level = this.gameState.level;
        const config = this.getZoneConfig(zone);

        return {
            zone,
            level,
            config: config || this.getDefaultZoneConfig(),
            isUnlocked: true, // Current zone is always unlocked
        };
    }

    /**
     * Check if a zone is unlocked
     */
    isZoneUnlocked(zone: number): boolean {
        // For now, zones are unlocked sequentially
        return zone <= this.gameState.zone;
    }

    /**
     * Get all available zones
     */
    getAvailableZones(): ZoneInfo[] {
        const zones: ZoneInfo[] = [];

        for (let zone = 1; zone <= ZONES.MAX_ZONES; zone++) {
            const config = this.getZoneConfig(zone);
            if (config) {
                zones.push({
                    zone,
                    level:
                        zone === this.gameState.zone ? this.gameState.level : 1,
                    config,
                    isUnlocked: this.isZoneUnlocked(zone),
                });
            }
        }

        return zones;
    }

    /**
     * Get next zone information (for choice screen)
     */
    getNextZoneInfo(): ZoneInfo | null {
        const nextZone = this.gameState.zone + 1;
        const config = this.getZoneConfig(nextZone);

        if (!config) return null;

        return {
            zone: nextZone,
            level: 1,
            config,
            isUnlocked: false, // Next zone is not yet unlocked
        };
    }

    /**
     * Calculate asteroid count for current zone and level
     */
    calculateAsteroidCount(): number {
        const config = this.getCurrentZoneInfo().config;
        const level = this.gameState.level;

        const baseCount = config.baseAsteroidCount;
        const perLevel = config.asteroidsPerLevel;
        const maxAsteroids = config.maxAsteroids;

        return Math.min(maxAsteroids, baseCount + (level - 1) * perLevel);
    }

    /**
     * Apply zone-specific effects (placeholder for future mechanics)
     */
    applyZoneEffects(): void {
        // TODO: Implement zone-specific mechanics
        // Examples:
        // - Gravity effects in gravity well zones
        // - Different asteroid behaviors
        // - Environmental hazards
        // - Special power-ups

        const currentZone = this.gameState.zone;

        switch (currentZone) {
            case 1:
                // Asteroid Field - no special effects (classic gameplay)
                break;
            case 2:
                // Dense Nebula - could have visibility effects
                break;
            case 3:
                // Gravity Wells - could have gravitational pull effects
                break;
            default:
                // Future zones
                break;
        }
    }

    /**
     * Get zone-specific color theme
     */
    getZoneColorTheme(): string {
        const config = this.getCurrentZoneInfo().config;
        return config.color;
    }

    /**
     * Check if current zone has nebula effects
     */
    hasNebulaEffects(): boolean {
        const config = this.getCurrentZoneInfo().config;
        return config.hasNebula || false;
    }

    /**
     * Check if a specific zone has nebula effects
     */
    zoneHasNebula(zone: number): boolean {
        const config = this.getZoneConfig(zone);
        return config?.hasNebula || false;
    }

    private getDefaultZoneConfig(): ZoneConfig {
        return {
            name: "Unknown Zone",
            description: "Uncharted space",
            color: "#ffffff",
            baseAsteroidCount: 3,
            asteroidsPerLevel: 1,
            maxAsteroids: 12,
            currencyMultiplier: 1.0,
        };
    }
}
