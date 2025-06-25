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
import type { Missile, Asteroid } from "~/entities";
import { WEAPONS } from "~/config/constants";

describe("Missile Collision Detection", () => {
    let collisionSystem: CollisionSystem;
    let entityManager: EntityManager;
    let mockCanvas: HTMLCanvasElement;

    beforeEach(() => {
        mockCanvas = {
            width: 800,
            height: 600,
        } as HTMLCanvasElement;

        entityManager = new EntityManager(mockCanvas);

        const mockAudio = {
            playAsteroidDestroy: vi.fn().mockResolvedValue(undefined),
            playAsteroidSplit: vi.fn().mockResolvedValue(undefined),
        } as unknown as AudioManager;

        const mockParticles = {
            createMissileExplosion: vi.fn(),
            createAsteroidExplosion: vi.fn(),
        } as unknown as ParticleSystem;

        const mockGameState = {
            addScore: vi.fn(),
        } as unknown as GameState;

        const mockScaleManager = {
            scaleValue: vi.fn((value: number) => value), // Return value unchanged for testing
        } as unknown as ScaleManager;

        collisionSystem = new CollisionSystem(
            mockAudio,
            mockParticles,
            mockGameState,
            entityManager,
            {} as WeaponSystem,
            {} as ShieldSystem,
            {} as MessageSystem,
            mockScaleManager
        );
    });

    it("should explode when collision circles overlap", () => {
        const missile: Missile = {
            type: "missile",
            position: new Vector2(100, 100),
            velocity: new Vector2(10, 0),
            size: new Vector2(4, 4),
            rotation: 0,
            color: WEAPONS.MISSILES.COLOR,
            age: 0,
            originalDirection: new Vector2(1, 0),
        };

        const asteroid: Asteroid = {
            type: "asteroid",
            position: new Vector2(108, 100), // Close enough for collision circles to overlap
            velocity: new Vector2(0, 0),
            size: new Vector2(20, 20),
            rotation: 0,
            color: "#ffffff",
            age: 0,
        };

        entityManager.addEntity(missile);
        entityManager.addEntity(asteroid);

        collisionSystem.checkAllCollisions();

        // Missile should explode
        expect(missile.age).toBe(999);
        expect(entityManager.getExplosionZones()).toHaveLength(1);
    });

    it("should NOT explode when collision circles do not overlap", () => {
        const missile: Missile = {
            type: "missile",
            position: new Vector2(100, 100),
            velocity: new Vector2(10, 0),
            size: new Vector2(4, 4),
            rotation: 0,
            color: WEAPONS.MISSILES.COLOR,
            age: 0,
            originalDirection: new Vector2(1, 0),
        };

        const asteroid: Asteroid = {
            type: "asteroid",
            position: new Vector2(150, 100), // Far enough that collision circles don't overlap
            velocity: new Vector2(0, 0),
            size: new Vector2(20, 20),
            rotation: 0,
            color: "#ffffff",
            age: 0,
        };

        entityManager.addEntity(missile);
        entityManager.addEntity(asteroid);

        collisionSystem.checkAllCollisions();

        // Missile should NOT explode
        expect(missile.age).toBe(0);
        expect(entityManager.getExplosionZones()).toHaveLength(0);
    });

    it("should create large explosion zone when collision occurs", () => {
        const missile: Missile = {
            type: "missile",
            position: new Vector2(100, 100),
            velocity: new Vector2(10, 0),
            size: new Vector2(4, 4),
            rotation: 0,
            color: WEAPONS.MISSILES.COLOR,
            age: 0,
            originalDirection: new Vector2(1, 0),
        };

        const asteroid: Asteroid = {
            type: "asteroid",
            position: new Vector2(105, 100), // Close enough for collision circles to overlap
            velocity: new Vector2(0, 0),
            size: new Vector2(20, 20),
            rotation: 0,
            color: "#ffffff",
            age: 0,
        };

        entityManager.addEntity(missile);
        entityManager.addEntity(asteroid);

        collisionSystem.checkAllCollisions();

        // Should create explosion zone with large radius
        const explosionZones = entityManager.getExplosionZones();
        expect(explosionZones).toHaveLength(1);
        expect(explosionZones[0].explosionRadius).toBe(
            WEAPONS.MISSILES.EXPLOSION_RADIUS
        ); // 90px
        expect(explosionZones[0].remainingFrames).toBe(
            WEAPONS.MISSILES.EXPLOSION_DURATION_FRAMES
        ); // 45 frames
    });
});
