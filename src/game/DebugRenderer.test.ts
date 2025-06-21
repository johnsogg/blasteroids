import { describe, it, expect, beforeEach, vi } from "vitest";
import { DebugRenderer } from "./DebugRenderer";
import { EntityManager } from "./EntityManager";
import { GameState } from "./GameState";
import { ScaleManager } from "~/utils/ScaleManager";
import { Vector2 } from "~/utils/Vector2";
import type { GameEntity } from "~/entities";

// Mock dependencies
vi.mock("~/audio/AudioManager", () => ({
    AudioManager: vi.fn().mockImplementation(() => ({})),
}));

describe("DebugRenderer", () => {
    let debugRenderer: DebugRenderer;
    let entityManager: EntityManager;
    let gameState: GameState;
    let scaleManager: ScaleManager;
    let mockCanvas: HTMLCanvasElement;
    let mockCtx: Partial<CanvasRenderingContext2D>;

    beforeEach(() => {
        // Create mock canvas
        mockCanvas = {
            width: 800,
            height: 600,
        } as HTMLCanvasElement;

        // Create mock context
        mockCtx = {
            save: vi.fn(),
            restore: vi.fn(),
            beginPath: vi.fn(),
            arc: vi.fn(),
            moveTo: vi.fn(),
            lineTo: vi.fn(),
            stroke: vi.fn(),
            globalAlpha: 1,
            lineWidth: 1,
            strokeStyle: "",
        };

        // Create systems
        entityManager = new EntityManager(mockCanvas);
        gameState = new GameState();
        scaleManager = new ScaleManager(800, 600);
        debugRenderer = new DebugRenderer(entityManager, gameState, scaleManager);
    });

    describe("render", () => {
        it("should not render anything when debug mode is disabled", () => {
            debugRenderer.render(mockCtx as CanvasRenderingContext2D, false);

            expect(mockCtx.save).not.toHaveBeenCalled();
            expect(mockCtx.restore).not.toHaveBeenCalled();
        });

        it("should render debug visuals when debug mode is enabled", () => {
            debugRenderer.render(mockCtx as CanvasRenderingContext2D, true);

            expect(mockCtx.save).toHaveBeenCalled();
            expect(mockCtx.restore).toHaveBeenCalled();
        });
    });

    describe("collision radius calculation", () => {
        it("should calculate collision radius correctly", () => {
            const entity: GameEntity = {
                type: "asteroid",
                position: new Vector2(0, 0),
                velocity: Vector2.zero(),
                size: new Vector2(30, 20),
                rotation: 0,
                color: "#ffffff",
            };

            // Access private method for testing
            const radius = (
                debugRenderer as unknown as {
                    getCollisionRadius: (entity: GameEntity) => number;
                }
            ).getCollisionRadius(entity);
            expect(radius).toBe(19.5); // With ASTEROID.SCALE: max(30,20)/2 * 3.0 * 0.5 * 0.8 + 1.5 = 19.5
        });
    });

    describe("weapon range calculations", () => {
        it("should calculate bullet range based on upgrades", () => {
            // Access private method for testing
            const range = (
                debugRenderer as unknown as { getBulletRange: () => number }
            ).getBulletRange();
            expect(range).toBeGreaterThan(0);
        });

        it("should calculate missile range based on speed and age", () => {
            // Access private method for testing
            const range = (
                debugRenderer as unknown as { getMissileRange: () => number }
            ).getMissileRange();
            expect(range).toBeGreaterThan(0);
        });

        it("should calculate laser range based on upgrades", () => {
            // Access private method for testing
            const range = (
                debugRenderer as unknown as { getLaserRange: () => number }
            ).getLaserRange();
            expect(range).toBeGreaterThan(0);
        });

        it("should calculate lightning range based on upgrades", () => {
            // Access private method for testing
            const range = (
                debugRenderer as unknown as { getLightningRange: () => number }
            ).getLightningRange();
            expect(range).toBeGreaterThan(0);
        });
    });
});
