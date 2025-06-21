import { describe, it, expect, beforeEach } from "vitest";
import { AISystem } from "./AISystem";
import { EntityManager } from "./EntityManager";
import { GameState } from "./GameState";
import { Vector2 } from "~/utils/Vector2";
import type { Ship, GameEntity } from "~/entities";

describe("AISystem Gift Collection", () => {
    let aiSystem: AISystem;
    let entityManager: EntityManager;
    let gameState: GameState;
    let mockCanvas: HTMLCanvasElement;

    beforeEach(() => {
        mockCanvas = { width: 800, height: 600 } as HTMLCanvasElement;
        entityManager = new EntityManager(mockCanvas);
        gameState = new GameState();
        aiSystem = new AISystem(entityManager, gameState);
    });

    describe("shouldCollectGifts behavior", () => {
        it("should prevent AI companions from collecting gifts", () => {
            // Create a companion ship
            const companionShip: Ship = {
                position: new Vector2(100, 100),
                velocity: Vector2.zero(),
                size: new Vector2(20, 10),
                rotation: 0,
                color: "#00dd88",
                type: "ship",
                playerId: "companion_test_123",
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

            // Register the companion in game state
            gameState.addAICompanion("companion_test_123");

            // Add the companion to entity manager
            entityManager.addEntity(companionShip);

            // Test that shouldCollectGifts returns false for companions
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const shouldCollect = (aiSystem as any).shouldCollectGifts(
                companionShip,
                true
            );
            expect(shouldCollect).toBe(false);
        });

        it("should allow original computer player to collect gifts", () => {
            // Create original computer player ship
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

            // Add the computer player to entity manager
            entityManager.addEntity(computerShip);

            // Test that shouldCollectGifts can return true for computer player (if conditions are met)
            // Set low fuel to trigger collection behavior
            const computerState = gameState.getPlayerState("computer");
            if (computerState) {
                computerState.fuel = 20; // Low fuel should trigger gift collection
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const shouldCollect = (aiSystem as any).shouldCollectGifts(
                computerShip,
                false
            );
            expect(shouldCollect).toBe(true);
        });

        it("should not set collecting state for AI companions during decision making", () => {
            // Create a companion ship
            const companionShip: Ship = {
                position: new Vector2(100, 100),
                velocity: Vector2.zero(),
                size: new Vector2(20, 10),
                rotation: 0,
                color: "#00dd88",
                type: "ship",
                playerId: "companion_test_456",
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

            // Register the companion in game state
            gameState.addAICompanion("companion_test_456");

            // Add companion and a gift to entity manager
            entityManager.addEntity(companionShip);

            const gift: GameEntity = {
                position: new Vector2(120, 120), // Near the companion
                velocity: Vector2.zero(),
                size: new Vector2(20, 20),
                rotation: 0,
                color: "#ffff00",
                type: "gift",
                age: 0,
                giftType: "fuel_refill",
            };
            entityManager.addEntity(gift);

            // Make decisions
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (aiSystem as any).makeDecisions(companionShip, performance.now());

            // Companion should not be in collecting state even with gift present
            expect(companionShip.aiState).not.toBe("collecting");
        });

        it("should allow computer player to enter collecting state", () => {
            // Create original computer player ship
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

            // Add computer player to entity manager
            entityManager.addEntity(computerShip);

            // Set low fuel to trigger collection behavior
            const computerState = gameState.getPlayerState("computer");
            if (computerState) {
                computerState.fuel = 20; // Low fuel should trigger gift collection
            }

            // Add a gift
            const gift: GameEntity = {
                position: new Vector2(220, 220), // Near the computer player
                velocity: Vector2.zero(),
                size: new Vector2(20, 20),
                rotation: 0,
                color: "#ffff00",
                type: "gift",
                age: 0,
                giftType: "fuel_refill",
            };
            entityManager.addEntity(gift);

            // Make decisions
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (aiSystem as any).makeDecisions(computerShip, performance.now());

            // Computer player should be in collecting state with gift present and low fuel
            expect(computerShip.aiState).toBe("collecting");
        });
    });
});
