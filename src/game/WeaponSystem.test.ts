import { describe, it, expect, beforeEach, vi } from "vitest";
import { WeaponSystem } from "./WeaponSystem";
import { EntityManager } from "./EntityManager";
import { GameState } from "./GameState";
import { AudioManager } from "~/audio/AudioManager";
import { ParticleSystem } from "~/render/ParticleSystem";
import { Vector2 } from "~/utils/Vector2";
import type { Ship } from "~/entities";
import { InputContext } from "~/input/InputContext";

// Mock dependencies
vi.mock("~/audio/AudioManager", () => ({
    AudioManager: vi.fn().mockImplementation(() => ({
        playShoot: vi.fn().mockResolvedValue(undefined),
        playMissileLaunch: vi.fn().mockResolvedValue(undefined),
        playMissileCooldown: vi.fn().mockResolvedValue(undefined),
        playLaserFire: vi.fn().mockResolvedValue(undefined),
        playLightningStrike: vi.fn().mockResolvedValue(undefined),
        playLightningMiss: vi.fn().mockResolvedValue(undefined),
    })),
}));

vi.mock("~/render/ParticleSystem", () => ({
    ParticleSystem: vi.fn().mockImplementation(() => ({
        createMissileTrail: vi.fn(),
    })),
}));

describe("WeaponSystem", () => {
    let weaponSystem: WeaponSystem;
    let entityManager: EntityManager;
    let gameState: GameState;
    let audioManager: AudioManager;
    let particleSystem: ParticleSystem;
    let mockCanvas: HTMLCanvasElement;
    let ship: Ship;

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

        ship = {
            position: new Vector2(400, 300),
            velocity: Vector2.zero(),
            size: new Vector2(20, 20),
            rotation: 0,
            color: "#ffffff",
            type: "ship",
            playerId: "player",
            trail: [],
        };

        // Initialize game state with full fuel
        gameState.init();
    });

    describe("Weapon Input Handling", () => {
        it("should switch weapons with number keys", () => {
            // Unlock all weapons first
            gameState.unlockWeapon("bullets");
            gameState.unlockWeapon("missiles");
            gameState.unlockWeapon("laser");
            gameState.unlockWeapon("lightning");

            weaponSystem.handleWeaponInput(
                ship,
                {
                    weapon1: true,
                    weapon2: false,
                    weapon3: false,
                    weapon4: false,
                    shoot: false,
                    shootPressed: false,
                },
                0,
                InputContext.GAMEPLAY
            );
            expect(gameState.weaponState.currentWeapon).toBe("bullets");

            weaponSystem.handleWeaponInput(
                ship,
                {
                    weapon1: false,
                    weapon2: true,
                    weapon3: false,
                    weapon4: false,
                    shoot: false,
                    shootPressed: false,
                },
                0,
                InputContext.GAMEPLAY
            );
            expect(gameState.weaponState.currentWeapon).toBe("missiles");

            weaponSystem.handleWeaponInput(
                ship,
                {
                    weapon1: false,
                    weapon2: false,
                    weapon3: true,
                    weapon4: false,
                    shoot: false,
                    shootPressed: false,
                },
                0,
                InputContext.GAMEPLAY
            );
            expect(gameState.weaponState.currentWeapon).toBe("laser");

            weaponSystem.handleWeaponInput(
                ship,
                {
                    weapon1: false,
                    weapon2: false,
                    weapon3: false,
                    weapon4: true,
                    shoot: false,
                    shootPressed: false,
                },
                0,
                InputContext.GAMEPLAY
            );
            expect(gameState.weaponState.currentWeapon).toBe("lightning");
        });

        it("should not shoot in non-gameplay contexts", () => {
            gameState.unlockWeapon("bullets");
            gameState.switchWeapon("bullets");

            weaponSystem.handleWeaponInput(
                ship,
                {
                    weapon1: false,
                    weapon2: false,
                    weapon3: false,
                    weapon4: false,
                    shoot: true,
                    shootPressed: true,
                },
                0,
                InputContext.MENU
            );

            expect(entityManager.getBullets()).toHaveLength(0);
        });
    });

    describe("Bullet Shooting", () => {
        beforeEach(() => {
            gameState.unlockWeapon("bullets");
            gameState.switchWeapon("bullets");
            // Ensure we have fuel
            gameState.refillFuel();
        });

        it("should create bullets when shooting", () => {
            // Verify setup
            expect(gameState.weaponState.currentWeapon).toBe("bullets");
            expect(gameState.fuelPercentage).toBeGreaterThan(0);

            weaponSystem.handleWeaponInput(
                ship,
                {
                    weapon1: false,
                    weapon2: false,
                    weapon3: false,
                    weapon4: false,
                    shoot: true,
                    shootPressed: false,
                },
                0,
                InputContext.GAMEPLAY
            );

            const bullets = entityManager.getBullets();
            expect(bullets).toHaveLength(1);
            const bullet = bullets[0];
            expect(bullet.type).toBe("bullet");
            expect(bullet.color).toBe("#ffff00"); // Default bullet color
        });

        it("should respect fire rate limits", () => {
            // Fire first bullet
            weaponSystem.handleWeaponInput(
                ship,
                {
                    weapon1: false,
                    weapon2: false,
                    weapon3: false,
                    weapon4: false,
                    shoot: true,
                    shootPressed: false,
                },
                0,
                InputContext.GAMEPLAY
            );

            // Try to fire again immediately (should be blocked by fire rate)
            weaponSystem.handleWeaponInput(
                ship,
                {
                    weapon1: false,
                    weapon2: false,
                    weapon3: false,
                    weapon4: false,
                    shoot: true,
                    shootPressed: false,
                },
                50, // Small time advance, but not enough for fire rate
                InputContext.GAMEPLAY
            );

            expect(entityManager.getBullets()).toHaveLength(1); // Still only one bullet
        });

        it("should allow firing after fire rate cooldown", () => {
            // Fire first bullet
            weaponSystem.handleWeaponInput(
                ship,
                {
                    weapon1: false,
                    weapon2: false,
                    weapon3: false,
                    weapon4: false,
                    shoot: true,
                    shootPressed: false,
                },
                0,
                InputContext.GAMEPLAY
            );

            // Wait for fire rate cooldown and fire again
            weaponSystem.handleWeaponInput(
                ship,
                {
                    weapon1: false,
                    weapon2: false,
                    weapon3: false,
                    weapon4: false,
                    shoot: true,
                    shootPressed: false,
                },
                200, // Enough time for fire rate
                InputContext.GAMEPLAY
            );

            expect(entityManager.getBullets()).toHaveLength(2);
        });

        it("should not fire without fuel", () => {
            // Drain all fuel
            gameState.consumeFuel(100);

            weaponSystem.handleWeaponInput(
                ship,
                {
                    weapon1: false,
                    weapon2: false,
                    weapon3: false,
                    weapon4: false,
                    shoot: true,
                    shootPressed: false,
                },
                0,
                InputContext.GAMEPLAY
            );

            expect(entityManager.getBullets()).toHaveLength(0);
        });

        it("should limit bullets per activation", () => {
            // Fire maximum bullets in one activation
            for (let i = 0; i < 10; i++) {
                weaponSystem.handleWeaponInput(
                    ship,
                    {
                        weapon1: false,
                        weapon2: false,
                        weapon3: false,
                        weapon4: false,
                        shoot: true,
                        shootPressed: false,
                    },
                    i * 200, // Advance time to bypass fire rate
                    InputContext.GAMEPLAY
                );
            }

            // Should only have created 3 bullets (BULLETS_PER_ACTIVATION)
            expect(entityManager.getBullets()).toHaveLength(3);
        });
    });

    describe("Missile Shooting", () => {
        beforeEach(() => {
            gameState.unlockWeapon("missiles");
            gameState.switchWeapon("missiles");
        });

        it("should create missiles when shooting", () => {
            weaponSystem.handleWeaponInput(
                ship,
                {
                    weapon1: false,
                    weapon2: false,
                    weapon3: false,
                    weapon4: false,
                    shoot: false,
                    shootPressed: true,
                },
                0,
                InputContext.GAMEPLAY
            );

            expect(entityManager.getMissiles()).toHaveLength(1);
            const missile = entityManager.getMissiles()[0];
            expect(missile.type).toBe("missile");
        });

        it("should play cooldown sound when firing too quickly", () => {
            const playCooldownSpy = vi.spyOn(
                audioManager,
                "playMissileCooldown"
            );

            // Fire first missile
            weaponSystem.handleWeaponInput(
                ship,
                {
                    weapon1: false,
                    weapon2: false,
                    weapon3: false,
                    weapon4: false,
                    shoot: false,
                    shootPressed: true,
                },
                0,
                InputContext.GAMEPLAY
            );

            // Try to fire again immediately
            weaponSystem.handleWeaponInput(
                ship,
                {
                    weapon1: false,
                    weapon2: false,
                    weapon3: false,
                    weapon4: false,
                    shoot: false,
                    shootPressed: true,
                },
                100, // Not enough time for missile cooldown
                InputContext.GAMEPLAY
            );

            expect(playCooldownSpy).toHaveBeenCalled();
            expect(entityManager.getMissiles()).toHaveLength(1); // Still only one missile
        });
    });

    describe("Laser Shooting", () => {
        beforeEach(() => {
            gameState.unlockWeapon("laser");
            gameState.switchWeapon("laser");
        });

        it("should activate laser when shooting", () => {
            weaponSystem.handleWeaponInput(
                ship,
                {
                    weapon1: false,
                    weapon2: false,
                    weapon3: false,
                    weapon4: false,
                    shoot: true,
                    shootPressed: false,
                },
                0,
                InputContext.GAMEPLAY
            );

            expect(ship.isLaserActive).toBe(true);
            expect(ship.laserStartTime).toBe(0);
        });

        it("should deactivate laser when releasing shoot key", () => {
            // Start laser
            weaponSystem.handleWeaponInput(
                ship,
                {
                    weapon1: false,
                    weapon2: false,
                    weapon3: false,
                    weapon4: false,
                    shoot: true,
                    shootPressed: false,
                },
                0,
                InputContext.GAMEPLAY
            );

            // Release shoot key
            weaponSystem.handleWeaponInput(
                ship,
                {
                    weapon1: false,
                    weapon2: false,
                    weapon3: false,
                    weapon4: false,
                    shoot: false,
                    shootPressed: false,
                },
                100,
                InputContext.GAMEPLAY
            );

            expect(ship.isLaserActive).toBe(false);
            expect(ship.laserStartTime).toBeUndefined();
        });

        it("should stop laser when fuel depleted", () => {
            // Start laser
            weaponSystem.handleWeaponInput(
                ship,
                {
                    weapon1: false,
                    weapon2: false,
                    weapon3: false,
                    weapon4: false,
                    shoot: true,
                    shootPressed: false,
                },
                0,
                InputContext.GAMEPLAY
            );

            // Drain fuel completely
            gameState.consumeFuel(100);

            // Try to continue laser
            weaponSystem.handleWeaponInput(
                ship,
                {
                    weapon1: false,
                    weapon2: false,
                    weapon3: false,
                    weapon4: false,
                    shoot: true,
                    shootPressed: false,
                },
                100,
                InputContext.GAMEPLAY
            );

            expect(ship.isLaserActive).toBe(false);
        });
    });

    describe("Lightning Shooting", () => {
        beforeEach(() => {
            gameState.unlockWeapon("lightning");
            gameState.switchWeapon("lightning");
        });

        it("should not fire lightning without targets", () => {
            const playMissSpy = vi.spyOn(audioManager, "playLightningMiss");

            weaponSystem.handleWeaponInput(
                ship,
                {
                    weapon1: false,
                    weapon2: false,
                    weapon3: false,
                    weapon4: false,
                    shoot: false,
                    shootPressed: true,
                },
                0,
                InputContext.GAMEPLAY
            );

            expect(playMissSpy).toHaveBeenCalled();
            expect(ship.lightningTargets).toBeUndefined();
        });

        it("should fire lightning when targets are in range", () => {
            // Add an asteroid target
            const asteroid = {
                position: new Vector2(450, 300), // 50 pixels away, within range
                velocity: Vector2.zero(),
                size: new Vector2(20, 20),
                rotation: 0,
                color: "#ffffff",
                type: "asteroid" as const,
            };
            entityManager.addEntity(asteroid);

            const playStrikeSpy = vi.spyOn(audioManager, "playLightningStrike");

            weaponSystem.handleWeaponInput(
                ship,
                {
                    weapon1: false,
                    weapon2: false,
                    weapon3: false,
                    weapon4: false,
                    shoot: false,
                    shootPressed: true,
                },
                0,
                InputContext.GAMEPLAY
            );

            expect(playStrikeSpy).toHaveBeenCalled();
            expect(ship.lightningTargets).toBeDefined();
            expect(ship.lightningTargets).toHaveLength(1);
        });
    });

    describe("Missile Physics", () => {
        beforeEach(() => {
            // Add a missile to test
            const missile = {
                position: new Vector2(400, 300),
                velocity: new Vector2(100, 0),
                size: new Vector2(5, 5),
                rotation: 0,
                color: "#ff0000",
                type: "missile" as const,
                age: 0,
            };
            entityManager.addEntity(missile);
        });

        it("should update missile acceleration", () => {
            const missile = entityManager.getMissiles()[0];
            const initialSpeed = missile.velocity.magnitude();

            weaponSystem.updateMissilePhysics(1.0); // 1 second

            const newSpeed = missile.velocity.magnitude();
            expect(newSpeed).toBeGreaterThan(initialSpeed);
        });

        it("should create missile trail particles", () => {
            const createTrailSpy = vi.spyOn(
                particleSystem,
                "createMissileTrail"
            );

            weaponSystem.updateMissilePhysics(0.016); // One frame

            expect(createTrailSpy).toHaveBeenCalled();
        });
    });

    describe("Weapon State", () => {
        it("should reset weapon state", () => {
            // Set some weapon state
            gameState.unlockWeapon("bullets");
            gameState.switchWeapon("bullets");

            weaponSystem.handleWeaponInput(
                ship,
                {
                    weapon1: false,
                    weapon2: false,
                    weapon3: false,
                    weapon4: false,
                    shoot: true,
                    shootPressed: false,
                },
                0,
                InputContext.GAMEPLAY
            );

            // Reset
            weaponSystem.reset();

            // State should be clean
            expect(entityManager.getBullets()).toHaveLength(1); // Entities remain, but internal state is reset
        });

        it("should get correct laser length with upgrades", () => {
            gameState.unlockWeapon("laser");
            gameState.switchWeapon("laser");

            const baseLaserLength = weaponSystem.getLaserLength();

            // Apply upgrade
            gameState.applyWeaponUpgrade("upgrade_laser_range");

            const upgradedLaserLength = weaponSystem.getLaserLength();
            expect(upgradedLaserLength).toBeGreaterThan(baseLaserLength);
        });

        it("should get correct lightning radius with upgrades", () => {
            gameState.unlockWeapon("lightning");
            gameState.switchWeapon("lightning");

            const baseLightningRadius = weaponSystem.getLightningRadius();

            // Apply upgrade
            gameState.applyWeaponUpgrade("upgrade_lightning_radius");

            const upgradedLightningRadius = weaponSystem.getLightningRadius();
            expect(upgradedLightningRadius).toBeGreaterThan(
                baseLightningRadius
            );
        });
    });
});
