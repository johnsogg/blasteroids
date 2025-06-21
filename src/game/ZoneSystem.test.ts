import { describe, it, expect, beforeEach } from "vitest";
import { ZoneSystem } from "./ZoneSystem";
import { GameState } from "./GameState";

describe("ZoneSystem", () => {
    let gameState: GameState;
    let zoneSystem: ZoneSystem;

    beforeEach(() => {
        gameState = new GameState();
        zoneSystem = new ZoneSystem(gameState);
    });

    describe("getZoneConfig", () => {
        it("should return zone 1 config", () => {
            const config = zoneSystem.getZoneConfig(1);
            expect(config).toBeDefined();
            expect(config?.name).toBe("Asteroid Field");
            expect(config?.baseAsteroidCount).toBe(3);
        });

        it("should return zone 2 config", () => {
            const config = zoneSystem.getZoneConfig(2);
            expect(config).toBeDefined();
            expect(config?.name).toBe("Dense Nebula");
            expect(config?.baseAsteroidCount).toBe(4);
        });

        it("should return null for non-existent zone", () => {
            const config = zoneSystem.getZoneConfig(999);
            expect(config).toBeNull();
        });
    });

    describe("getCurrentZoneInfo", () => {
        it("should return current zone info for zone 1", () => {
            const info = zoneSystem.getCurrentZoneInfo();
            expect(info.zone).toBe(1);
            expect(info.level).toBe(1);
            expect(info.config.name).toBe("Asteroid Field");
            expect(info.isUnlocked).toBe(true);
        });

        it("should return correct info after advancing levels", () => {
            gameState.nextLevel(); // Level 2
            gameState.nextLevel(); // Level 3

            const info = zoneSystem.getCurrentZoneInfo();
            expect(info.zone).toBe(1);
            expect(info.level).toBe(3);
        });
    });

    describe("calculateAsteroidCount", () => {
        it("should calculate correct asteroid count for zone 1, level 1", () => {
            const count = zoneSystem.calculateAsteroidCount();
            expect(count).toBe(3); // baseCount = 3, level = 1, so 3 + (1-1)*1 = 3
        });

        it("should calculate correct asteroid count for zone 1, level 3", () => {
            gameState.nextLevel(); // Level 2
            gameState.nextLevel(); // Level 3

            const count = zoneSystem.calculateAsteroidCount();
            expect(count).toBe(5); // baseCount = 3, level = 3, so 3 + (3-1)*1 = 5
        });

        it("should respect max asteroids limit", () => {
            // Advance to a very high level
            for (let i = 0; i < 20; i++) {
                gameState.nextLevel();
            }

            const count = zoneSystem.calculateAsteroidCount();
            const config = zoneSystem.getCurrentZoneInfo().config;
            expect(count).toBeLessThanOrEqual(config.maxAsteroids);
        });

        it("should calculate different asteroid count for zone 2", () => {
            gameState.advanceToNextZone(); // Zone 2, Level 1

            const count = zoneSystem.calculateAsteroidCount();
            expect(count).toBe(4); // Zone 2 has baseCount = 4
        });
    });

    describe("isZoneUnlocked", () => {
        it("should have zone 1 unlocked by default", () => {
            expect(zoneSystem.isZoneUnlocked(1)).toBe(true);
        });

        it("should not have zone 2 unlocked initially", () => {
            expect(zoneSystem.isZoneUnlocked(2)).toBe(false);
        });

        it("should unlock zone 2 after advancing", () => {
            gameState.advanceToNextZone();
            expect(zoneSystem.isZoneUnlocked(2)).toBe(true);
        });
    });

    describe("getNextZoneInfo", () => {
        it("should return zone 2 info when in zone 1", () => {
            const nextZone = zoneSystem.getNextZoneInfo();
            expect(nextZone).toBeDefined();
            expect(nextZone?.zone).toBe(2);
            expect(nextZone?.level).toBe(1);
            expect(nextZone?.config.name).toBe("Dense Nebula");
            expect(nextZone?.isUnlocked).toBe(false);
        });

        it("should return zone 3 info when in zone 2", () => {
            gameState.advanceToNextZone(); // Move to zone 2

            const nextZone = zoneSystem.getNextZoneInfo();
            expect(nextZone).toBeDefined();
            expect(nextZone?.zone).toBe(3);
            expect(nextZone?.config.name).toBe("Gravity Wells");
        });

        it("should return null when at last available zone", () => {
            // Advance to zone 3 (last configured zone)
            gameState.advanceToNextZone(); // Zone 2
            gameState.advanceToNextZone(); // Zone 3

            const nextZone = zoneSystem.getNextZoneInfo();
            expect(nextZone).toBeNull();
        });
    });

    describe("getAvailableZones", () => {
        it("should return all configured zones", () => {
            const zones = zoneSystem.getAvailableZones();
            expect(zones).toHaveLength(3); // We have 3 configured zones
            expect(zones[0].config.name).toBe("Asteroid Field");
            expect(zones[1].config.name).toBe("Dense Nebula");
            expect(zones[2].config.name).toBe("Gravity Wells");
        });

        it("should mark only current and previous zones as unlocked", () => {
            gameState.advanceToNextZone(); // Move to zone 2

            const zones = zoneSystem.getAvailableZones();
            expect(zones[0].isUnlocked).toBe(true); // Zone 1
            expect(zones[1].isUnlocked).toBe(true); // Zone 2 (current)
            expect(zones[2].isUnlocked).toBe(false); // Zone 3
        });
    });

    describe("getZoneColorTheme", () => {
        it("should return zone 1 color theme", () => {
            const color = zoneSystem.getZoneColorTheme();
            expect(color).toBe("#ffffff");
        });

        it("should return zone 2 color theme after advancing", () => {
            gameState.advanceToNextZone();
            const color = zoneSystem.getZoneColorTheme();
            expect(color).toBe("#aa88ff");
        });
    });

    describe("applyZoneEffects", () => {
        it("should execute without errors for all zones", () => {
            // Test zone 1
            expect(() => zoneSystem.applyZoneEffects()).not.toThrow();

            // Test zone 2
            gameState.advanceToNextZone();
            expect(() => zoneSystem.applyZoneEffects()).not.toThrow();

            // Test zone 3
            gameState.advanceToNextZone();
            expect(() => zoneSystem.applyZoneEffects()).not.toThrow();
        });
    });
});
