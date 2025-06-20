import { describe, it, expect, beforeEach } from "vitest";
import { ScaleManager } from "./ScaleManager";
import { Vector2 } from "./Vector2";

describe("ScaleManager", () => {
    let scaleManager: ScaleManager;

    beforeEach(() => {
        // Start with the base reference size (800x600)
        scaleManager = new ScaleManager(800, 600);
    });

    describe("constructor and basic functionality", () => {
        it("should initialize with correct scale factor for reference size", () => {
            expect(scaleManager.getScale()).toBe(1.0);
        });

        it("should calculate correct scale for different canvas sizes", () => {
            // Smaller canvas (half size)
            const smallScale = new ScaleManager(400, 300);
            expect(smallScale.getScale()).toBe(0.5);

            // Larger canvas (double size)
            const largeScale = new ScaleManager(1600, 1200);
            expect(largeScale.getScale()).toBe(2.0);
        });

        it("should use the smaller dimension ratio to maintain aspect ratio", () => {
            // Wide aspect ratio - height should be limiting factor
            const wideScale = new ScaleManager(1600, 600);
            expect(wideScale.getScale()).toBe(1.0); // 600/600 = 1.0 (smaller than 1600/800 = 2.0)

            // Tall aspect ratio - width should be limiting factor
            const tallScale = new ScaleManager(800, 1200);
            expect(tallScale.getScale()).toBe(1.0); // 800/800 = 1.0 (smaller than 1200/600 = 2.0)
        });
    });

    describe("updateCanvasSize", () => {
        it("should update scale factor when canvas size changes", () => {
            expect(scaleManager.getScale()).toBe(1.0);

            scaleManager.updateCanvasSize(1600, 1200);
            expect(scaleManager.getScale()).toBe(2.0);

            scaleManager.updateCanvasSize(400, 300);
            expect(scaleManager.getScale()).toBe(0.5);
        });
    });

    describe("scaleValue", () => {
        it("should scale single values correctly", () => {
            // At 1.0 scale
            expect(scaleManager.scaleValue(10)).toBe(10);
            expect(scaleManager.scaleValue(50)).toBe(50);

            // At 2.0 scale
            scaleManager.updateCanvasSize(1600, 1200);
            expect(scaleManager.scaleValue(10)).toBe(20);
            expect(scaleManager.scaleValue(50)).toBe(100);

            // At 0.5 scale
            scaleManager.updateCanvasSize(400, 300);
            expect(scaleManager.scaleValue(10)).toBe(5);
            expect(scaleManager.scaleValue(50)).toBe(25);
        });
    });

    describe("scaleVector", () => {
        it("should scale Vector2 objects correctly", () => {
            const vector = new Vector2(10, 20);

            // At 1.0 scale
            const scaled1 = scaleManager.scaleVector(vector);
            expect(scaled1.x).toBe(10);
            expect(scaled1.y).toBe(20);

            // At 2.0 scale
            scaleManager.updateCanvasSize(1600, 1200);
            const scaled2 = scaleManager.scaleVector(vector);
            expect(scaled2.x).toBe(20);
            expect(scaled2.y).toBe(40);

            // At 0.5 scale
            scaleManager.updateCanvasSize(400, 300);
            const scaled3 = scaleManager.scaleVector(vector);
            expect(scaled3.x).toBe(5);
            expect(scaled3.y).toBe(10);
        });

        it("should return new Vector2 instances (immutable)", () => {
            const original = new Vector2(10, 20);
            const scaled = scaleManager.scaleVector(original);

            expect(scaled).not.toBe(original);
            expect(original.x).toBe(10); // Original unchanged
            expect(original.y).toBe(20); // Original unchanged
        });
    });

    describe("scalePoints", () => {
        it("should scale arrays of Vector2 points", () => {
            const points = [
                new Vector2(10, 20),
                new Vector2(30, 40),
                new Vector2(50, 60),
            ];

            // At 2.0 scale
            scaleManager.updateCanvasSize(1600, 1200);
            const scaledPoints = scaleManager.scalePoints(points);

            expect(scaledPoints).toHaveLength(3);
            expect(scaledPoints[0].x).toBe(20);
            expect(scaledPoints[0].y).toBe(40);
            expect(scaledPoints[1].x).toBe(60);
            expect(scaledPoints[1].y).toBe(80);
            expect(scaledPoints[2].x).toBe(100);
            expect(scaledPoints[2].y).toBe(120);

            // Original points should be unchanged
            expect(points[0].x).toBe(10);
            expect(points[0].y).toBe(20);
        });
    });

    describe("getBaseDimensions", () => {
        it("should return reference canvas dimensions", () => {
            const baseDims = ScaleManager.getBaseDimensions();
            expect(baseDims.width).toBe(800);
            expect(baseDims.height).toBe(600);
        });
    });

    describe("getCanvasDimensions", () => {
        it("should return current canvas dimensions", () => {
            const dims = scaleManager.getCanvasDimensions();
            expect(dims.width).toBe(800);
            expect(dims.height).toBe(600);

            scaleManager.updateCanvasSize(1024, 768);
            const newDims = scaleManager.getCanvasDimensions();
            expect(newDims.width).toBe(1024);
            expect(newDims.height).toBe(768);
        });
    });

    describe("edge cases", () => {
        it("should handle very small canvas sizes", () => {
            const tinyScale = new ScaleManager(80, 60);
            expect(tinyScale.getScale()).toBe(0.1);
        });

        it("should handle very large canvas sizes", () => {
            const hugeScale = new ScaleManager(8000, 6000);
            expect(hugeScale.getScale()).toBe(10.0);
        });

        it("should handle non-proportional aspect ratios", () => {
            // Super wide
            const superWide = new ScaleManager(2400, 600);
            expect(superWide.getScale()).toBe(1.0); // Limited by height

            // Super tall
            const superTall = new ScaleManager(800, 1800);
            expect(superTall.getScale()).toBe(1.0); // Limited by width
        });
    });
});
