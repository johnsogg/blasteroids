import { describe, it, expect, beforeEach, vi } from "vitest";
import { CollisionSystem } from "./CollisionSystem";
import { EntityManager } from "./EntityManager";
import { GameState } from "./GameState";
import { WeaponSystem } from "./WeaponSystem";
import { ShieldSystem } from "./ShieldSystem";
import { MessageSystem } from "./MessageSystem";
import { AudioManager } from "~/audio/AudioManager";
import { ParticleSystem } from "~/render/ParticleSystem";
import { ScaleManager } from "~/utils/ScaleManager";
import { Vector2 } from "~/utils/Vector2";
import type { Missile, Asteroid, ExplosionZone } from "~/entities";
import { WEAPONS, ASTEROID } from "~/config/constants";

describe("Missile Fragment Timing", () => {
    let collisionSystem: CollisionSystem;
    let entityManager: EntityManager;
    let mockCanvas: HTMLCanvasElement;
    let mockAudio: AudioManager;
    let mockParticles: ParticleSystem;
    let mockGameState: GameState;
    let mockWeaponSystem: WeaponSystem;
    let mockShieldSystem: ShieldSystem;
    let mockMessageSystem: MessageSystem;
    let mockScaleManager: ScaleManager;

    beforeEach(() => {
        mockCanvas = {
            width: 800,
            height: 600,
        } as HTMLCanvasElement;

        entityManager = new EntityManager(mockCanvas);
        mockAudio = {
            playAsteroidDestroy: vi.fn().mockResolvedValue(undefined),
            playAsteroidSplit: vi.fn().mockResolvedValue(undefined),
            playAsteroidHit: vi.fn().mockResolvedValue(undefined),
        } as unknown as AudioManager;
        mockParticles = {
            createMissileExplosion: vi.fn(),
            createAsteroidExplosion: vi.fn(),
        } as unknown as ParticleSystem;
        mockGameState = {
            addScore: vi.fn(),
        } as unknown as GameState;
        mockWeaponSystem = {} as WeaponSystem;
        mockShieldSystem = {} as ShieldSystem;
        mockMessageSystem = {} as MessageSystem;
        mockScaleManager = {
            scaleValue: vi.fn((value: number) => value), // Return value unchanged for testing
        } as unknown as ScaleManager;

        collisionSystem = new CollisionSystem(
            mockAudio,
            mockParticles,
            mockGameState,
            entityManager,
            mockWeaponSystem,
            mockShieldSystem,
            mockMessageSystem,
            mockScaleManager
        );
    });

    it("should handle fragment escape timing correctly", () => {
        // Create a large asteroid that will fragment
        const largeAsteroid: Asteroid = {
            type: "asteroid",
            position: new Vector2(200, 200),
            velocity: new Vector2(0, 0),
            size: new Vector2(ASTEROID.LARGE_MAX_SIZE, ASTEROID.LARGE_MAX_SIZE), // 40px radius
            rotation: 0,
            color: ASTEROID.COLOR,
            age: 0,
        };

        // Create a missile that will trigger the explosion
        const missile: Missile = {
            type: "missile",
            position: new Vector2(205, 205), // Within trigger radius for actual collision
            velocity: new Vector2(0, 0),
            size: new Vector2(4, 4),
            rotation: 0,
            color: WEAPONS.MISSILES.COLOR,
            age: 0,
            originalDirection: new Vector2(1, 0),
        };

        entityManager.addEntity(largeAsteroid);
        entityManager.addEntity(missile);

        // Initial state
        expect(entityManager.getAsteroids()).toHaveLength(1);
        expect(entityManager.getMissiles()).toHaveLength(1);
        expect(entityManager.getExplosionZones()).toHaveLength(0);

        // Frame 1: Missile collision creates explosion zone
        collisionSystem.checkAllCollisions();

        // Missile should be marked for removal, explosion zone created
        expect(entityManager.getMissiles()[0].age).toBe(999);
        expect(entityManager.getExplosionZones()).toHaveLength(1);

        const explosionZone = entityManager.getExplosionZones()[0];
        expect(explosionZone.remainingFrames).toBe(
            WEAPONS.MISSILES.EXPLOSION_DURATION_FRAMES
        );

        // The original asteroid should be destroyed and fragments should spawn
        // (This happens in processExplosionZoneEffects)
        const asteroidsAfterExplosion = entityManager.getAsteroids();

        // Verify that either the original asteroid is gone and fragments exist,
        // or all asteroids within radius are destroyed
        if (asteroidsAfterExplosion.length === 0) {
            // All asteroids were destroyed by explosion zone - this is the desired behavior
            expect(asteroidsAfterExplosion).toHaveLength(0);
        } else {
            // If fragments exist, they should be within the explosion zone to be caught next frame
            for (const asteroid of asteroidsAfterExplosion) {
                const distance = Math.sqrt(
                    Math.pow(
                        explosionZone.position.x - asteroid.position.x,
                        2
                    ) +
                        Math.pow(
                            explosionZone.position.y - asteroid.position.y,
                            2
                        )
                );
                expect(distance).toBeLessThanOrEqual(
                    explosionZone.explosionRadius
                );
            }
        }
    });

    it("should destroy fragments over multiple frames", () => {
        // Manually create an explosion zone and some fragments to simulate the timing issue
        const explosionZone: ExplosionZone = {
            type: "explosionZone",
            position: new Vector2(200, 200),
            velocity: new Vector2(0, 0),
            size: new Vector2(
                WEAPONS.MISSILES.EXPLOSION_RADIUS * 2,
                WEAPONS.MISSILES.EXPLOSION_RADIUS * 2
            ),
            rotation: 0,
            color: WEAPONS.MISSILES.COLOR,
            age: 0,
            remainingFrames: WEAPONS.MISSILES.EXPLOSION_DURATION_FRAMES,
            explosionRadius: WEAPONS.MISSILES.EXPLOSION_RADIUS,
        };

        // Create fragments that simulate worst-case spawning
        const fragments: Asteroid[] = [];
        for (let i = 0; i < 3; i++) {
            const angle = (i / 3) * Math.PI * 2;
            const spawnDistance = ASTEROID.FRAGMENT_SPAWN_RADIUS; // 40px from center
            const fragmentPosition = new Vector2(
                explosionZone.position.x + Math.cos(angle) * spawnDistance,
                explosionZone.position.y + Math.sin(angle) * spawnDistance
            );

            const fragment: Asteroid = {
                type: "asteroid",
                position: fragmentPosition,
                velocity: new Vector2(
                    Math.cos(angle) * ASTEROID.FRAGMENT_SPEED_MAX,
                    Math.sin(angle) * ASTEROID.FRAGMENT_SPEED_MAX
                ),
                size: new Vector2(
                    ASTEROID.SMALL_MAX_SIZE,
                    ASTEROID.SMALL_MAX_SIZE
                ),
                rotation: 0,
                color: ASTEROID.COLOR,
                age: 0,
            };

            fragments.push(fragment);
            entityManager.addEntity(fragment);
        }

        entityManager.addEntity(explosionZone);

        expect(entityManager.getAsteroids()).toHaveLength(3);
        expect(entityManager.getExplosionZones()).toHaveLength(1);

        // Simulate multiple frames to see if fragments get caught
        let framesProcessed = 0;
        const maxFramesToTest = Math.min(
            10,
            WEAPONS.MISSILES.EXPLOSION_DURATION_FRAMES
        );

        while (
            framesProcessed < maxFramesToTest &&
            entityManager.getAsteroids().length > 0
        ) {
            // Process explosion zone effects
            collisionSystem.processExplosionZoneEffects();

            // Update entities (move fragments)
            const deltaTime = 1 / 60; // 60fps
            for (const asteroid of entityManager.getAsteroids()) {
                asteroid.position = asteroid.position.add(
                    asteroid.velocity.multiply(deltaTime)
                );
            }

            // Update explosion zone
            entityManager.updateExplosionZones();

            framesProcessed++;
        }

        // All fragments should be destroyed within the duration
        expect(entityManager.getAsteroids()).toHaveLength(0);
        console.log(`All fragments destroyed within ${framesProcessed} frames`);
    });
});
