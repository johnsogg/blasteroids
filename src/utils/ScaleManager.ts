import { Vector2 } from "./Vector2";

/**
 * ScaleManager handles scaling calculations based on canvas size
 * Allows game elements to scale appropriately for different screen sizes
 * while maintaining consistent visual proportions
 */
export class ScaleManager {
    // Reference canvas dimensions - the "base" size for all scaling calculations
    private static readonly BASE_CANVAS_WIDTH = 800;
    private static readonly BASE_CANVAS_HEIGHT = 600;

    private currentCanvasWidth: number;
    private currentCanvasHeight: number;
    private scaleFactor: number;

    constructor(canvasWidth: number, canvasHeight: number) {
        this.currentCanvasWidth = canvasWidth;
        this.currentCanvasHeight = canvasHeight;
        this.scaleFactor = this.calculateScaleFactor();
    }

    /**
     * Update canvas dimensions and recalculate scale factor
     */
    updateCanvasSize(width: number, height: number): void {
        this.currentCanvasWidth = width;
        this.currentCanvasHeight = height;
        this.scaleFactor = this.calculateScaleFactor();
    }

    /**
     * Get the current scale factor (1.0 = reference size)
     */
    getScale(): number {
        return this.scaleFactor;
    }

    /**
     * Scale a single pixel value
     */
    scaleValue(pixelValue: number): number {
        return pixelValue * this.scaleFactor;
    }

    /**
     * Scale a Vector2 (both x and y components)
     */
    scaleVector(vector: Vector2): Vector2 {
        return new Vector2(
            vector.x * this.scaleFactor,
            vector.y * this.scaleFactor
        );
    }

    /**
     * Scale an array of Vector2 points (useful for shapes)
     */
    scalePoints(points: Vector2[]): Vector2[] {
        return points.map((point) => this.scaleVector(point));
    }

    /**
     * Get the reference canvas dimensions
     */
    static getBaseDimensions(): { width: number; height: number } {
        return {
            width: ScaleManager.BASE_CANVAS_WIDTH,
            height: ScaleManager.BASE_CANVAS_HEIGHT,
        };
    }

    /**
     * Get current canvas dimensions
     */
    getCanvasDimensions(): { width: number; height: number } {
        return {
            width: this.currentCanvasWidth,
            height: this.currentCanvasHeight,
        };
    }

    /**
     * Calculate scale factor based on canvas size relative to base dimensions
     * Uses the smaller dimension to maintain aspect ratio and prevent clipping
     */
    private calculateScaleFactor(): number {
        const widthRatio =
            this.currentCanvasWidth / ScaleManager.BASE_CANVAS_WIDTH;
        const heightRatio =
            this.currentCanvasHeight / ScaleManager.BASE_CANVAS_HEIGHT;

        // Use the smaller ratio to ensure everything fits
        return Math.min(widthRatio, heightRatio);
    }
}
