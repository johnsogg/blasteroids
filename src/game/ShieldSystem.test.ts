import { describe, it, expect, beforeEach, vi } from "vitest";
import { ShieldSystem } from "./ShieldSystem";
import { EntityManager } from "./EntityManager";
import { GameState } from "./GameState";
import { AudioManager } from "~/audio/AudioManager";
import { Vector2 } from "~/utils/Vector2";
import type { Ship, GameEntity } from "~/entities";
import { InputContext } from "~/input/InputContext";
import { SHIELD } from "~/config/constants";

// Mock dependencies
vi.mock("~/audio/AudioManager", () => ({
    AudioManager: vi.fn().mockImplementation(() => ({
        playShieldLoop: vi.fn().mockResolvedValue({ stop: vi.fn() }),
        playShieldRecharging: vi.fn().mockResolvedValue(undefined),
        playShieldCollision: vi.fn().mockResolvedValue(undefined),
    })),
}));

describe("ShieldSystem", () => {
    let shieldSystem: ShieldSystem;
    let entityManager: EntityManager;
    let gameState: GameState;
    let audioManager: AudioManager;
    let mockCanvas: HTMLCanvasElement;
    let ship: Ship;

    beforeEach(() => {
        mockCanvas = { width: 800, height: 600 } as HTMLCanvasElement;
        entityManager = new EntityManager(mockCanvas);
        gameState = new GameState();
        audioManager = new AudioManager();

        shieldSystem = new ShieldSystem(audioManager, gameState, entityManager);

        ship = {
            position: new Vector2(400, 300),
            velocity: new Vector2(100, 50),
            size: new Vector2(20, 20),
            rotation: 0,
            color: "#ffffff",
            type: "ship",
            playerId: "player",
            trail: [],
        };

        // Initialize game state with full fuel
        gameState.refillFuel();
    });

    describe("Shield Activation", () => {
        it("should activate shield when shield input is true", () => {
            shieldSystem.handleShieldInput(
                ship,
                {
                    shield: true,
                    shieldPressed: false,
                },
                0,
                InputContext.GAMEPLAY
            );

            expect(shieldSystem.isShieldActive(ship.playerId)).toBe(true);
        });

        it("should deactivate shield when shield input is false", () => {
            // First activate
            shieldSystem.handleShieldInput(
                ship,
                {
                    shield: true,
                    shieldPressed: false,
                },
                0,
                InputContext.GAMEPLAY
            );

            // Then deactivate
            shieldSystem.handleShieldInput(
                ship,
                {
                    shield: false,
                    shieldPressed: false,
                },
                1000,
                InputContext.GAMEPLAY
            );

            expect(shieldSystem.isShieldActive(ship.playerId)).toBe(false);
        });

        it("should not activate shield in non-gameplay contexts", () => {
            shieldSystem.handleShieldInput(
                ship,
                {
                    shield: true,
                    shieldPressed: false,
                },
                0,
                InputContext.MENU
            );

            expect(shieldSystem.isShieldActive(ship.playerId)).toBe(false);
        });
    });

    describe("Shield Audio", () => {
        it("should play shield loop sound when activating shield", () => {
            const playShieldLoopSpy = vi.spyOn(audioManager, "playShieldLoop");

            shieldSystem.handleShieldInput(
                ship,
                {
                    shield: true,
                    shieldPressed: true,
                },
                0,
                InputContext.GAMEPLAY
            );

            expect(playShieldLoopSpy).toHaveBeenCalled();
        });

        it("should play recharging sound when activating shield in recharging mode", () => {
            const playShieldRechargingSpy = vi.spyOn(
                audioManager,
                "playShieldRecharging"
            );

            // First activate shield and cause collision to enter recharging mode
            shieldSystem.handleShieldInput(
                ship,
                {
                    shield: true,
                    shieldPressed: true,
                },
                0,
                InputContext.GAMEPLAY
            );

            // Simulate collision to trigger recharging mode
            const asteroid = {
                position: new Vector2(400, 300),
                velocity: new Vector2(-50, -25),
                size: new Vector2(40, 40),
                rotation: 0,
                color: "#888888",
                type: "asteroid",
            } as GameEntity & { asteroidSize?: string };
            asteroid.asteroidSize = "large";

            shieldSystem.handleShieldCollision(ship, asteroid, 0);

            // Now try to activate shield again (should be in recharging mode)
            shieldSystem.handleShieldInput(
                ship,
                {
                    shield: true,
                    shieldPressed: true,
                },
                1000,
                InputContext.GAMEPLAY
            );

            expect(playShieldRechargingSpy).toHaveBeenCalled();
        });

        it("should play collision sound when shield collides with asteroid", () => {
            const playShieldCollisionSpy = vi.spyOn(
                audioManager,
                "playShieldCollision"
            );

            // Activate shield first
            shieldSystem.handleShieldInput(
                ship,
                {
                    shield: true,
                    shieldPressed: false,
                },
                0,
                InputContext.GAMEPLAY
            );

            const asteroid = {
                position: new Vector2(400, 300),
                velocity: new Vector2(-50, -25),
                size: new Vector2(40, 40),
                rotation: 0,
                color: "#888888",
                type: "asteroid",
            } as GameEntity & { asteroidSize?: string };
            asteroid.asteroidSize = "large";

            shieldSystem.handleShieldCollision(ship, asteroid, 0);

            expect(playShieldCollisionSpy).toHaveBeenCalled();
        });
    });

    describe("Shield Collision", () => {
        beforeEach(() => {
            // Activate shield for collision tests
            shieldSystem.handleShieldInput(
                ship,
                {
                    shield: true,
                    shieldPressed: false,
                },
                0,
                InputContext.GAMEPLAY
            );
        });

        it("should handle collision with large asteroid", () => {
            const asteroid = {
                position: new Vector2(420, 320),
                velocity: new Vector2(-50, -25),
                size: new Vector2(40, 40),
                rotation: 0,
                color: "#888888",
                type: "asteroid",
            } as GameEntity & { asteroidSize?: string };
            asteroid.asteroidSize = "large";

            const initialFuel = gameState.fuel;
            const initialShipVelocity = ship.velocity.copy();
            const initialAsteroidVelocity = asteroid.velocity.copy();

            shieldSystem.handleShieldCollision(ship, asteroid, 0);

            // Check fuel consumption (large asteroid consumes more fuel)
            expect(gameState.fuel).toBeLessThan(initialFuel);
            expect(gameState.fuel).toBe(initialFuel - 20); // Should consume 20 fuel for large asteroid

            // Check that both ship and asteroid velocities changed (bouncing)
            expect(ship.velocity.x).not.toBe(initialShipVelocity.x);
            expect(ship.velocity.y).not.toBe(initialShipVelocity.y);
            expect(asteroid.velocity.x).not.toBe(initialAsteroidVelocity.x);
            expect(asteroid.velocity.y).not.toBe(initialAsteroidVelocity.y);

            // Check that shield is now in recharging mode
            expect(shieldSystem.isShieldRecharging(ship.playerId)).toBe(true);
        });

        it("should handle collision with medium asteroid", () => {
            const asteroid = {
                position: new Vector2(400, 300),
                velocity: new Vector2(-50, -25),
                size: new Vector2(20, 20),
                rotation: 0,
                color: "#888888",
                type: "asteroid",
            } as GameEntity & { asteroidSize?: string };
            asteroid.asteroidSize = "medium";

            const initialFuel = gameState.fuel;

            shieldSystem.handleShieldCollision(ship, asteroid, 0);

            // Medium asteroid should consume less fuel than large
            expect(gameState.fuel).toBe(initialFuel - 10);
        });

        it("should handle collision with small asteroid", () => {
            const asteroid = {
                position: new Vector2(400, 300),
                velocity: new Vector2(-50, -25),
                size: new Vector2(10, 10),
                rotation: 0,
                color: "#888888",
                type: "asteroid",
            } as GameEntity & { asteroidSize?: string };
            asteroid.asteroidSize = "small";

            const initialFuel = gameState.fuel;

            shieldSystem.handleShieldCollision(ship, asteroid, 0);

            // Small asteroid should consume least fuel
            expect(gameState.fuel).toBe(initialFuel - 5);
        });

        it("should not consume fuel if shield is not active", () => {
            // Deactivate shield
            shieldSystem.handleShieldInput(
                ship,
                {
                    shield: false,
                    shieldPressed: false,
                },
                1000,
                InputContext.GAMEPLAY
            );

            const asteroid = {
                position: new Vector2(400, 300),
                velocity: new Vector2(-50, -25),
                size: new Vector2(40, 40),
                rotation: 0,
                color: "#888888",
                type: "asteroid",
            } as GameEntity & { asteroidSize?: string };
            asteroid.asteroidSize = "large";

            const initialFuel = gameState.fuel;

            shieldSystem.handleShieldCollision(ship, asteroid, 0);

            // No fuel should be consumed
            expect(gameState.fuel).toBe(initialFuel);
        });
    });

    describe("Shield Recharging", () => {
        it("should enter recharging mode after collision", () => {
            // Activate shield
            shieldSystem.handleShieldInput(
                ship,
                {
                    shield: true,
                    shieldPressed: false,
                },
                0,
                InputContext.GAMEPLAY
            );

            const asteroid = {
                position: new Vector2(400, 300),
                velocity: new Vector2(-50, -25),
                size: new Vector2(40, 40),
                rotation: 0,
                color: "#888888",
                type: "asteroid",
            } as GameEntity & { asteroidSize?: string };
            asteroid.asteroidSize = "large";

            expect(shieldSystem.isShieldRecharging(ship.playerId)).toBe(false);

            shieldSystem.handleShieldCollision(ship, asteroid, 0);

            expect(shieldSystem.isShieldRecharging(ship.playerId)).toBe(true);
        });

        it("should exit recharging mode after 10 seconds", () => {
            // Activate shield and cause collision
            shieldSystem.handleShieldInput(
                ship,
                {
                    shield: true,
                    shieldPressed: false,
                },
                0,
                InputContext.GAMEPLAY
            );

            const asteroid = {
                position: new Vector2(400, 300),
                velocity: new Vector2(-50, -25),
                size: new Vector2(40, 40),
                rotation: 0,
                color: "#888888",
                type: "asteroid",
            } as GameEntity & { asteroidSize?: string };
            asteroid.asteroidSize = "large";

            shieldSystem.handleShieldCollision(ship, asteroid, 0);
            expect(shieldSystem.isShieldRecharging(ship.playerId)).toBe(true);

            // Update after 10 seconds
            shieldSystem.update(10000);

            expect(shieldSystem.isShieldRecharging(ship.playerId)).toBe(false);
        });

        it("should still be recharging before 10 seconds elapsed", () => {
            // Activate shield and cause collision
            shieldSystem.handleShieldInput(
                ship,
                {
                    shield: true,
                    shieldPressed: false,
                },
                0,
                InputContext.GAMEPLAY
            );

            const asteroid = {
                position: new Vector2(400, 300),
                velocity: new Vector2(-50, -25),
                size: new Vector2(40, 40),
                rotation: 0,
                color: "#888888",
                type: "asteroid",
            } as GameEntity & { asteroidSize?: string };
            asteroid.asteroidSize = "large";

            shieldSystem.handleShieldCollision(ship, asteroid, 0);

            // Update after 5 seconds (not enough time)
            shieldSystem.update(5000);

            expect(shieldSystem.isShieldRecharging(ship.playerId)).toBe(true);
        });
    });

    describe("Shield Movement Effects", () => {
        it("should return slowdown factor when shield is active", () => {
            shieldSystem.handleShieldInput(
                ship,
                {
                    shield: true,
                    shieldPressed: false,
                },
                0,
                InputContext.GAMEPLAY
            );

            const slowdownFactor = shieldSystem.getMovementSlowdownFactor(
                ship.playerId
            );
            expect(slowdownFactor).toBeLessThan(1.0);
            expect(slowdownFactor).toBe(0.5); // 50% slowdown
        });

        it("should return normal factor when shield is not active", () => {
            const slowdownFactor = shieldSystem.getMovementSlowdownFactor(
                ship.playerId
            );
            expect(slowdownFactor).toBe(1.0); // No slowdown
        });

        it("should return slowdown factor when shield is recharging and active", () => {
            // Activate shield and cause collision
            shieldSystem.handleShieldInput(
                ship,
                {
                    shield: true,
                    shieldPressed: false,
                },
                0,
                InputContext.GAMEPLAY
            );

            const asteroid = {
                position: new Vector2(400, 300),
                velocity: new Vector2(-50, -25),
                size: new Vector2(40, 40),
                rotation: 0,
                color: "#888888",
                type: "asteroid",
            } as GameEntity & { asteroidSize?: string };
            asteroid.asteroidSize = "large";

            shieldSystem.handleShieldCollision(ship, asteroid, 0);

            // Shield should still slow down movement even when recharging
            const slowdownFactor = shieldSystem.getMovementSlowdownFactor(
                ship.playerId
            );
            expect(slowdownFactor).toBe(0.5);
        });
    });

    describe("Shield State Management", () => {
        it("should reset shield state", () => {
            // Activate shield and cause collision
            shieldSystem.handleShieldInput(
                ship,
                {
                    shield: true,
                    shieldPressed: false,
                },
                0,
                InputContext.GAMEPLAY
            );

            const asteroid = {
                position: new Vector2(400, 300),
                velocity: new Vector2(-50, -25),
                size: new Vector2(40, 40),
                rotation: 0,
                color: "#888888",
                type: "asteroid",
            } as GameEntity & { asteroidSize?: string };
            asteroid.asteroidSize = "large";

            shieldSystem.handleShieldCollision(ship, asteroid, 0);

            expect(shieldSystem.isShieldActive(ship.playerId)).toBe(true);
            expect(shieldSystem.isShieldRecharging(ship.playerId)).toBe(true);

            shieldSystem.resetShieldState();

            expect(shieldSystem.isShieldActive(ship.playerId)).toBe(false);
            expect(shieldSystem.isShieldRecharging(ship.playerId)).toBe(false);
        });

        it("should handle multiple players", () => {
            const computerShip: Ship = {
                position: new Vector2(200, 150),
                velocity: Vector2.zero(),
                size: new Vector2(20, 20),
                rotation: 0,
                color: "#ff0000",
                type: "ship",
                playerId: "computer",
                trail: [],
            };

            // Activate shield for player
            shieldSystem.handleShieldInput(
                ship,
                {
                    shield: true,
                    shieldPressed: false,
                },
                0,
                InputContext.GAMEPLAY
            );

            // Activate shield for computer
            shieldSystem.handleShieldInput(
                computerShip,
                {
                    shield: true,
                    shieldPressed: false,
                },
                0,
                InputContext.GAMEPLAY
            );

            expect(shieldSystem.isShieldActive("player")).toBe(true);
            expect(shieldSystem.isShieldActive("computer")).toBe(true);

            // Deactivate only player shield
            shieldSystem.handleShieldInput(
                ship,
                {
                    shield: false,
                    shieldPressed: false,
                },
                1000,
                InputContext.GAMEPLAY
            );

            expect(shieldSystem.isShieldActive("player")).toBe(false);
            expect(shieldSystem.isShieldActive("computer")).toBe(true);
        });
    });

    describe("Shield Rendering", () => {
        it("should provide shield info for rendering", () => {
            shieldSystem.handleShieldInput(
                ship,
                {
                    shield: true,
                    shieldPressed: false,
                },
                0,
                InputContext.GAMEPLAY
            );

            const shieldInfo = shieldSystem.getShieldRenderInfo(ship.playerId);
            expect(shieldInfo).toBeDefined();
            expect(shieldInfo?.isActive).toBe(true);
            expect(shieldInfo?.isRecharging).toBe(false);
        });

        it("should return null for inactive shield", () => {
            const shieldInfo = shieldSystem.getShieldRenderInfo(ship.playerId);
            expect(shieldInfo).toBeNull();
        });
    });

    describe("Edge Cases", () => {
        it("should handle collision when shield has no fuel to consume", () => {
            // Drain all fuel
            gameState.consumeFuel(gameState.fuel);

            shieldSystem.handleShieldInput(
                ship,
                {
                    shield: true,
                    shieldPressed: false,
                },
                0,
                InputContext.GAMEPLAY
            );

            const asteroid = {
                position: new Vector2(400, 300),
                velocity: new Vector2(-50, -25),
                size: new Vector2(40, 40),
                rotation: 0,
                color: "#888888",
                type: "asteroid",
            } as GameEntity & { asteroidSize?: string };
            asteroid.asteroidSize = "large";

            // Should not crash even with no fuel
            expect(() => {
                shieldSystem.handleShieldCollision(ship, asteroid, 0);
            }).not.toThrow();

            // Shield should still enter recharging mode
            expect(shieldSystem.isShieldRecharging(ship.playerId)).toBe(true);
        });

        it("should handle unknown asteroid size", () => {
            shieldSystem.handleShieldInput(
                ship,
                {
                    shield: true,
                    shieldPressed: false,
                },
                0,
                InputContext.GAMEPLAY
            );

            const asteroid: GameEntity = {
                position: new Vector2(400, 300),
                velocity: new Vector2(-50, -25),
                size: new Vector2(30, 30),
                rotation: 0,
                color: "#888888",
                type: "asteroid",
                // No asteroidSize property
            };

            const initialFuel = gameState.fuel;

            expect(() => {
                shieldSystem.handleShieldCollision(ship, asteroid, 0);
            }).not.toThrow();

            // Should use default fuel consumption
            expect(gameState.fuel).toBeLessThan(initialFuel);
        });
    });

    describe("Bug Confirmation Tests", () => {
        it("BUG: should apply movement slowdown when shield is active", () => {
            // Test without shield first
            const normalFactor = shieldSystem.getMovementSlowdownFactor(
                ship.playerId
            );
            expect(normalFactor).toBe(1.0);

            // Activate shield
            shieldSystem.handleShieldInput(
                ship,
                {
                    shield: true,
                    shieldPressed: true,
                },
                0,
                InputContext.GAMEPLAY
            );

            // Get slowdown factor
            const slowdownFactor = shieldSystem.getMovementSlowdownFactor(
                ship.playerId
            );

            // Should be slowed down (0.5 = 50% speed)
            expect(slowdownFactor).toBe(0.5);
            expect(slowdownFactor).toBeLessThan(1.0);

            // Deactivate shield
            shieldSystem.handleShieldInput(
                ship,
                {
                    shield: false,
                    shieldPressed: false,
                },
                0,
                InputContext.GAMEPLAY
            );

            // Should be back to normal
            const normalFactorAgain = shieldSystem.getMovementSlowdownFactor(
                ship.playerId
            );
            expect(normalFactorAgain).toBe(1.0);
        });

        it("BUG: should exit recharging mode after exactly 10 seconds", () => {
            // Activate shield
            shieldSystem.handleShieldInput(
                ship,
                {
                    shield: true,
                    shieldPressed: true,
                },
                0,
                InputContext.GAMEPLAY
            );

            // Create collision to trigger recharging
            const asteroid = {
                position: new Vector2(400, 300),
                velocity: new Vector2(-50, -25),
                size: new Vector2(40, 40),
                rotation: 0,
                color: "#888888",
                type: "asteroid",
            } as GameEntity & { asteroidSize?: string };
            asteroid.asteroidSize = "large";

            const collisionTime = 1000; // Start at 1 second
            shieldSystem.handleShieldCollision(ship, asteroid, collisionTime);

            // Should be recharging
            expect(shieldSystem.isShieldRecharging(ship.playerId)).toBe(true);

            // Update at 9.9 seconds - should still be recharging
            shieldSystem.update(collisionTime + 9900);
            expect(shieldSystem.isShieldRecharging(ship.playerId)).toBe(true);

            // Update at exactly 10 seconds - should exit recharging
            shieldSystem.update(collisionTime + 10000);
            expect(shieldSystem.isShieldRecharging(ship.playerId)).toBe(false);

            // Update at 10.1 seconds - should still not be recharging
            shieldSystem.update(collisionTime + 10100);
            expect(shieldSystem.isShieldRecharging(ship.playerId)).toBe(false);
        });

        it("BUG: should exit recharging mode using Date.now() timing like in game", () => {
            // This test uses actual Date.now() timing like CollisionSystem does
            // Activate shield
            shieldSystem.handleShieldInput(
                ship,
                {
                    shield: true,
                    shieldPressed: true,
                },
                0,
                InputContext.GAMEPLAY
            );

            // Create collision to trigger recharging (using Date.now() like CollisionSystem)
            const asteroid = {
                position: new Vector2(400, 300),
                velocity: new Vector2(-50, -25),
                size: new Vector2(40, 40),
                rotation: 0,
                color: "#888888",
                type: "asteroid",
            } as GameEntity & { asteroidSize?: string };
            asteroid.asteroidSize = "large";

            // This simulates how CollisionSystem calls handleShieldCollision
            shieldSystem.handleShieldCollision(ship, asteroid); // Uses Date.now() internally

            // Should be recharging
            expect(shieldSystem.isShieldRecharging(ship.playerId)).toBe(true);

            // Create a fake current time for testing
            const mockCurrentTime = Date.now() + 10001; // 10.001 seconds later
            shieldSystem.update(mockCurrentTime);

            // After 10+ seconds, should exit recharging
            expect(shieldSystem.isShieldRecharging(ship.playerId)).toBe(false);
        });

        it("FIXED: consistent timing between collision and updates", () => {
            // This test verifies the timing fix using consistent performance.now()
            // Activate shield
            shieldSystem.handleShieldInput(
                ship,
                {
                    shield: true,
                    shieldPressed: true,
                },
                0,
                InputContext.GAMEPLAY
            );

            // Create collision to trigger recharging using performance.now() like fixed CollisionSystem
            const asteroid = {
                position: new Vector2(400, 300),
                velocity: new Vector2(-50, -25),
                size: new Vector2(40, 40),
                rotation: 0,
                color: "#888888",
                type: "asteroid",
            } as GameEntity & { asteroidSize?: string };
            asteroid.asteroidSize = "large";

            const collisionTime = performance.now();
            shieldSystem.handleShieldCollision(ship, asteroid, collisionTime);

            // Should be recharging
            expect(shieldSystem.isShieldRecharging(ship.playerId)).toBe(true);

            // Now use the same timing source for updates
            const gameUpdateTime = collisionTime + 10001; // 10+ seconds later
            shieldSystem.update(gameUpdateTime);

            // Should now exit recharging mode correctly
            expect(shieldSystem.isShieldRecharging(ship.playerId)).toBe(false);
        });

        it("BUG: should not provide protection when shield is recharging", () => {
            // This test would need to be implemented with CollisionSystem integration
            // For now, we'll test the state conditions

            // Activate shield
            shieldSystem.handleShieldInput(
                ship,
                {
                    shield: true,
                    shieldPressed: true,
                },
                0,
                InputContext.GAMEPLAY
            );

            // Create collision to trigger recharging
            const asteroid = {
                position: new Vector2(400, 300),
                velocity: new Vector2(-50, -25),
                size: new Vector2(40, 40),
                rotation: 0,
                color: "#888888",
                type: "asteroid",
            } as GameEntity & { asteroidSize?: string };
            asteroid.asteroidSize = "large";

            shieldSystem.handleShieldCollision(ship, asteroid, 0);

            // Now shield is active but recharging
            expect(shieldSystem.isShieldActive(ship.playerId)).toBe(true);
            expect(shieldSystem.isShieldRecharging(ship.playerId)).toBe(true);

            // The CollisionSystem should check BOTH conditions:
            // isShieldActive() AND !isShieldRecharging()
            // Currently it only checks isShieldActive(), which is the bug
        });
    });

    describe("Shield Visual Configuration", () => {
        it("should have correct radius offset constant", () => {
            // Test that the shield radius offset is increased from the original 5 pixels
            expect(SHIELD.RADIUS_OFFSET).toBe(20);
            expect(SHIELD.RADIUS_OFFSET).toBeGreaterThan(5); // Much bigger than original
        });

        it("should have different stroke widths for charged vs recharging", () => {
            // Test that stroke widths are different for visual feedback
            expect(SHIELD.STROKE_WIDTH_CHARGED).toBe(5);
            expect(SHIELD.STROKE_WIDTH_RECHARGING).toBe(3);
            expect(SHIELD.STROKE_WIDTH_CHARGED).toBeGreaterThan(
                SHIELD.STROKE_WIDTH_RECHARGING
            );
        });
    });
});
