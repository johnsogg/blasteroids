import { MenuItem } from "./MenuItem";
import type { Game } from "~/game/Game";
import { GIFT, type GiftType } from "~/config/constants";

export class MenuManager {
    private game: Game;
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private items: MenuItem[] = [];
    private currentIndex = 0;
    private isVisible = false;
    private lastNavigationTime = 0;
    private navigationDelay = 150; // ms

    constructor(
        game: Game,
        canvas: HTMLCanvasElement,
        ctx: CanvasRenderingContext2D
    ) {
        this.game = game;
        this.canvas = canvas;
        this.ctx = ctx;
        this.initializeMenuItems();
    }

    /**
     * Initialize all menu items
     */
    private initializeMenuItems(): void {
        this.items = [
            new MenuItem({
                id: "display_mode",
                label: "Display Mode",
                type: "select",
                value: "fixed",
                options: [
                    { label: "Classic (800×600)", value: "fixed" },
                    { label: "Full Window", value: "fullWindow" },
                    { label: "Aspect Fit", value: "aspectFit" },
                    { label: "Custom", value: "custom" },
                ],
                onChange: (value) =>
                    this.handleDisplayModeChange(value as string),
            }),

            new MenuItem({
                id: "custom_width",
                label: "Width",
                type: "range",
                value: 800,
                min: 600,
                max: 2560,
                step: 50,
                enabled: false, // Enabled when custom mode is selected
                onChange: () => this.handleCustomDimensionChange(),
            }),

            new MenuItem({
                id: "custom_height",
                label: "Height",
                type: "range",
                value: 600,
                min: 400,
                max: 1440,
                step: 50,
                enabled: false, // Enabled when custom mode is selected
                onChange: () => this.handleCustomDimensionChange(),
            }),

            new MenuItem({
                id: "aspect_ratio",
                label: "Aspect Ratio",
                type: "select",
                value: 1.333,
                options: [
                    { label: "4:3 (Classic)", value: 1.333 },
                    { label: "16:9 (Widescreen)", value: 1.778 },
                    { label: "21:9 (Ultrawide)", value: 2.333 },
                ],
                enabled: false, // Enabled when aspect fit mode is selected
                onChange: (value) =>
                    this.handleAspectRatioChange(value as number),
            }),

            new MenuItem({
                id: "separator1",
                label: "",
                type: "separator",
            }),

            new MenuItem({
                id: "audio_settings",
                label: "Audio Settings",
                type: "action",
                enabled: false, // Placeholder for future implementation
                action: () => {
                    /* TODO: Audio settings */
                },
            }),

            new MenuItem({
                id: "controls",
                label: "Controls",
                type: "action",
                enabled: false, // Placeholder for future implementation
                action: () => {
                    /* TODO: Controls */
                },
            }),

            new MenuItem({
                id: "separator2",
                label: "",
                type: "separator",
            }),

            new MenuItem({
                id: "debug_next_gift",
                label: "Force Next Gift",
                type: "select",
                value: this.getInitialDebugGiftValue(),
                options: [
                    { label: "Random (Normal)", value: "none" },
                    { label: "Fuel Refill", value: GIFT.TYPES.FUEL_REFILL },
                    { label: "Extra Life", value: GIFT.TYPES.EXTRA_LIFE },
                    {
                        label: "Missiles Weapon",
                        value: GIFT.TYPES.WEAPON_MISSILES,
                    },
                    { label: "Laser Weapon", value: GIFT.TYPES.WEAPON_LASER },
                    {
                        label: "Lightning Weapon",
                        value: GIFT.TYPES.WEAPON_LIGHTNING,
                    },
                    {
                        label: "Bullets: Fire Rate",
                        value: GIFT.TYPES.UPGRADE_BULLETS_FIRE_RATE,
                    },
                    {
                        label: "Bullets: Size",
                        value: GIFT.TYPES.UPGRADE_BULLETS_SIZE,
                    },
                    {
                        label: "Missiles: Speed",
                        value: GIFT.TYPES.UPGRADE_MISSILES_SPEED,
                    },
                    {
                        label: "Missiles: Fire Rate",
                        value: GIFT.TYPES.UPGRADE_MISSILES_FIRE_RATE,
                    },
                    {
                        label: "Missiles: Homing",
                        value: GIFT.TYPES.UPGRADE_MISSILES_HOMING,
                    },
                    {
                        label: "Laser: Range",
                        value: GIFT.TYPES.UPGRADE_LASER_RANGE,
                    },
                    {
                        label: "Laser: Efficiency",
                        value: GIFT.TYPES.UPGRADE_LASER_EFFICIENCY,
                    },
                    {
                        label: "Lightning: Radius",
                        value: GIFT.TYPES.UPGRADE_LIGHTNING_RADIUS,
                    },
                    {
                        label: "Lightning: Chain",
                        value: GIFT.TYPES.UPGRADE_LIGHTNING_CHAIN,
                    },
                ],
                onChange: (value) =>
                    this.handleDebugNextGiftChange(value as string),
            }),

            new MenuItem({
                id: "separator3",
                label: "",
                type: "separator",
            }),

            new MenuItem({
                id: "restart",
                label: "Restart Game",
                type: "action",
                action: () => this.handleRestart(),
            }),

            new MenuItem({
                id: "resume",
                label: "Resume Game",
                type: "action",
                action: () => this.hide(),
            }),
        ];

        // Set initial current index to first navigable item
        this.currentIndex = this.findNextNavigableIndex(-1);
    }

    /**
     * Show the menu
     */
    show(): void {
        this.isVisible = true;
        this.currentIndex = this.findNextNavigableIndex(-1);
    }

    /**
     * Hide the menu
     */
    hide(): void {
        this.isVisible = false;
    }

    /**
     * Toggle menu visibility
     */
    toggle(): void {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * Check if menu is currently visible
     */
    get visible(): boolean {
        return this.isVisible;
    }

    /**
     * Handle navigation input
     */
    handleInput(
        direction: "up" | "down" | "left" | "right" | "select"
    ): boolean {
        if (!this.isVisible) return false;

        const now = performance.now();
        if (now - this.lastNavigationTime < this.navigationDelay) return false;

        let handled = false;

        switch (direction) {
            case "up":
                this.navigateUp();
                handled = true;
                break;

            case "down":
                this.navigateDown();
                handled = true;
                break;

            case "left":
                handled = this.getCurrentItem()?.handleLeft() || false;
                break;

            case "right":
                handled = this.getCurrentItem()?.handleRight() || false;
                break;

            case "select":
                this.getCurrentItem()?.execute();
                handled = true;
                break;
        }

        if (handled) {
            this.lastNavigationTime = now;
        }

        return handled;
    }

    /**
     * Navigate to previous item
     */
    private navigateUp(): void {
        this.currentIndex = this.findPreviousNavigableIndex(this.currentIndex);
    }

    /**
     * Navigate to next item
     */
    private navigateDown(): void {
        this.currentIndex = this.findNextNavigableIndex(this.currentIndex);
    }

    /**
     * Find next navigable item index
     */
    private findNextNavigableIndex(startIndex: number): number {
        for (let i = 1; i <= this.items.length; i++) {
            const index = (startIndex + i) % this.items.length;
            if (this.items[index].isNavigable()) {
                return index;
            }
        }
        return Math.max(0, startIndex);
    }

    /**
     * Find previous navigable item index
     */
    private findPreviousNavigableIndex(startIndex: number): number {
        for (let i = 1; i <= this.items.length; i++) {
            const index =
                (startIndex - i + this.items.length) % this.items.length;
            if (this.items[index].isNavigable()) {
                return index;
            }
        }
        return Math.max(0, startIndex);
    }

    /**
     * Get currently selected item
     */
    private getCurrentItem(): MenuItem | undefined {
        return this.items[this.currentIndex];
    }

    /**
     * Handle display mode change
     */
    private handleDisplayModeChange(mode: string): void {
        // Enable/disable custom controls based on mode
        const customWidth = this.items.find(
            (item) => item.id === "custom_width"
        );
        const customHeight = this.items.find(
            (item) => item.id === "custom_height"
        );
        const aspectRatio = this.items.find(
            (item) => item.id === "aspect_ratio"
        );

        if (customWidth && customHeight && aspectRatio) {
            customWidth.enabled = mode === "custom";
            customHeight.enabled = mode === "custom";
            aspectRatio.enabled = mode === "aspectFit";
        }

        // Apply the geometry change
        if (mode === "custom") {
            this.handleCustomDimensionChange();
        } else if (mode === "aspectFit") {
            this.handleAspectRatioChange(aspectRatio?.value as number);
        } else {
            this.game.setGeometry(mode);
        }
    }

    /**
     * Handle custom dimension change
     */
    private handleCustomDimensionChange(): void {
        const widthItem = this.items.find((item) => item.id === "custom_width");
        const heightItem = this.items.find(
            (item) => item.id === "custom_height"
        );

        if (widthItem && heightItem) {
            this.game.setGeometry("custom", {
                customWidth: widthItem.value as number,
                customHeight: heightItem.value as number,
            });
        }
    }

    /**
     * Handle aspect ratio change
     */
    private handleAspectRatioChange(aspectRatio: number): void {
        this.game.setGeometry("aspectFit", {
            aspectRatio: aspectRatio,
        });
    }

    /**
     * Handle debug next gift change
     */
    private handleDebugNextGiftChange(value: string): void {
        if (value === "none") {
            this.game.setDebugNextGift(null);
        } else {
            this.game.setDebugNextGift(value as GiftType);
        }
    }

    /**
     * Get initial debug gift value from game state
     */
    private getInitialDebugGiftValue(): string {
        const debugGift = this.game.getDebugNextGift();
        return debugGift || "none";
    }

    /**
     * Handle game restart
     */
    private handleRestart(): void {
        this.game.restart(); // Restart handles both menu hiding and pause state reset
    }

    /**
     * Render the menu overlay
     */
    render(): void {
        if (!this.isVisible) return;

        const width = this.canvas.width;
        const height = this.canvas.height;

        this.ctx.save();

        // Draw semi-transparent overlay
        this.ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        this.ctx.fillRect(0, 0, width, height);

        // Menu panel dimensions
        const panelWidth = Math.min(400, width * 0.8);
        const panelHeight = Math.min(500, height * 0.8);
        const panelX = (width - panelWidth) / 2;
        const panelY = (height - panelHeight) / 2;

        // Draw menu panel background
        this.ctx.fillStyle = "rgba(20, 20, 20, 0.95)";
        this.ctx.fillRect(panelX, panelY, panelWidth, panelHeight);

        // Draw panel border
        this.ctx.strokeStyle = "#00ff00";
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);

        // Menu title
        this.ctx.fillStyle = "#00ff00";
        this.ctx.font = "bold 24px Orbitron, monospace";
        this.ctx.textAlign = "center";
        this.ctx.fillText("GAME MENU", width / 2, panelY + 40);

        // Menu items
        this.ctx.font = "16px Orbitron, monospace";
        this.ctx.textAlign = "left";

        const itemHeight = 30;
        const startY = panelY + 80;
        const itemX = panelX + 20;

        this.items.forEach((item, index) => {
            const itemY = startY + index * itemHeight;
            const isSelected = index === this.currentIndex;
            const isEnabled = item.enabled;

            // Skip rendering if item would be outside panel
            if (itemY > panelY + panelHeight - 20) return;

            // Set colors based on state
            if (item.type === "separator") {
                this.ctx.fillStyle = "#444444";
            } else if (isSelected) {
                this.ctx.fillStyle = "#ffffff";
                // Draw selection highlight
                this.ctx.fillStyle = "rgba(0, 255, 0, 0.2)";
                this.ctx.fillRect(itemX - 10, itemY - 15, panelWidth - 20, 25);
                this.ctx.fillStyle = "#ffffff";
            } else if (isEnabled) {
                this.ctx.fillStyle = "#00ff00";
            } else {
                this.ctx.fillStyle = "#666666";
            }

            // Draw cursor for selected item
            if (isSelected && item.type !== "separator") {
                this.ctx.fillStyle = "#00ff00";
                this.ctx.fillText(">", itemX - 15, itemY);
            }

            // Draw item text
            this.ctx.fillText(item.getDisplayText(), itemX, itemY);

            // Draw value indicators for interactive items
            if (item.isInteractive() && isEnabled) {
                const textWidth = this.ctx.measureText(item.label).width;

                // Draw left/right arrows for interactive items
                if (isSelected) {
                    this.ctx.fillStyle = "#888888";
                    this.ctx.fillText("◀", itemX + textWidth + 20, itemY);
                    this.ctx.fillText(
                        "▶",
                        itemX + textWidth + panelWidth - 120,
                        itemY
                    );
                }
            }
        });

        this.ctx.restore();

        // Instructions (below the green border)
        this.ctx.fillStyle = "#888888";
        this.ctx.font = "12px Orbitron, monospace";
        this.ctx.textAlign = "center";

        const instructionsY = panelY + panelHeight + 20; // 20px below the panel
        this.ctx.fillText(
            "↑↓/WASD: Navigate  ←→: Change  Enter/Space: Select  ESC: Resume",
            width / 2,
            instructionsY
        );
    }
}
