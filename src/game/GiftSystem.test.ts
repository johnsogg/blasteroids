import { describe, it, expect, beforeEach, vi } from "vitest";
import { GiftSystem } from "./GiftSystem";
import { EntityManager } from "./EntityManager";
import { GameState } from "./GameState";
import { AudioManager } from "~/audio/AudioManager";
import { Vector2 } from "~/utils/Vector2";
import type { GameEntity } from "~/entities";

// Mock dependencies
vi.mock("~/audio/AudioManager", () => ({
    AudioManager: vi.fn().mockImplementation(() => ({
        playWarpBubbleOpening: vi.fn().mockResolvedValue(undefined),
        playWarpBubbleClosing: vi.fn().mockResolvedValue(undefined),
    })),
}));

describe("GiftSystem", () => {
    let giftSystem: GiftSystem;
    let entityManager: EntityManager;
    let gameState: GameState;
    let audioManager: AudioManager;
    let mockCanvas: HTMLCanvasElement;

    beforeEach(() => {
        mockCanvas = { width: 800, height: 600 } as HTMLCanvasElement;
        entityManager = new EntityManager(mockCanvas);
        gameState = new GameState();
        audioManager = new AudioManager();

        giftSystem = new GiftSystem(
            audioManager,
            gameState,
            entityManager,
            mockCanvas
        );

        // Initialize game state
        gameState.init();
    });

    describe("Gift Spawning", () => {
        it("should spawn warp bubble when spawn interval elapsed", () => {
            // Set a short spawn interval for testing
            giftSystem.setSpawnInterval(100);

            // Initial state - no entities
            expect(entityManager.getEntityCount()).toBe(0);

            // Update at time 0 - shouldn't spawn yet
            giftSystem.update(0);
            expect(entityManager.getEntityCount()).toBe(0);

            // Update after spawn interval - should spawn warp bubble
            giftSystem.update(150);
            expect(entityManager.getEntityCount()).toBe(1);

            const entities = entityManager.getAllEntities();
            expect(entities[0].type).toBe("warpBubbleIn");
        });

        it("should not spawn before interval elapsed", () => {
            giftSystem.setSpawnInterval(1000);

            giftSystem.update(0);
            giftSystem.update(500); // Half the interval

            expect(entityManager.getEntityCount()).toBe(0);
        });

        it("should force spawn gift immediately", () => {
            giftSystem.forceSpawnGift("fuel_refill");

            expect(entityManager.getEntityCount()).toBe(1);
            const warpBubble = entityManager.getAllEntities()[0];
            expect(warpBubble.type).toBe("warpBubbleIn");
            expect(warpBubble.giftType).toBe("fuel_refill");
        });
    });

    describe("Gift Type Selection", () => {
        it("should always include basic gifts", () => {
            // Force spawn multiple gifts to test variety
            for (let i = 0; i < 10; i++) {
                giftSystem.forceSpawnGift();
            }

            // Should have created warp bubbles
            const warpBubbles = entityManager.getEntitiesByType("warpBubbleIn");
            expect(warpBubbles.length).toBe(10);

            // Should have gift types assigned
            const giftTypes = warpBubbles.map((bubble) => bubble.giftType);
            expect(giftTypes.every((type) => type !== undefined)).toBe(true);
        });

        it("should respect debug gift type override", () => {
            gameState.setDebugNextGift("extra_life");
            giftSystem.forceSpawnGift();

            const warpBubble =
                entityManager.getEntitiesByType("warpBubbleIn")[0];
            expect(warpBubble.giftType).toBe("extra_life");
        });

        it("should only offer weapon unlocks for locked weapons", () => {
            // Unlock all weapons
            gameState.unlockWeapon("bullets");
            gameState.unlockWeapon("missiles");
            gameState.unlockWeapon("laser");
            gameState.unlockWeapon("lightning");

            const stats = giftSystem.getAvailableGiftStats();
            expect(stats.weaponUnlocks).toBe(0);
            expect(stats.availableUpgrades).toBeGreaterThan(0); // Should have upgrades available
        });

        it("should offer upgrades only for unlocked weapons", () => {
            // Check what weapons are initially unlocked
            const initialStats = giftSystem.getAvailableGiftStats();
            const initialUpgrades = initialStats.availableUpgrades;

            // Unlock a weapon that wasn't unlocked
            gameState.unlockWeapon("missiles");
            const newStats = giftSystem.getAvailableGiftStats();
            expect(newStats.availableUpgrades).toBeGreaterThan(initialUpgrades);
        });
    });

    describe("Warp Bubble Lifecycle", () => {
        it("should convert completed warp bubbles to gifts", () => {
            // Check the actual opening animation time from constants
            const OPENING_TIME = 3.0; // From GIFT.OPENING_ANIMATION_TIME

            // Create a completed warp bubble manually
            const completedWarpBubble: GameEntity = {
                position: new Vector2(100, 100),
                velocity: Vector2.zero(),
                size: new Vector2(80, 80),
                rotation: 0,
                color: "#00ff00",
                type: "warpBubbleIn",
                age: OPENING_TIME + 0.1, // Slightly older than opening time
                warpAnimationProgress: 1.0,
                giftType: "fuel_refill",
            };

            entityManager.addEntity(completedWarpBubble);
            expect(
                entityManager.getEntitiesByType("warpBubbleIn")
            ).toHaveLength(1);
            expect(entityManager.getGifts()).toHaveLength(0);

            // Update should convert warp bubble to gift
            giftSystem.update(0);

            expect(
                entityManager.getEntitiesByType("warpBubbleIn")
            ).toHaveLength(0);
            expect(entityManager.getGifts()).toHaveLength(1);

            const gift = entityManager.getGifts()[0];
            expect(gift.giftType).toBe("fuel_refill");
        });

        it("should create closing warp bubbles for aged gifts", () => {
            // Create an aged gift manually
            const agedGift: GameEntity = {
                position: new Vector2(200, 200),
                velocity: new Vector2(10, 10),
                size: new Vector2(20, 20),
                rotation: 0,
                color: "#ffff00",
                type: "gift",
                age: 6.0, // Older than WARP_BUBBLE_CREATION_DELAY
                giftType: "fuel_refill",
                closingWarpCreated: false,
            };

            entityManager.addEntity(agedGift);
            expect(
                entityManager.getEntitiesByType("warpBubbleOut")
            ).toHaveLength(0);

            // Update should create closing warp bubble
            giftSystem.update(0);

            expect(
                entityManager.getEntitiesByType("warpBubbleOut")
            ).toHaveLength(1);
            expect(agedGift.closingWarpCreated).toBe(true);
        });

        it("should not create multiple closing warp bubbles for same gift", () => {
            const agedGift: GameEntity = {
                position: new Vector2(200, 200),
                velocity: new Vector2(10, 10),
                size: new Vector2(20, 20),
                rotation: 0,
                color: "#ffff00",
                type: "gift",
                age: 6.0,
                giftType: "fuel_refill",
                closingWarpCreated: false,
            };

            entityManager.addEntity(agedGift);

            // Update multiple times
            giftSystem.update(0);
            giftSystem.update(100);
            giftSystem.update(200);

            // Should only have one closing warp bubble
            expect(
                entityManager.getEntitiesByType("warpBubbleOut")
            ).toHaveLength(1);
        });
    });

    describe("Spawn Positioning", () => {
        it("should spawn warp bubbles at screen edges", () => {
            // Spawn multiple gifts and check positions
            for (let i = 0; i < 20; i++) {
                giftSystem.forceSpawnGift();
            }

            const warpBubbles = entityManager.getEntitiesByType("warpBubbleIn");

            for (const bubble of warpBubbles) {
                const pos = bubble.position;

                // Should be at one of the edges (with 50px buffer)
                const atTopEdge = pos.y === -50;
                const atBottomEdge = pos.y === mockCanvas.height + 50;
                const atLeftEdge = pos.x === -50;
                const atRightEdge = pos.x === mockCanvas.width + 50;

                expect(
                    atTopEdge || atBottomEdge || atLeftEdge || atRightEdge
                ).toBe(true);
            }
        });

        it("should position gifts to move toward center", () => {
            // Create completed warp bubble at edge
            const OPENING_TIME = 3.0;
            const edgeWarpBubble: GameEntity = {
                position: new Vector2(-50, 300), // Left edge
                velocity: Vector2.zero(),
                size: new Vector2(80, 80),
                rotation: 0,
                color: "#00ff00",
                type: "warpBubbleIn",
                age: OPENING_TIME + 0.1,
                warpAnimationProgress: 1.0,
                giftType: "fuel_refill",
            };

            entityManager.addEntity(edgeWarpBubble);
            giftSystem.update(0);

            const gifts = entityManager.getGifts();
            expect(gifts).toHaveLength(1);

            const gift = gifts[0];

            // Gift should have velocity pointing toward center area
            expect(gift.velocity.x).toBeGreaterThan(0); // Moving right toward center
            expect(gift.velocity.magnitude()).toBeGreaterThan(0); // Actually moving
        });
    });

    describe("Gift System State", () => {
        it("should reset spawn interval and timing", () => {
            giftSystem.setSpawnInterval(500);
            giftSystem.update(1000); // Advance time

            // Should have spawned something
            expect(entityManager.getEntityCount()).toBeGreaterThan(0);

            giftSystem.reset();

            // Reset should clear timing but not entities
            expect(giftSystem.getSpawnInterval()).toBe(15000); // Default interval
            expect(entityManager.getEntityCount()).toBeGreaterThan(0); // Entities remain
        });

        it("should track available gift statistics", () => {
            const initialStats = giftSystem.getAvailableGiftStats();
            // Check what's actually unlocked initially (bullets might be unlocked by default)
            const initialWeaponUnlocks = initialStats.weaponUnlocks;
            const initialUpgrades = initialStats.availableUpgrades;

            expect(initialStats.totalOptions).toBeGreaterThan(2); // At least basic gifts

            // Unlock another weapon if possible
            if (initialWeaponUnlocks > 0) {
                gameState.unlockWeapon("missiles");
                const newStats = giftSystem.getAvailableGiftStats();
                expect(newStats.weaponUnlocks).toBe(initialWeaponUnlocks - 1);
                expect(newStats.availableUpgrades).toBeGreaterThan(
                    initialUpgrades
                );
            }
        });
    });

    describe("Audio Integration", () => {
        it("should play sounds when spawning warp bubbles", () => {
            const playOpeningSpy = vi.spyOn(
                audioManager,
                "playWarpBubbleOpening"
            );

            giftSystem.forceSpawnGift();

            expect(playOpeningSpy).toHaveBeenCalled();
        });

        it("should play sounds when creating closing warp bubbles", () => {
            const playClosingSpy = vi.spyOn(
                audioManager,
                "playWarpBubbleClosing"
            );

            // Create aged gift that triggers closing warp
            const agedGift: GameEntity = {
                position: new Vector2(200, 200),
                velocity: new Vector2(10, 10),
                size: new Vector2(20, 20),
                rotation: 0,
                color: "#ffff00",
                type: "gift",
                age: 6.0,
                giftType: "fuel_refill",
                closingWarpCreated: false,
            };

            entityManager.addEntity(agedGift);
            giftSystem.update(0);

            expect(playClosingSpy).toHaveBeenCalled();
        });
    });
});
