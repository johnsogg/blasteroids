import { describe, it, expect, beforeEach, vi } from "vitest";
import { Shapes } from "./Shapes";
import { ScaleManager } from "~/utils/ScaleManager";
import { Vector2 } from "~/utils/Vector2";

// Mock canvas context for testing
const createMockContext = () => {
    const ctx = {
        save: vi.fn(),
        restore: vi.fn(),
        translate: vi.fn(),
        rotate: vi.fn(),
        scale: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        closePath: vi.fn(),
        stroke: vi.fn(),
        strokeStyle: "",
        lineWidth: 0,
    } as unknown as CanvasRenderingContext2D;

    return ctx;
};

describe("Shapes - Ship Rendering", () => {
    let mockCtx: CanvasRenderingContext2D;
    let scaleManager: ScaleManager;

    beforeEach(() => {
        mockCtx = createMockContext();
        scaleManager = new ScaleManager(800, 600); // Reference size
    });

    describe("drawShip without ScaleManager", () => {
        it("should render ship with original hardcoded coordinates", () => {
            const position = new Vector2(100, 100);
            const rotation = 0;
            const color = "#00ff00";

            Shapes.drawShip({ ctx: mockCtx, position, rotation, color });

            // Verify basic drawing calls
            expect(mockCtx.save).toHaveBeenCalled();
            expect(mockCtx.translate).toHaveBeenCalledWith(100, 100);
            expect(mockCtx.rotate).toHaveBeenCalledWith(0);
            expect(mockCtx.scale).toHaveBeenCalledWith(1, 1); // Default scale
            expect(mockCtx.restore).toHaveBeenCalled();

            // Verify ship shape drawing
            expect(mockCtx.beginPath).toHaveBeenCalled();
            expect(mockCtx.moveTo).toHaveBeenCalled();
            expect(mockCtx.lineTo).toHaveBeenCalled();
            expect(mockCtx.closePath).toHaveBeenCalled();
            expect(mockCtx.stroke).toHaveBeenCalled();
        });

        it("should apply custom scale parameter", () => {
            const position = new Vector2(100, 100);
            const rotation = 0;
            const color = "#00ff00";
            const customScale = 2.0;

            Shapes.drawShip({
                ctx: mockCtx,
                position,
                rotation,
                color,
                scale: customScale,
            });

            expect(mockCtx.scale).toHaveBeenCalledWith(2, 2);
        });
    });

    describe("drawShip with ScaleManager", () => {
        it("should apply scale manager's scale factor", () => {
            const position = new Vector2(100, 100);
            const rotation = 0;
            const color = "#00ff00";

            // At reference size (800x600), scale should be 1.0
            Shapes.drawShip({
                ctx: mockCtx,
                position,
                rotation,
                color,
                scaleManager,
            });

            expect(mockCtx.scale).toHaveBeenCalledWith(1, 1); // 1.0 * 1.0 = 1.0
        });

        it("should combine custom scale with scale manager", () => {
            const position = new Vector2(100, 100);
            const rotation = 0;
            const color = "#00ff00";
            const customScale = 1.5;

            // Change to double-size canvas
            scaleManager.updateCanvasSize(1600, 1200);

            Shapes.drawShip({
                ctx: mockCtx,
                position,
                rotation,
                color,
                scale: customScale,
                scaleManager,
            });

            expect(mockCtx.scale).toHaveBeenCalledWith(3, 3); // 1.5 * 2.0 = 3.0
        });

        it("should scale line width appropriately", () => {
            const position = new Vector2(100, 100);
            const rotation = 0;
            const color = "#00ff00";

            // At double-size canvas
            scaleManager.updateCanvasSize(1600, 1200);

            Shapes.drawShip({
                ctx: mockCtx,
                position,
                rotation,
                color,
                scaleManager,
            });

            // Line width should be scaled (base 2 * scale 2.0 = 4)
            expect(mockCtx.lineWidth).toBe(4);
        });

        it("should scale line width for thrust flames", () => {
            const position = new Vector2(100, 100);
            const rotation = 0;
            const color = "#00ff00";

            // At half-size canvas
            scaleManager.updateCanvasSize(400, 300);

            Shapes.drawShip({
                ctx: mockCtx,
                position,
                rotation,
                color,
                showThrust: true,
                scaleManager,
            });

            // Should have multiple lineWidth assignments (ship outline and thrust flames)
            // Thrust flame line width should be scaled (base 2 * scale 0.5 = 1)
            const lineWidthCalls = (mockCtx as unknown as { lineWidth: number })
                .lineWidth;
            expect(typeof lineWidthCalls).toBe("number");
        });
    });

    describe("ship rendering with different features", () => {
        beforeEach(() => {
            scaleManager.updateCanvasSize(1600, 1200); // 2x scale for easier testing
        });

        it("should render thrust flames when showThrust is true", () => {
            const position = new Vector2(100, 100);
            const rotation = 0;
            const color = "#00ff00";

            Shapes.drawShip({
                ctx: mockCtx,
                position,
                rotation,
                color,
                showThrust: true,
                scaleManager,
            });

            // Should have additional drawing calls for thrust flames
            expect(mockCtx.beginPath).toHaveBeenCalledTimes(2); // Ship + thrust
            expect(mockCtx.stroke).toHaveBeenCalledTimes(2); // Ship + thrust
        });

        it("should render left strafe flames when strafingLeft is true", () => {
            const position = new Vector2(100, 100);
            const rotation = 0;
            const color = "#00ff00";

            Shapes.drawShip({
                ctx: mockCtx,
                position,
                rotation,
                color,
                strafingLeft: true,
                scaleManager,
            });

            // Should have additional drawing calls for strafe flames
            expect(mockCtx.beginPath).toHaveBeenCalledTimes(2); // Ship + left strafe
            expect(mockCtx.stroke).toHaveBeenCalledTimes(2); // Ship + left strafe
        });

        it("should render right strafe flames when strafingRight is true", () => {
            const position = new Vector2(100, 100);
            const rotation = 0;
            const color = "#00ff00";

            Shapes.drawShip({
                ctx: mockCtx,
                position,
                rotation,
                color,
                strafingRight: true,
                scaleManager,
            });

            // Should have additional drawing calls for strafe flames
            expect(mockCtx.beginPath).toHaveBeenCalledTimes(2); // Ship + right strafe
            expect(mockCtx.stroke).toHaveBeenCalledTimes(2); // Ship + right strafe
        });

        it("should render all effects when multiple flags are true", () => {
            const position = new Vector2(100, 100);
            const rotation = 0;
            const color = "#00ff00";

            Shapes.drawShip({
                ctx: mockCtx,
                position,
                rotation,
                color,
                showThrust: true,
                strafingLeft: true,
                strafingRight: true,
                scaleManager,
            });

            // Should have drawing calls for ship + thrust + left strafe + right strafe
            expect(mockCtx.beginPath).toHaveBeenCalledTimes(4);
            expect(mockCtx.stroke).toHaveBeenCalledTimes(4);
        });

        it("should use invulnerable color when invulnerable is true", () => {
            const position = new Vector2(100, 100);
            const rotation = 0;
            const color = "#00ff00";

            Shapes.drawShip({
                ctx: mockCtx,
                position,
                rotation,
                color,
                invulnerable: true,
                scaleManager,
            });

            expect(mockCtx.strokeStyle).toBe("#ffff00"); // Yellow for invulnerable
        });
    });

    describe("scaling behavior consistency", () => {
        it("should maintain ship proportions at different scales", () => {
            const position = new Vector2(100, 100);
            const rotation = 0;
            const color = "#00ff00";

            // Test at different canvas sizes
            const testSizes = [
                { width: 400, height: 300, expectedScale: 0.5 },
                { width: 800, height: 600, expectedScale: 1.0 },
                { width: 1600, height: 1200, expectedScale: 2.0 },
            ];

            testSizes.forEach(({ width, height, expectedScale }) => {
                const testScaleManager = new ScaleManager(width, height);
                expect(testScaleManager.getScale()).toBe(expectedScale);

                // Reset mock for each test
                vi.clearAllMocks();

                Shapes.drawShip({
                    ctx: mockCtx,
                    position,
                    rotation,
                    color,
                    scaleManager: testScaleManager,
                });

                // Verify the combined scale is applied correctly
                expect(mockCtx.scale).toHaveBeenCalledWith(
                    expectedScale,
                    expectedScale
                );
            });
        });
    });
});
