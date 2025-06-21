import { describe, it, expect, beforeEach, vi } from "vitest";
import { CollisionSystem } from "./CollisionSystem";
import { EntityManager } from "./EntityManager";
import { WeaponSystem } from "./WeaponSystem";
import { GameState } from "./GameState";
import { AudioManager } from "~/audio/AudioManager";
import { ParticleSystem } from "~/render/ParticleSystem";
import { Vector2 } from "~/utils/Vector2";
import type { Ship, GameEntity } from "~/entities";

// Mock dependencies
vi.mock("~/audio/AudioManager", () => ({
    AudioManager: vi.fn().mockImplementation(() => ({
        playAsteroidHit: vi.fn().mockResolvedValue(undefined),
        playAsteroidDestroy: vi.fn().mockResolvedValue(undefined),
        playGiftCollected: vi.fn().mockResolvedValue(undefined),
        playGiftDestroyed: vi.fn().mockResolvedValue(undefined),
        playShipHit: vi.fn().mockResolvedValue(undefined),
    })),
}));

vi.mock("~/render/ParticleSystem", () => ({
    ParticleSystem: vi.fn().mockImplementation(() => ({
        createAsteroidExplosion: vi.fn(),
        createMissileExplosion: vi.fn(),
        createGiftExplosion: vi.fn(),
        createShipExplosion: vi.fn(),
    })),
}));

describe("CollisionSystem", () => {
    let collisionSystem: CollisionSystem;
    let entityManager: EntityManager;
    let weaponSystem: WeaponSystem;
    let gameState: GameState;
    let audioManager: AudioManager;
    let particleSystem: ParticleSystem;
    let mockCanvas: HTMLCanvasElement;

    beforeEach(() => {
        mockCanvas = { width: 800, height: 600 } as HTMLCanvasElement;
        entityManager = new EntityManager(mockCanvas);
        gameState = new GameState();
        audioManager = new AudioManager();
        particleSystem = new ParticleSystem();
        weaponSystem = new WeaponSystem(
            audioManager,
            particleSystem,
            gameState,
            entityManager
        );

        collisionSystem = new CollisionSystem(
            audioManager,
            particleSystem,
            gameState,
            entityManager,
            weaponSystem
        );

        // Initialize game state
        gameState.init();
    });

    describe("Bullet-Asteroid Collisions", () => {
        it("should destroy bullet and asteroid on collision", () => {
            const bullet: GameEntity = {
                position: new Vector2(100, 100),
                velocity: Vector2.zero(),
                size: new Vector2(2, 2),
                rotation: 0,
                color: "#ffff00",
                type: "bullet",
                age: 0,
            };

            const asteroid: GameEntity = {
                position: new Vector2(102, 102), // Close enough to collide
                velocity: Vector2.zero(),
                size: new Vector2(20, 20),
                rotation: 0,
                color: "#ffffff",
                type: "asteroid",
                age: 0,
            };

            entityManager.addEntity(bullet);
            entityManager.addEntity(asteroid);

            collisionSystem.checkAllCollisions();

            // Bullet should be marked for removal
            expect(bullet.age).toBe(999);

            // Asteroid should be removed from entity manager
            expect(entityManager.getAsteroids()).toHaveLength(0);
        });

        it("should create fragments when large asteroid is destroyed", () => {
            const bullet: GameEntity = {
                position: new Vector2(100, 100),
                velocity: Vector2.zero(),
                size: new Vector2(2, 2),
                rotation: 0,
                color: "#ffff00",
                type: "bullet",
                age: 0,
            };

            const largeAsteroid: GameEntity = {
                position: new Vector2(102, 102),
                velocity: Vector2.zero(),
                size: new Vector2(40, 40), // Large enough to fragment
                rotation: 0,
                color: "#ffffff",
                type: "asteroid",
                age: 0,
            };

            entityManager.addEntity(bullet);
            entityManager.addEntity(largeAsteroid);

            collisionSystem.checkAllCollisions();

            // Should have created fragments
            const fragments = entityManager.getAsteroids();
            expect(fragments.length).toBeGreaterThan(0);
            expect(fragments.length).toBeLessThanOrEqual(3); // 2-3 fragments
        });

        it("should not create fragments when small asteroid is destroyed", () => {
            const bullet: GameEntity = {
                position: new Vector2(100, 100),
                velocity: Vector2.zero(),
                size: new Vector2(2, 2),
                rotation: 0,
                color: "#ffff00",
                type: "bullet",
                age: 0,
            };

            const smallAsteroid: GameEntity = {
                position: new Vector2(102, 102),
                velocity: Vector2.zero(),
                size: new Vector2(15, 15), // Too small to fragment
                rotation: 0,
                color: "#ffffff",
                type: "asteroid",
                age: 0,
            };

            entityManager.addEntity(bullet);
            entityManager.addEntity(smallAsteroid);

            collisionSystem.checkAllCollisions();

            // Should not have created fragments
            expect(entityManager.getAsteroids()).toHaveLength(0);
        });
    });

    describe("Ship-Asteroid Collisions", () => {
        it("should destroy ship when it collides with asteroid", () => {
            const ship: Ship = {
                position: new Vector2(100, 100),
                velocity: Vector2.zero(),
                size: new Vector2(20, 20),
                rotation: 0,
                color: "#ffffff",
                type: "ship",
                playerId: "player",
                trail: [],
                invulnerable: false,
            };

            const asteroid: GameEntity = {
                position: new Vector2(105, 105), // Close enough to collide
                velocity: Vector2.zero(),
                size: new Vector2(20, 20),
                rotation: 0,
                color: "#ffffff",
                type: "asteroid",
                age: 0,
            };

            entityManager.addEntity(ship);
            entityManager.addEntity(asteroid);

            const initialLives = gameState.lives;
            collisionSystem.checkAllCollisions();

            // Ship should lose a life
            expect(gameState.lives).toBe(initialLives - 1);
        });

        it("should not destroy invulnerable ship", () => {
            const ship: Ship = {
                position: new Vector2(100, 100),
                velocity: Vector2.zero(),
                size: new Vector2(20, 20),
                rotation: 0,
                color: "#ffffff",
                type: "ship",
                playerId: "player",
                trail: [],
                invulnerable: true, // Ship is invulnerable
                invulnerableTime: 2.0,
            };

            const asteroid: GameEntity = {
                position: new Vector2(105, 105),
                velocity: Vector2.zero(),
                size: new Vector2(20, 20),
                rotation: 0,
                color: "#ffffff",
                type: "asteroid",
                age: 0,
            };

            entityManager.addEntity(ship);
            entityManager.addEntity(asteroid);

            const initialLives = gameState.lives;
            collisionSystem.checkAllCollisions();

            // Ship should not lose a life
            expect(gameState.lives).toBe(initialLives);
        });
    });

    describe("Gift Interactions", () => {
        it("should collect gift when ship touches it", () => {
            const ship: Ship = {
                position: new Vector2(100, 100),
                velocity: Vector2.zero(),
                size: new Vector2(20, 20),
                rotation: 0,
                color: "#ffffff",
                type: "ship",
                playerId: "player",
                trail: [],
            };

            const gift: GameEntity = {
                position: new Vector2(105, 105), // Close enough to collide
                velocity: Vector2.zero(),
                size: new Vector2(15, 15),
                rotation: 0,
                color: "#ffff00",
                type: "gift",
                giftType: "fuel_refill",
                age: 0,
            };

            entityManager.addEntity(ship);
            entityManager.addEntity(gift);

            const initialScore = gameState.score;
            collisionSystem.checkAllCollisions();

            // Gift should be collected
            expect(entityManager.getGifts()).toHaveLength(0);
            expect(gameState.score).toBeGreaterThan(initialScore);
        });

        it("should destroy gift when bullet hits it", () => {
            const bullet: GameEntity = {
                position: new Vector2(100, 100),
                velocity: Vector2.zero(),
                size: new Vector2(2, 2),
                rotation: 0,
                color: "#ffff00",
                type: "bullet",
                age: 0,
            };

            const gift: GameEntity = {
                position: new Vector2(102, 102),
                velocity: Vector2.zero(),
                size: new Vector2(15, 15),
                rotation: 0,
                color: "#ffff00",
                type: "gift",
                giftType: "fuel_refill",
                age: 0,
            };

            entityManager.addEntity(bullet);
            entityManager.addEntity(gift);

            const initialScore = gameState.score;
            collisionSystem.checkAllCollisions();

            // Gift should be destroyed
            expect(entityManager.getGifts()).toHaveLength(0);
            expect(gameState.score).toBeLessThan(initialScore); // Penalty applied
        });
    });

    describe("Missile Explosions", () => {
        it("should explode missile and destroy nearby asteroids", () => {
            const missile: GameEntity = {
                position: new Vector2(100, 100),
                velocity: Vector2.zero(),
                size: new Vector2(5, 5),
                rotation: 0,
                color: "#ff0000",
                type: "missile",
                age: 0,
            };

            // Add multiple asteroids near the missile
            const asteroid1: GameEntity = {
                position: new Vector2(110, 110), // Within explosion radius
                velocity: Vector2.zero(),
                size: new Vector2(20, 20),
                rotation: 0,
                color: "#ffffff",
                type: "asteroid",
                age: 0,
            };

            const asteroid2: GameEntity = {
                position: new Vector2(200, 200), // Outside explosion radius
                velocity: Vector2.zero(),
                size: new Vector2(20, 20),
                rotation: 0,
                color: "#ffffff",
                type: "asteroid",
                age: 0,
            };

            entityManager.addEntity(missile);
            entityManager.addEntity(asteroid1);
            entityManager.addEntity(asteroid2);

            collisionSystem.checkAllCollisions();

            // Missile should be marked for removal
            expect(missile.age).toBe(999);

            // Only distant asteroid should remain
            const remainingAsteroids = entityManager.getAsteroids();
            expect(remainingAsteroids).toHaveLength(1);
            expect(remainingAsteroids[0]).toBe(asteroid2);
        });
    });

    describe("Line-Circle Intersection", () => {
        it("should detect laser hitting asteroid", () => {
            const ship: Ship = {
                position: new Vector2(100, 100),
                velocity: Vector2.zero(),
                size: new Vector2(20, 20),
                rotation: 0, // Pointing right
                color: "#ffffff",
                type: "ship",
                playerId: "player",
                trail: [],
                isLaserActive: true,
                laserStartTime: 0,
            };

            const asteroid: GameEntity = {
                position: new Vector2(200, 100), // Directly in front of ship
                velocity: Vector2.zero(),
                size: new Vector2(20, 20),
                rotation: 0,
                color: "#ffffff",
                type: "asteroid",
                age: 1, // Not newly created
            };

            entityManager.addEntity(ship);
            entityManager.addEntity(asteroid);

            // Mock weapon system to return laser length
            vi.spyOn(weaponSystem, "getLaserLength").mockReturnValue(300);

            collisionSystem.checkAllCollisions();

            // Asteroid should be destroyed by laser
            expect(entityManager.getAsteroids()).toHaveLength(0);
        });

        it("should not hit asteroid outside laser range", () => {
            const ship: Ship = {
                position: new Vector2(100, 100),
                velocity: Vector2.zero(),
                size: new Vector2(20, 20),
                rotation: 0,
                color: "#ffffff",
                type: "ship",
                playerId: "player",
                trail: [],
                isLaserActive: true,
                laserStartTime: 0,
            };

            const asteroid: GameEntity = {
                position: new Vector2(500, 100), // Far from ship
                velocity: Vector2.zero(),
                size: new Vector2(20, 20),
                rotation: 0,
                color: "#ffffff",
                type: "asteroid",
                age: 1,
            };

            entityManager.addEntity(ship);
            entityManager.addEntity(asteroid);

            // Mock weapon system to return short laser length
            vi.spyOn(weaponSystem, "getLaserLength").mockReturnValue(100);

            collisionSystem.checkAllCollisions();

            // Asteroid should not be destroyed
            expect(entityManager.getAsteroids()).toHaveLength(1);
        });
    });

    describe("Score Management", () => {
        it("should award correct points for asteroid destruction", () => {
            const bullet: GameEntity = {
                position: new Vector2(100, 100),
                velocity: Vector2.zero(),
                size: new Vector2(2, 2),
                rotation: 0,
                color: "#ffff00",
                type: "bullet",
                age: 0,
            };

            const asteroid: GameEntity = {
                position: new Vector2(102, 102),
                velocity: Vector2.zero(),
                size: new Vector2(15, 15), // Small asteroid
                rotation: 0,
                color: "#ffffff",
                type: "asteroid",
                age: 0,
            };

            entityManager.addEntity(bullet);
            entityManager.addEntity(asteroid);

            const initialScore = gameState.score;
            collisionSystem.checkAllCollisions();

            // Should award points for small asteroid
            const expectedPoints = GameState.getAsteroidScore(15);
            expect(gameState.score).toBe(initialScore + expectedPoints);
        });
    });

    describe("AI Companion Gift Collection Prevention", () => {
        it("should prevent AI companions from collecting gifts through collision", () => {
            // Create an AI companion ship
            const companionShip: Ship = {
                position: new Vector2(100, 100),
                velocity: Vector2.zero(),
                size: new Vector2(20, 10),
                rotation: 0,
                color: "#00dd88",
                type: "ship",
                playerId: "companion_test_789",
                age: 0,
                isAI: true,
                aiState: "hunting",
                aiTarget: null,
                aiLastDecisionTime: 0,
                invulnerable: false,
                thrusting: false,
                strafingLeft: false,
                strafingRight: false,
                isLaserActive: false,
                trail: [],
            };

            // Create a gift that overlaps with the companion
            const gift: GameEntity = {
                position: new Vector2(100, 100), // Same position as companion
                velocity: Vector2.zero(),
                size: new Vector2(20, 20),
                rotation: 0,
                color: "#ffff00",
                type: "gift",
                age: 0,
                giftType: "fuel_refill",
            };

            // Register the companion in game state
            gameState.addAICompanion("companion_test_789");

            entityManager.addEntity(companionShip);
            entityManager.addEntity(gift);

            const initialGiftCount = entityManager.getGifts().length;
            const companionState =
                gameState.getPlayerState("companion_test_789");
            const initialFuel = companionState?.fuel || 0;

            collisionSystem.checkAllCollisions();

            // Gift should still exist (not collected by companion)
            const remainingGifts = entityManager.getGifts();
            expect(remainingGifts.length).toBe(initialGiftCount);
            expect(remainingGifts[0]).toBe(gift);

            // Companion fuel should not have changed
            const finalFuel =
                gameState.getPlayerState("companion_test_789")?.fuel || 0;
            expect(finalFuel).toBe(initialFuel);
        });

        it("should allow original computer player to collect gifts through collision", () => {
            // Create the original computer player ship
            const computerShip: Ship = {
                position: new Vector2(200, 200),
                velocity: Vector2.zero(),
                size: new Vector2(20, 10),
                rotation: 0,
                color: "#00ff00",
                type: "ship",
                playerId: "computer",
                age: 0,
                isAI: true,
                aiState: "hunting",
                aiTarget: null,
                aiLastDecisionTime: 0,
                invulnerable: false,
                thrusting: false,
                strafingLeft: false,
                strafingRight: false,
                isLaserActive: false,
                trail: [],
            };

            // Create a gift that overlaps with the computer player
            const gift: GameEntity = {
                position: new Vector2(200, 200), // Same position as computer player
                velocity: Vector2.zero(),
                size: new Vector2(20, 20),
                rotation: 0,
                color: "#ffff00",
                type: "gift",
                age: 0,
                giftType: "fuel_refill",
            };

            entityManager.addEntity(computerShip);
            entityManager.addEntity(gift);

            collisionSystem.checkAllCollisions();

            // Gift should be collected (removed from game)
            const remainingGifts = entityManager.getGifts();
            expect(remainingGifts.length).toBe(0);

            // Computer player fuel should be refilled
            const finalFuel = gameState.getPlayerState("computer")?.fuel || 0;
            expect(finalFuel).toBe(100); // Fuel refill should set to 100
        });

        it("should allow human player to collect gifts through collision", () => {
            // Create the human player ship
            const playerShip: Ship = {
                position: new Vector2(300, 300),
                velocity: Vector2.zero(),
                size: new Vector2(20, 10),
                rotation: 0,
                color: "#00ff00",
                type: "ship",
                playerId: "player",
                age: 0,
                isAI: false,
                invulnerable: false,
                thrusting: false,
                strafingLeft: false,
                strafingRight: false,
                isLaserActive: false,
                trail: [],
            };

            // Create a gift that overlaps with the player
            const gift: GameEntity = {
                position: new Vector2(300, 300), // Same position as player
                velocity: Vector2.zero(),
                size: new Vector2(20, 20),
                rotation: 0,
                color: "#ffff00",
                type: "gift",
                age: 0,
                giftType: "fuel_refill",
            };

            entityManager.addEntity(playerShip);
            entityManager.addEntity(gift);

            collisionSystem.checkAllCollisions();

            // Gift should be collected (removed from game)
            const remainingGifts = entityManager.getGifts();
            expect(remainingGifts.length).toBe(0);

            // Player fuel should be refilled
            const finalFuel = gameState.getPlayerState("player")?.fuel || 0;
            expect(finalFuel).toBe(100); // Fuel refill should set to 100
        });
    });
});
