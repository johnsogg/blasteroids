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
import { WEAPONS } from "~/config/constants";

describe("CollisionSystem - Explosion Zone Integration", () => {
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

    it("should create explosion zone when missile hits asteroid", () => {
        const missile: Missile = {
            type: "missile",
            position: new Vector2(100, 100),
            velocity: new Vector2(10, 0),
            size: new Vector2(4, 4),
            rotation: 0,
            color: "#ff8800",
            age: 0,
            originalDirection: new Vector2(1, 0),
        };

        const asteroid: Asteroid = {
            type: "asteroid",
            position: new Vector2(105, 100), // Within explosion radius
            velocity: new Vector2(0, 0),
            size: new Vector2(20, 20),
            rotation: 0,
            color: "#ffffff",
            age: 0,
        };

        entityManager.addEntity(missile);
        entityManager.addEntity(asteroid);

        // Trigger collision check
        collisionSystem.checkAllCollisions();

        // Verify explosion zone was created
        const explosionZones = entityManager.getExplosionZones();
        expect(explosionZones).toHaveLength(1);

        const explosionZone = explosionZones[0];
        expect(explosionZone.position).toEqual(missile.position);
        expect(explosionZone.explosionRadius).toBe(
            WEAPONS.MISSILES.EXPLOSION_RADIUS
        );
        expect(explosionZone.remainingFrames).toBe(
            WEAPONS.MISSILES.EXPLOSION_DURATION_FRAMES
        );
    });

    it("should destroy asteroids within explosion zone each frame", () => {
        // Create explosion zone
        const explosionZone: ExplosionZone = {
            type: "explosionZone",
            position: new Vector2(100, 100),
            velocity: new Vector2(0, 0),
            size: new Vector2(60, 60),
            rotation: 0,
            color: "#ff8800",
            age: 0,
            remainingFrames: 15,
            explosionRadius: 60,
        };

        // Create asteroid within explosion radius
        const asteroid: Asteroid = {
            type: "asteroid",
            position: new Vector2(130, 120), // Within 60px radius
            velocity: new Vector2(0, 0),
            size: new Vector2(15, 15),
            rotation: 0,
            color: "#ffffff",
            age: 0,
        };

        entityManager.addEntity(explosionZone);
        entityManager.addEntity(asteroid);

        expect(entityManager.getAsteroids()).toHaveLength(1);

        // Process explosion zone effects
        collisionSystem.processExplosionZoneEffects();

        // Asteroid should be destroyed
        expect(entityManager.getAsteroids()).toHaveLength(0);
    });

    it("should not affect asteroids outside explosion zone radius", () => {
        // Create explosion zone
        const explosionZone: ExplosionZone = {
            type: "explosionZone",
            position: new Vector2(100, 100),
            velocity: new Vector2(0, 0),
            size: new Vector2(60, 60),
            rotation: 0,
            color: "#ff8800",
            age: 0,
            remainingFrames: 15,
            explosionRadius: 60,
        };

        // Create asteroid outside explosion radius
        const asteroid: Asteroid = {
            type: "asteroid",
            position: new Vector2(200, 200), // More than 60px away
            velocity: new Vector2(0, 0),
            size: new Vector2(15, 15),
            rotation: 0,
            color: "#ffffff",
            age: 0,
        };

        entityManager.addEntity(explosionZone);
        entityManager.addEntity(asteroid);

        expect(entityManager.getAsteroids()).toHaveLength(1);

        // Process explosion zone effects
        collisionSystem.processExplosionZoneEffects();

        // Asteroid should remain unaffected
        expect(entityManager.getAsteroids()).toHaveLength(1);
    });
});
