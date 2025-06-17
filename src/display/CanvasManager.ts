import { CANVAS, GEOMETRY, type GeometryMode } from "~/config/constants";

interface CanvasDimensions {
    width: number;
    height: number;
}

interface GeometryConfig {
    mode: GeometryMode;
    aspectRatio?: number;
    customWidth?: number;
    customHeight?: number;
}

export class CanvasManager {
    private canvas: HTMLCanvasElement;
    private config: GeometryConfig;
    private resizeObserver: ResizeObserver | null = null;
    private onResizeCallback?: (dimensions: CanvasDimensions) => void;
    private resizeTimeout: ReturnType<typeof setTimeout> | null = null;

    constructor(canvas: HTMLCanvasElement, config?: Partial<GeometryConfig>) {
        this.canvas = canvas;
        this.config = {
            mode: GEOMETRY.DEFAULT_MODE,
            aspectRatio: GEOMETRY.DEFAULT_ASPECT_RATIO,
            ...config,
        };

        this.initializeCanvas();
        this.setupResizeObserver();
    }

    /**
     * Set the geometry configuration and update canvas
     */
    setGeometry(config: Partial<GeometryConfig>): void {
        this.config = { ...this.config, ...config };
        this.updateCanvasSize();
    }

    /**
     * Get current canvas dimensions
     */
    getDimensions(): CanvasDimensions {
        return {
            width: this.canvas.width,
            height: this.canvas.height,
        };
    }

    /**
     * Set callback for when canvas is resized
     */
    onResize(callback: (dimensions: CanvasDimensions) => void): void {
        this.onResizeCallback = callback;
    }

    /**
     * Calculate dimensions based on current geometry mode
     */
    private calculateDimensions(): CanvasDimensions {
        switch (this.config.mode) {
            case GEOMETRY.MODES.FIXED:
                return {
                    width: CANVAS.DEFAULT_WIDTH,
                    height: CANVAS.DEFAULT_HEIGHT,
                };

            case GEOMETRY.MODES.FULL_WINDOW:
                return this.calculateFullWindowDimensions();

            case GEOMETRY.MODES.ASPECT_FIT:
                return this.calculateAspectFitDimensions();

            case GEOMETRY.MODES.CUSTOM:
                return this.calculateCustomDimensions();

            default:
                return {
                    width: CANVAS.DEFAULT_WIDTH,
                    height: CANVAS.DEFAULT_HEIGHT,
                };
        }
    }

    /**
     * Calculate full window dimensions
     */
    private calculateFullWindowDimensions(): CanvasDimensions {
        const width = Math.min(
            Math.max(window.innerWidth, CANVAS.MIN_WIDTH),
            CANVAS.MAX_WIDTH
        );
        const height = Math.min(
            Math.max(window.innerHeight, CANVAS.MIN_HEIGHT),
            CANVAS.MAX_HEIGHT
        );

        return { width, height };
    }

    /**
     * Calculate aspect-fit dimensions
     */
    private calculateAspectFitDimensions(): CanvasDimensions {
        const availableWidth = window.innerWidth - GEOMETRY.WINDOW_PADDING * 2;
        const availableHeight =
            window.innerHeight - GEOMETRY.WINDOW_PADDING * 2;
        const aspectRatio =
            this.config.aspectRatio || GEOMETRY.DEFAULT_ASPECT_RATIO;

        // Calculate dimensions that maintain aspect ratio and fit in window
        let width = availableWidth;
        let height = width / aspectRatio;

        if (height > availableHeight) {
            height = availableHeight;
            width = height * aspectRatio;
        }

        // Ensure minimum dimensions
        width = Math.max(width, CANVAS.MIN_WIDTH);
        height = Math.max(height, CANVAS.MIN_HEIGHT);

        // Ensure maximum dimensions
        width = Math.min(width, CANVAS.MAX_WIDTH);
        height = Math.min(height, CANVAS.MAX_HEIGHT);

        return { width: Math.floor(width), height: Math.floor(height) };
    }

    /**
     * Calculate custom dimensions
     */
    private calculateCustomDimensions(): CanvasDimensions {
        const width = Math.min(
            Math.max(
                this.config.customWidth || CANVAS.DEFAULT_WIDTH,
                CANVAS.MIN_WIDTH
            ),
            CANVAS.MAX_WIDTH
        );
        const height = Math.min(
            Math.max(
                this.config.customHeight || CANVAS.DEFAULT_HEIGHT,
                CANVAS.MIN_HEIGHT
            ),
            CANVAS.MAX_HEIGHT
        );

        return { width, height };
    }

    /**
     * Initialize canvas with calculated dimensions
     */
    private initializeCanvas(): void {
        this.updateCanvasSize();
    }

    /**
     * Update canvas size based on current configuration
     */
    private updateCanvasSize(): void {
        const dimensions = this.calculateDimensions();

        // Only update if dimensions have actually changed to prevent infinite loops
        if (
            this.canvas.width === dimensions.width &&
            this.canvas.height === dimensions.height
        ) {
            return;
        }

        // Update canvas element dimensions
        this.canvas.width = dimensions.width;
        this.canvas.height = dimensions.height;

        // Update CSS dimensions to match for proper display
        this.canvas.style.width = `${dimensions.width}px`;
        this.canvas.style.height = `${dimensions.height}px`;

        // Notify listeners of resize
        this.onResizeCallback?.(dimensions);
    }

    /**
     * Setup resize observer for responsive modes
     */
    private setupResizeObserver(): void {
        if (typeof ResizeObserver === "undefined") {
            // Fallback to window resize for older browsers
            window.addEventListener("resize", () => this.handleResize());
            return;
        }

        this.resizeObserver = new ResizeObserver(() => this.handleResize());
        this.resizeObserver.observe(document.body);
    }

    /**
     * Handle window/container resize
     */
    private handleResize(): void {
        // Only resize for responsive modes
        if (
            this.config.mode === GEOMETRY.MODES.FULL_WINDOW ||
            this.config.mode === GEOMETRY.MODES.ASPECT_FIT
        ) {
            // Debounce resize to prevent infinite loops and excessive calls
            if (this.resizeTimeout) {
                clearTimeout(this.resizeTimeout);
            }
            this.resizeTimeout = setTimeout(() => {
                this.updateCanvasSize();
                this.resizeTimeout = null;
            }, 10); // Short delay to debounce
        }
    }

    /**
     * Get available geometry modes
     */
    static getAvailableModes(): Array<{
        key: GeometryMode;
        label: string;
        description: string;
    }> {
        return [
            {
                key: GEOMETRY.MODES.FIXED,
                label: "Classic (800×600)",
                description: "Fixed size classic arcade dimensions",
            },
            {
                key: GEOMETRY.MODES.FULL_WINDOW,
                label: "Full Window",
                description: "Uses entire browser window",
            },
            {
                key: GEOMETRY.MODES.ASPECT_FIT,
                label: "Aspect Fit",
                description:
                    "Largest size that fits window maintaining aspect ratio",
            },
            {
                key: GEOMETRY.MODES.CUSTOM,
                label: "Custom",
                description: "Custom width and height",
            },
        ];
    }

    /**
     * Cleanup resources
     */
    destroy(): void {
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = null;
        }
        this.resizeObserver?.disconnect();
        window.removeEventListener("resize", () => this.handleResize());
    }
}
