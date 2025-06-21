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
        } as unknown as AudioManager;

        particleSystem = {
            createAsteroidExplosion: vi.fn(),
            createGiftExplosion: vi.fn(),
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
});
