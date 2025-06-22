import type { GameState } from "~/game/GameState";
import { ZONES } from "~/config/constants";

export interface ZoneChoiceOption {
    type: "continue" | "next_zone" | "shop";
    title: string;
    description: string;
    available: boolean;
    cost?: number;
}

export class ZoneChoiceScreen {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private gameState: GameState;
    private isActive: boolean = false;
    private selectedOption: number = 0;
    private options: ZoneChoiceOption[] = [];
    private onChoice?: (choice: "continue" | "next_zone" | "shop") => void;

    constructor(
        canvas: HTMLCanvasElement,
        ctx: CanvasRenderingContext2D,
        gameState: GameState
    ) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.gameState = gameState;
    }

    /**
     * Show the zone choice screen
     */
    show(onChoice: (choice: "continue" | "next_zone" | "shop") => void): void {
        this.isActive = true;
        this.selectedOption = 0;
        this.onChoice = onChoice;
        this.generateOptions();
    }

    /**
     * Hide the zone choice screen
     */
    hide(): void {
        this.isActive = false;
        this.onChoice = undefined;
    }

    /**
     * Check if the choice screen is currently active
     */
    get active(): boolean {
        return this.isActive;
    }

    /**
     * Handle input for the choice screen
     */
    handleInput(key: string): boolean {
        if (!this.isActive) return false;

        switch (key) {
            case "ArrowUp":
            case "w":
                this.selectedOption = Math.max(0, this.selectedOption - 1);
                return true;
            case "ArrowDown":
            case "s":
                this.selectedOption = Math.min(
                    this.options.length - 1,
                    this.selectedOption + 1
                );
                return true;
            case "Enter":
            case " ":
                this.selectCurrentOption();
                return true;
            case "Escape":
                // Default to continue current zone
                this.makeChoice("continue");
                return true;
        }
        return false;
    }

    /**
     * Render the zone choice screen
     */
    render(): void {
        if (!this.isActive) return;

        // Draw semi-transparent overlay
        this.ctx.save();
        this.ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw main panel
        const panelWidth = 600;
        const panelHeight = 400;
        const panelX = (this.canvas.width - panelWidth) / 2;
        const panelY = (this.canvas.height - panelHeight) / 2;

        // Panel background
        this.ctx.fillStyle = "#001122";
        this.ctx.strokeStyle = "#00ffff";
        this.ctx.lineWidth = 2;
        this.ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
        this.ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);

        // Title
        this.ctx.fillStyle = "#00ffff";
        this.ctx.font = '700 24px Orbitron, "Courier New", monospace';
        this.ctx.textAlign = "center";
        this.ctx.fillText("Zone Complete!", this.canvas.width / 2, panelY + 40);

        // Zone info
        this.ctx.fillStyle = "#ffffff";
        this.ctx.font = '400 16px Orbitron, "Courier New", monospace';
        const currentZoneConfig =
            ZONES.ZONE_CONFIGS[
                this.gameState.zone as keyof typeof ZONES.ZONE_CONFIGS
            ];
        this.ctx.fillText(
            `You have completed 5 levels in ${currentZoneConfig?.name || "Unknown Zone"}`,
            this.canvas.width / 2,
            panelY + 70
        );

        // Currency display
        this.ctx.fillStyle = "#ffff00";
        this.ctx.fillText(
            `Current Credits: ${this.gameState.currency}`,
            this.canvas.width / 2,
            panelY + 100
        );

        // Options
        this.renderOptions(panelX, panelY + 130, panelWidth);

        // Instructions
        this.ctx.fillStyle = "#aaaaaa";
        this.ctx.font = '400 14px Orbitron, "Courier New", monospace';
        this.ctx.fillText(
            "Use ↑/↓ or W/S to select, Enter to confirm, Esc to continue zone",
            this.canvas.width / 2,
            panelY + panelHeight - 20
        );

        this.ctx.restore();
    }

    private generateOptions(): void {
        this.options = [];

        // Option 1: Continue current zone
        this.options.push({
            type: "continue",
            title: "Continue Current Zone",
            description: `Keep playing in ${this.getCurrentZoneName()} (Level ${this.gameState.zone}-6)`,
            available: true,
        });

        // Option 2: Advance to next zone
        const nextZone = this.gameState.zone + 1;
        const nextZoneConfig =
            ZONES.ZONE_CONFIGS[nextZone as keyof typeof ZONES.ZONE_CONFIGS];
        this.options.push({
            type: "next_zone",
            title: "Advance to Next Zone",
            description: nextZoneConfig
                ? `Enter ${nextZoneConfig.name} (Level ${nextZone}-1)`
                : "Enter uncharted space (coming soon)",
            available: !!nextZoneConfig,
        });

        // Option 3: Shop
        this.options.push({
            type: "shop",
            title: "Upgrade Shop",
            description: "Purchase upgrades with your credits",
            available: true,
        });
    }

    private renderOptions(
        startX: number,
        startY: number,
        panelWidth: number
    ): void {
        const optionHeight = 60;
        const optionPadding = 10;

        this.options.forEach((option, index) => {
            const optionY = startY + index * (optionHeight + optionPadding);
            const isSelected = index === this.selectedOption;
            const isAvailable = option.available;

            // Option background
            if (isSelected && isAvailable) {
                this.ctx.fillStyle = "rgba(0, 255, 255, 0.2)";
                this.ctx.fillRect(
                    startX + 20,
                    optionY,
                    panelWidth - 40,
                    optionHeight
                );
                this.ctx.strokeStyle = "#00ffff";
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(
                    startX + 20,
                    optionY,
                    panelWidth - 40,
                    optionHeight
                );
            }

            // Option text
            const textColor = isAvailable
                ? isSelected
                    ? "#00ffff"
                    : "#ffffff"
                : "#666666";
            this.ctx.fillStyle = textColor;
            this.ctx.font = '700 16px Orbitron, "Courier New", monospace';
            this.ctx.textAlign = "left";
            this.ctx.fillText(option.title, startX + 30, optionY + 25);

            this.ctx.fillStyle = isAvailable ? "#cccccc" : "#555555";
            this.ctx.font = '400 14px Orbitron, "Courier New", monospace';
            this.ctx.fillText(option.description, startX + 30, optionY + 45);

            // Cost if applicable
            if (option.cost) {
                this.ctx.fillStyle =
                    this.gameState.currency >= option.cost
                        ? "#00ff00"
                        : "#ff0000";
                this.ctx.textAlign = "right";
                this.ctx.fillText(
                    `${option.cost} Credits`,
                    startX + panelWidth - 30,
                    optionY + 25
                );
            }
        });
    }

    private getCurrentZoneName(): string {
        const zoneConfig =
            ZONES.ZONE_CONFIGS[
                this.gameState.zone as keyof typeof ZONES.ZONE_CONFIGS
            ];
        return zoneConfig?.name || "Unknown Zone";
    }

    private selectCurrentOption(): void {
        const option = this.options[this.selectedOption];
        if (option && option.available) {
            this.makeChoice(option.type);
        }
    }

    private makeChoice(choice: "continue" | "next_zone" | "shop"): void {
        if (this.onChoice) {
            this.onChoice(choice);
        }
        this.hide();
    }
}
