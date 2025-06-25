import { describe, it, expect, beforeEach, vi } from "vitest";
import { Game } from "./Game";
import { EntityManager } from "./EntityManager";
import { CollisionSystem } from "./CollisionSystem";
import { Vector2 } from "~/utils/Vector2";
import type { Missile, Asteroid } from "~/entities";
import { WEAPONS, ASTEROID } from "~/config/constants";

describe("Missile Area of Effect - Integration Test", () => {
    let game: Game;
    let mockCanvas: HTMLCanvasElement;
    let mockContext: CanvasRenderingContext2D;

    beforeEach(() => {
        // Mock canvas and context
        mockContext = {
            fillStyle: "",
            fillRect: vi.fn(),
            beginPath: vi.fn(),
            arc: vi.fn(),
            fill: vi.fn(),
            stroke: vi.fn(),
            strokeStyle: "",
            lineWidth: 0,
            save: vi.fn(),
            restore: vi.fn(),
            translate: vi.fn(),
            rotate: vi.fn(),
            scale: vi.fn(),
            createRadialGradient: vi.fn().mockReturnValue({
                addColorStop: vi.fn(),
            }),
            canvas: {
                width: 800,
                height: 600,
            },
        } as unknown as CanvasRenderingContext2D;

        mockCanvas = {
            width: 800,
            height: 600,
            getContext: vi.fn().mockReturnValue(mockContext),
            style: {},
        } as unknown as HTMLCanvasElement;

        // Mock other browser APIs
        global.performance = {
            now: vi.fn().mockReturnValue(0),
        } as unknown as Performance;

        global.requestAnimationFrame = vi.fn();
        global.HTMLCanvasElement = vi.fn();
        global.AudioContext = vi.fn().mockImplementation(() => ({
            createGain: vi.fn().mockReturnValue({
                connect: vi.fn(),
                gain: {
                    value: 0,
                    setValueAtTime: vi.fn(),
                },
            }),
            createOscillator: vi.fn().mockReturnValue({
                connect: vi.fn(),
                start: vi.fn(),
                stop: vi.fn(),
                frequency: { value: 0 },
                type: "sine",
            }),
            createBuffer: vi.fn(),
            createBufferSource: vi.fn().mockReturnValue({
                connect: vi.fn(),
                start: vi.fn(),
                stop: vi.fn(),
                buffer: null,
            }),
            decodeAudioData: vi.fn().mockResolvedValue({}),
            currentTime: 0,
            destination: {},
        }));

        // Create game instance
        game = new Game(mockCanvas);
    });

    it("should create explosion zone when missile hits large asteroid", () => {
        // Get private access to game systems for testing
        const entityManager = (game as { entityManager: EntityManager })
            .entityManager;
        const collisionSystem = (game as { collisionSystem: CollisionSystem })
            .collisionSystem;

        // Clear any existing entities from game initialization
        entityManager.clearAllEntities();

        // Create a missile
        const missile: Missile = {
            type: "missile",
            position: new Vector2(100, 100),
            velocity: new Vector2(50, 0),
            size: new Vector2(
                WEAPONS.MISSILES.SIZE * 2,
                WEAPONS.MISSILES.SIZE * 2
            ),
            rotation: 0,
            color: WEAPONS.MISSILES.COLOR,
            age: 0,
            originalDirection: new Vector2(1, 0),
        };

        // Create a large asteroid near the missile
        const asteroid: Asteroid = {
            type: "asteroid",
            position: new Vector2(105, 105), // Within trigger radius for actual collision
            velocity: new Vector2(0, 0),
            size: new Vector2(ASTEROID.LARGE_MAX_SIZE, ASTEROID.LARGE_MAX_SIZE),
            rotation: 0,
            color: ASTEROID.COLOR,
            age: 0,
        };

        // Add entities to the game
        entityManager.addEntity(missile);
        entityManager.addEntity(asteroid);

        // Verify initial state
        expect(entityManager.getMissiles()).toHaveLength(1);
        expect(entityManager.getAsteroids()).toHaveLength(1);
        expect(entityManager.getExplosionZones()).toHaveLength(0);

        // Trigger collision detection
        collisionSystem.checkAllCollisions();

        // Verify missile was consumed and explosion zone created
        expect(entityManager.getMissiles()[0].age).toBe(999); // Marked for removal
        expect(entityManager.getExplosionZones()).toHaveLength(1);

        const explosionZone = entityManager.getExplosionZones()[0];
        expect(explosionZone.position).toEqual(missile.position);
        expect(explosionZone.explosionRadius).toBe(
            WEAPONS.MISSILES.EXPLOSION_RADIUS
        );
        expect(explosionZone.remainingFrames).toBe(
            WEAPONS.MISSILES.EXPLOSION_DURATION_FRAMES
        );
    });

    it("should destroy asteroid fragments that spawn within explosion zone", () => {
        // Get private access to game systems for testing
        const entityManager = (game as { entityManager: EntityManager })
            .entityManager;
        const collisionSystem = (game as { collisionSystem: CollisionSystem })
            .collisionSystem;

        // Clear any existing entities from game initialization
        entityManager.clearAllEntities();

        // Create explosion zone manually (simulating post-missile-hit state)
        const explosionZone = {
            type: "explosionZone" as const,
            position: new Vector2(200, 200),
            velocity: new Vector2(0, 0),
            size: new Vector2(
                WEAPONS.MISSILES.EXPLOSION_RADIUS * 2,
                WEAPONS.MISSILES.EXPLOSION_RADIUS * 2
            ),
            rotation: 0,
            color: WEAPONS.MISSILES.COLOR,
            age: 0,
            remainingFrames: 15, // Still active
            explosionRadius: WEAPONS.MISSILES.EXPLOSION_RADIUS,
        };

        // Create small asteroid fragments within explosion zone (simulating asteroid split)
        const fragment1: Asteroid = {
            type: "asteroid",
            position: new Vector2(210, 210), // Within 60px radius
            velocity: new Vector2(30, 20),
            size: new Vector2(ASTEROID.SMALL_MAX_SIZE, ASTEROID.SMALL_MAX_SIZE),
            rotation: 0,
            color: ASTEROID.COLOR,
            age: 0,
        };

        const fragment2: Asteroid = {
            type: "asteroid",
            position: new Vector2(185, 195), // Within 60px radius
            velocity: new Vector2(-25, 35),
            size: new Vector2(ASTEROID.SMALL_MAX_SIZE, ASTEROID.SMALL_MAX_SIZE),
            rotation: 0,
            color: ASTEROID.COLOR,
            age: 0,
        };

        // Add entities
        entityManager.addEntity(explosionZone);
        entityManager.addEntity(fragment1);
        entityManager.addEntity(fragment2);

        // Verify initial state
        expect(entityManager.getExplosionZones()).toHaveLength(1);
        expect(entityManager.getAsteroids()).toHaveLength(2);

        // Process explosion zone effects
        collisionSystem.processExplosionZoneEffects();

        // Verify fragments were destroyed by explosion zone
        expect(entityManager.getAsteroids()).toHaveLength(0);
    });

    it("should leave asteroids outside explosion radius unaffected", () => {
        // Get private access to game systems for testing
        const entityManager = (game as { entityManager: EntityManager })
            .entityManager;
        const collisionSystem = (game as { collisionSystem: CollisionSystem })
            .collisionSystem;

        // Clear any existing entities from game initialization
        entityManager.clearAllEntities();

        // Create explosion zone
        const explosionZone = {
            type: "explosionZone" as const,
            position: new Vector2(200, 200),
            velocity: new Vector2(0, 0),
            size: new Vector2(
                WEAPONS.MISSILES.EXPLOSION_RADIUS * 2,
                WEAPONS.MISSILES.EXPLOSION_RADIUS * 2
            ),
            rotation: 0,
            color: WEAPONS.MISSILES.COLOR,
            age: 0,
            remainingFrames: 15,
            explosionRadius: WEAPONS.MISSILES.EXPLOSION_RADIUS,
        };

        // Create asteroid outside explosion radius
        const distantAsteroid: Asteroid = {
            type: "asteroid",
            position: new Vector2(300, 300), // More than 60px away
            velocity: new Vector2(0, 0),
            size: new Vector2(
                ASTEROID.MEDIUM_MAX_SIZE,
                ASTEROID.MEDIUM_MAX_SIZE
            ),
            rotation: 0,
            color: ASTEROID.COLOR,
            age: 0,
        };

        entityManager.addEntity(explosionZone);
        entityManager.addEntity(distantAsteroid);

        expect(entityManager.getAsteroids()).toHaveLength(1);

        // Process explosion zone effects
        collisionSystem.processExplosionZoneEffects();

        // Verify distant asteroid remains unaffected
        expect(entityManager.getAsteroids()).toHaveLength(1);
        expect(entityManager.getAsteroids()[0]).toBe(distantAsteroid);
    });

    it("should expire explosion zones after configured duration", () => {
        // Get private access to game systems for testing
        const entityManager = (game as { entityManager: EntityManager })
            .entityManager;

        // Create explosion zone with only 1 frame remaining
        const explosionZone = {
            type: "explosionZone" as const,
            position: new Vector2(200, 200),
            velocity: new Vector2(0, 0),
            size: new Vector2(
                WEAPONS.MISSILES.EXPLOSION_RADIUS * 2,
                WEAPONS.MISSILES.EXPLOSION_RADIUS * 2
            ),
            rotation: 0,
            color: WEAPONS.MISSILES.COLOR,
            age: 0,
            remainingFrames: 1, // About to expire
            explosionRadius: WEAPONS.MISSILES.EXPLOSION_RADIUS,
        };

        entityManager.addEntity(explosionZone);
        expect(entityManager.getExplosionZones()).toHaveLength(1);

        // Update explosion zones (simulates game loop)
        entityManager.updateExplosionZones();

        // Verify explosion zone was removed after expiring
        expect(entityManager.getExplosionZones()).toHaveLength(0);
    });
});
