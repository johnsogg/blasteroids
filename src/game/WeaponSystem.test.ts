import { describe, it, expect, beforeEach, vi } from "vitest";
import { WeaponSystem } from "./WeaponSystem";
import { GameState } from "./GameState";
import { EntityManager } from "./EntityManager";
import { AudioManager } from "~/audio/AudioManager";
import { ParticleSystem } from "~/render/ParticleSystem";
import { Vector2 } from "~/utils/Vector2";
import type { GameEntity, Ship } from "~/entities";
import { WEAPONS } from "~/config/constants";
import { InputContext } from "~/input/InputContext";

describe("WeaponSystem", () => {
    let weaponSystem: WeaponSystem;
    let gameState: GameState;
    let entityManager: EntityManager;
    let audioManager: AudioManager;
    let particleSystem: ParticleSystem;
    let mockShip: Ship;
    let mockAsteroid: GameEntity;

    beforeEach(() => {
        // Create mock dependencies
        audioManager = {
            playLightningStrike: vi.fn().mockResolvedValue(undefined),
            playLightningMiss: vi.fn().mockResolvedValue(undefined),
            playAsteroidHit: vi.fn().mockResolvedValue(undefined),
            playAsteroidDestroy: vi.fn().mockResolvedValue(undefined),
            playGiftDestroyed: vi.fn().mockResolvedValue(undefined),
            playMissileLaunch: vi.fn().mockResolvedValue(undefined),
            playBulletFire: vi.fn().mockResolvedValue(undefined),
            playShoot: vi.fn().mockResolvedValue(undefined),
            playMissileCooldown: vi.fn().mockResolvedValue(undefined),
        } as unknown as AudioManager;

        particleSystem = {
            createAsteroidExplosion: vi.fn(),
            createGiftExplosion: vi.fn(),
            createMissileTrail: vi.fn(),
        } as unknown as ParticleSystem;

        gameState = new GameState();

        // Create mock canvas
        const mockCanvas = {
            width: 800,
            height: 600,
        } as HTMLCanvasElement;

        entityManager = new EntityManager(mockCanvas);

        weaponSystem = new WeaponSystem(
            audioManager,
            particleSystem,
            gameState,
            entityManager
        );

        // Create mock ship
        mockShip = {
            position: new Vector2(400, 300),
            velocity: Vector2.zero(),
            size: new Vector2(20, 10),
            rotation: 0,
            color: "#ffffff",
            type: "ship",
            playerId: "player",
            age: 0,
            invulnerable: false,
            invulnerableTime: 0,
            thrusting: false,
            strafingLeft: false,
            strafingRight: false,
            isLaserActive: false,
            trail: [],
            lightningTargets: [],
            lightningTime: 0,
        };

        // Create mock asteroid within lightning range
        mockAsteroid = {
            position: new Vector2(450, 300), // 50 pixels away
            velocity: Vector2.zero(),
            size: new Vector2(40, 40),
            rotation: 0,
            color: "#ffffff",
            type: "asteroid",
            age: 0,
        };

        // Setup game state (player is already initialized by constructor)
        gameState.unlockWeapon("lightning", "player");
        gameState.switchWeapon("lightning", "player");
        gameState.refillFuel("player"); // Ensure ship has fuel
    });

    describe("Lightning Weapon", () => {
        it("should fire and consume fuel when target is in range", () => {
            // Add asteroid to entity manager
            entityManager.addEntity(mockAsteroid);

            const initialFuel = gameState.getPlayerState("player")!.fuel;

            // Fire lightning weapon
            weaponSystem.handleWeaponInput(
                mockShip,
                {
                    weapon1: false,
                    weapon2: false,
                    weapon3: false,
                    weapon4: false,
                    shoot: false,
                    shootPressed: true,
                },
                1000,
                InputContext.GAMEPLAY
            );

            // Verify fuel was consumed
            const finalFuel = gameState.getPlayerState("player")!.fuel;
            expect(finalFuel).toBe(
                initialFuel - WEAPONS.LIGHTNING.FUEL_CONSUMPTION
            );

            // Verify lightning targets were set for rendering
            expect(mockShip.lightningTargets).toBeDefined();
            expect(mockShip.lightningTargets!.length).toBeGreaterThan(0);
            expect(mockShip.lightningTime).toBe(1000);

            // Verify audio was played
            expect(audioManager.playLightningStrike).toHaveBeenCalled();
        });

        it("should not fire if no targets are in range", () => {
            // Don't add any asteroids to entity manager
            const initialFuel = gameState.getPlayerState("player")!.fuel;

            // Fire lightning weapon
            weaponSystem.handleWeaponInput(
                mockShip,
                {
                    weapon1: false,
                    weapon2: false,
                    weapon3: false,
                    weapon4: false,
                    shoot: false,
                    shootPressed: true,
                },
                1000,
                InputContext.GAMEPLAY
            );

            // Verify no fuel was consumed
            const finalFuel = gameState.getPlayerState("player")!.fuel;
            expect(finalFuel).toBe(initialFuel);

            // Verify miss sound was played
            expect(audioManager.playLightningMiss).toHaveBeenCalled();

            // Verify no lightning targets were set
            expect(mockShip.lightningTargets).toEqual([]);
        });

        it("should respect cooldown period", () => {
            // Add asteroid to entity manager
            entityManager.addEntity(mockAsteroid);

            // Fire lightning weapon first time
            weaponSystem.handleWeaponInput(
                mockShip,
                {
                    weapon1: false,
                    weapon2: false,
                    weapon3: false,
                    weapon4: false,
                    shoot: false,
                    shootPressed: true,
                },
                1000,
                InputContext.GAMEPLAY
            );

            // Try to fire again immediately (should be blocked by cooldown)
            const initialFuel = gameState.getPlayerState("player")!.fuel;
            weaponSystem.handleWeaponInput(
                mockShip,
                {
                    weapon1: false,
                    weapon2: false,
                    weapon3: false,
                    weapon4: false,
                    shoot: false,
                    shootPressed: true,
                },
                1000 + 100, // 100ms later, still within cooldown
                InputContext.GAMEPLAY
            );

            // Verify no additional fuel was consumed
            const finalFuel = gameState.getPlayerState("player")!.fuel;
            expect(finalFuel).toBe(initialFuel);
        });
    });

    describe("Missile Trajectory", () => {
        it("should fire missiles in a straight line like bullets", () => {
            // Switch to missiles
            gameState.unlockWeapon("missiles", "player");
            gameState.switchWeapon("missiles", "player");

            // Fire missile at 0 degrees (pointing right)
            mockShip.rotation = 0;
            weaponSystem.handleWeaponInput(
                mockShip,
                {
                    weapon1: false,
                    weapon2: false,
                    weapon3: false,
                    weapon4: false,
                    shoot: false,
                    shootPressed: true,
                },
                1000,
                InputContext.GAMEPLAY
            );

            const missiles = entityManager.getMissiles();
            expect(missiles).toHaveLength(1);

            const missile = missiles[0];
            const initialDirection = missile.velocity.normalize();
            const initialPosition = missile.position.copy();

            // Update missile physics over several frames
            for (let i = 0; i < 10; i++) {
                weaponSystem.updateMissilePhysics(0.016); // 16ms = ~60fps
                entityManager.updateEntities(0.016, 1000 + i * 16);
            }

            // Check that missile is still traveling in the same direction
            const currentDirection = missile.velocity.normalize();
            const directionDiff = Math.abs(
                Math.atan2(currentDirection.y, currentDirection.x) -
                    Math.atan2(initialDirection.y, initialDirection.x)
            );

            // Direction should not have changed significantly (within 0.01 radians)
            expect(directionDiff).toBeLessThan(0.01);

            // Check missile moved in its original direction (allowing for small floating point error)
            const actualDisplacement =
                missile.position.subtract(initialPosition);
            const expectedDirection = initialDirection;
            const actualDirection = actualDisplacement.normalize();

            // The direction should be very close to the initial direction
            const directionDotProduct = expectedDirection.dot(actualDirection);
            expect(directionDotProduct).toBeGreaterThan(0.999); // Very close to 1.0 (parallel)

            // Cross product should be near zero (no perpendicular component)
            const crossProduct = Math.abs(
                expectedDirection.x * actualDirection.y -
                    expectedDirection.y * actualDirection.x
            );
            expect(crossProduct).toBeLessThan(0.01);
        });

        it("should maintain straight trajectory like bullets", () => {
            // Test bullets first
            gameState.unlockWeapon("bullets", "player");
            gameState.switchWeapon("bullets", "player");

            mockShip.rotation = Math.PI / 4; // 45 degrees
            weaponSystem.handleWeaponInput(
                mockShip,
                {
                    weapon1: false,
                    weapon2: false,
                    weapon3: false,
                    weapon4: false,
                    shoot: true, // Set shoot to true for bullets
                    shootPressed: false,
                },
                1000,
                InputContext.GAMEPLAY
            );

            const bullets = entityManager.getBullets();
            expect(bullets).toHaveLength(1);
            const bullet = bullets[0];
            const bulletInitialDirection = bullet.velocity.normalize();

            // Update bullet physics
            for (let i = 0; i < 10; i++) {
                entityManager.updateEntities(0.016, 1000 + i * 16);
            }

            const bulletFinalDirection = bullet.velocity.normalize();
            const bulletDirectionDiff = Math.abs(
                Math.atan2(bulletFinalDirection.y, bulletFinalDirection.x) -
                    Math.atan2(
                        bulletInitialDirection.y,
                        bulletInitialDirection.x
                    )
            );

            // Now test missiles with fresh entity manager setup
            gameState.unlockWeapon("missiles", "player");
            gameState.switchWeapon("missiles", "player");

            mockShip.rotation = Math.PI / 4; // Same 45 degrees
            weaponSystem.handleWeaponInput(
                mockShip,
                {
                    weapon1: false,
                    weapon2: false,
                    weapon3: false,
                    weapon4: false,
                    shoot: false,
                    shootPressed: true,
                },
                5000, // Different time to avoid cooldown (missiles have 4s cooldown)
                InputContext.GAMEPLAY
            );

            const missiles = entityManager.getMissiles();
            expect(missiles).toHaveLength(1);
            const missile = missiles[0];
            const missileInitialDirection = missile.velocity.normalize();

            // Update missile physics (without homing)
            for (let i = 0; i < 10; i++) {
                weaponSystem.updateMissilePhysics(0.016);
                entityManager.updateEntities(0.016, 2000 + i * 16);
            }

            const missileFinalDirection = missile.velocity.normalize();
            const missileDirectionDiff = Math.abs(
                Math.atan2(missileFinalDirection.y, missileFinalDirection.x) -
                    Math.atan2(
                        missileInitialDirection.y,
                        missileInitialDirection.x
                    )
            );

            // Missiles should maintain direction as well as bullets
            expect(missileDirectionDiff).toBeLessThanOrEqual(
                bulletDirectionDiff + 0.001
            );
        });

        it("should not inherit ship velocity when created", () => {
            // Switch to missiles
            gameState.unlockWeapon("missiles", "player");
            gameState.switchWeapon("missiles", "player");

            // Give ship some velocity
            mockShip.velocity = new Vector2(50, 30);
            mockShip.rotation = 0; // pointing right

            // Fire missile
            weaponSystem.handleWeaponInput(
                mockShip,
                {
                    weapon1: false,
                    weapon2: false,
                    weapon3: false,
                    weapon4: false,
                    shoot: false,
                    shootPressed: true,
                },
                1000,
                InputContext.GAMEPLAY
            );

            const missiles = entityManager.getMissiles();
            expect(missiles).toHaveLength(1);

            const missile = missiles[0];

            // Missile should only have directional velocity, not ship's velocity
            const expectedVelocity = Vector2.fromAngle(
                mockShip.rotation,
                WEAPONS.MISSILES.INITIAL_SPEED
            );
            expect(missile.velocity.x).toBeCloseTo(expectedVelocity.x, 2);
            expect(missile.velocity.y).toBeCloseTo(expectedVelocity.y, 2);

            // Should NOT have ship's velocity added
            expect(missile.velocity.x).not.toBeCloseTo(
                expectedVelocity.x + mockShip.velocity.x,
                2
            );
            expect(missile.velocity.y).not.toBeCloseTo(
                expectedVelocity.y + mockShip.velocity.y,
                2
            );
        });

        it("should begin accelerating immediately after creation", () => {
            // Switch to missiles
            gameState.unlockWeapon("missiles", "player");
            gameState.switchWeapon("missiles", "player");

            mockShip.rotation = Math.PI / 4; // 45 degrees

            // Fire missile
            weaponSystem.handleWeaponInput(
                mockShip,
                {
                    weapon1: false,
                    weapon2: false,
                    weapon3: false,
                    weapon4: false,
                    shoot: false,
                    shootPressed: true,
                },
                1000,
                InputContext.GAMEPLAY
            );

            const missiles = entityManager.getMissiles();
            expect(missiles).toHaveLength(1);

            const missile = missiles[0];
            const initialSpeed = Math.sqrt(
                missile.velocity.x * missile.velocity.x +
                    missile.velocity.y * missile.velocity.y
            );

            // Update missile physics for a small time step
            const deltaTime = 0.1; // 100ms
            weaponSystem.updateMissilePhysics(deltaTime);

            // Missile should have accelerated
            const newSpeed = Math.sqrt(
                missile.velocity.x * missile.velocity.x +
                    missile.velocity.y * missile.velocity.y
            );
            const expectedNewSpeed =
                initialSpeed + WEAPONS.MISSILES.ACCELERATION * deltaTime;

            expect(newSpeed).toBeCloseTo(expectedNewSpeed, 1);
            expect(newSpeed).toBeGreaterThan(initialSpeed);
        });

        it("should behave identically whether ship is stationary or moving", () => {
            // Switch to missiles
            gameState.unlockWeapon("missiles", "player");
            gameState.switchWeapon("missiles", "player");

            const testRotation = Math.PI / 3; // 60 degrees
            mockShip.rotation = testRotation;

            // Test 1: Fire missile from stationary ship
            mockShip.velocity = new Vector2(0, 0);
            weaponSystem.handleWeaponInput(
                mockShip,
                {
                    weapon1: false,
                    weapon2: false,
                    weapon3: false,
                    weapon4: false,
                    shoot: false,
                    shootPressed: true,
                },
                1000,
                InputContext.GAMEPLAY
            );

            const stationaryMissiles = entityManager.getMissiles();
            expect(stationaryMissiles).toHaveLength(1);
            const stationaryMissile = stationaryMissiles[0];

            // Clear missiles and test moving ship
            const missilesToRemove = entityManager.getMissiles();
            missilesToRemove.forEach((missile) =>
                entityManager.removeEntity(missile)
            );

            // Test 2: Fire missile from moving ship
            mockShip.velocity = new Vector2(75, -40); // ship has velocity
            weaponSystem.handleWeaponInput(
                mockShip,
                {
                    weapon1: false,
                    weapon2: false,
                    weapon3: false,
                    weapon4: false,
                    shoot: false,
                    shootPressed: true,
                },
                1000 + WEAPONS.MISSILES.FIRE_RATE + 100, // different time to avoid cooldown
                InputContext.GAMEPLAY
            );

            const movingMissiles = entityManager.getMissiles();
            expect(movingMissiles).toHaveLength(1);
            const movingMissile = movingMissiles[0];

            // Both missiles should have identical initial velocity (no inheritance)
            expect(movingMissile.velocity.x).toBeCloseTo(
                stationaryMissile.velocity.x,
                2
            );
            expect(movingMissile.velocity.y).toBeCloseTo(
                stationaryMissile.velocity.y,
                2
            );
        });
    });
});
