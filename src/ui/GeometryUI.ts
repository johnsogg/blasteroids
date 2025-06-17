import type { Game } from "~/game/Game";
import { GEOMETRY } from "~/config/constants";

export class GeometryUI {
    private game: Game;
    private toggleButton!: HTMLButtonElement;
    private optionsPanel!: HTMLElement;
    private customControls!: HTMLElement;
    private aspectControls!: HTMLElement;
    private isExpanded = false;

    constructor(game: Game) {
        this.game = game;
        this.initializeElements();
        this.setupEventListeners();
    }

    private initializeElements(): void {
        this.toggleButton = document.getElementById(
            "geometryToggle"
        ) as HTMLButtonElement;
        this.optionsPanel = document.getElementById(
            "geometryOptions"
        ) as HTMLElement;
        this.customControls = document.getElementById(
            "customControls"
        ) as HTMLElement;
        this.aspectControls = document.getElementById(
            "aspectRatioControls"
        ) as HTMLElement;

        if (
            !this.toggleButton ||
            !this.optionsPanel ||
            !this.customControls ||
            !this.aspectControls
        ) {
            console.warn("Some geometry UI elements not found");
            return;
        }
    }

    private setupEventListeners(): void {
        // Toggle panel visibility
        this.toggleButton?.addEventListener("click", () => {
            this.togglePanel();
        });

        // Handle geometry mode changes
        const radioButtons = document.querySelectorAll(
            'input[name="geometry"]'
        );
        radioButtons.forEach((radio) => {
            radio.addEventListener("change", (e) => {
                const target = e.target as HTMLInputElement;
                if (target.checked) {
                    this.handleGeometryChange(target.value);
                }
            });
        });

        // Handle custom dimensions
        const customWidth = document.getElementById(
            "customWidth"
        ) as HTMLInputElement;
        const customHeight = document.getElementById(
            "customHeight"
        ) as HTMLInputElement;

        [customWidth, customHeight].forEach((input) => {
            input?.addEventListener("input", () => {
                this.handleCustomDimensionChange();
            });
        });

        // Handle aspect ratio changes
        const aspectRatio = document.getElementById(
            "aspectRatio"
        ) as HTMLSelectElement;
        aspectRatio?.addEventListener("change", () => {
            this.handleAspectRatioChange();
        });
    }

    private togglePanel(): void {
        this.isExpanded = !this.isExpanded;

        if (this.isExpanded) {
            this.optionsPanel.classList.remove("hidden");
        } else {
            this.optionsPanel.classList.add("hidden");
        }
    }

    private handleGeometryChange(mode: string): void {
        // Hide all sub-controls first
        this.customControls.classList.add("hidden");
        this.aspectControls.classList.add("hidden");

        // Show relevant controls based on mode
        if (mode === "custom") {
            this.customControls.classList.remove("hidden");
            this.handleCustomDimensionChange();
        } else if (mode === "aspectFit") {
            this.aspectControls.classList.remove("hidden");
            this.handleAspectRatioChange();
        } else {
            // For fixed and fullWindow modes, apply immediately
            this.game.setGeometry(mode);
        }
    }

    private handleCustomDimensionChange(): void {
        const widthInput = document.getElementById(
            "customWidth"
        ) as HTMLInputElement;
        const heightInput = document.getElementById(
            "customHeight"
        ) as HTMLInputElement;

        if (!widthInput || !heightInput) return;

        const width = parseInt(widthInput.value, 10);
        const height = parseInt(heightInput.value, 10);

        if (width && height) {
            this.game.setGeometry("custom", {
                customWidth: width,
                customHeight: height,
            });
        }
    }

    private handleAspectRatioChange(): void {
        const aspectRatioSelect = document.getElementById(
            "aspectRatio"
        ) as HTMLSelectElement;

        if (!aspectRatioSelect) return;

        const aspectRatio = parseFloat(aspectRatioSelect.value);

        this.game.setGeometry("aspectFit", {
            aspectRatio: aspectRatio,
        });
    }

    /**
     * Update UI to reflect current geometry settings
     */
    updateUI(
        mode: string,
        options?: {
            aspectRatio?: number;
            customWidth?: number;
            customHeight?: number;
        }
    ): void {
        // Update radio button selection
        const radioButton = document.querySelector(
            `input[name="geometry"][value="${mode}"]`
        ) as HTMLInputElement;
        if (radioButton) {
            radioButton.checked = true;
        }

        // Update sub-controls visibility
        this.handleGeometryChange(mode);

        // Update custom values if provided
        if (mode === "custom" && options) {
            const widthInput = document.getElementById(
                "customWidth"
            ) as HTMLInputElement;
            const heightInput = document.getElementById(
                "customHeight"
            ) as HTMLInputElement;

            if (widthInput && options.customWidth) {
                widthInput.value = options.customWidth.toString();
            }
            if (heightInput && options.customHeight) {
                heightInput.value = options.customHeight.toString();
            }
        }

        // Update aspect ratio if provided
        if (mode === "aspectFit" && options?.aspectRatio) {
            const aspectRatioSelect = document.getElementById(
                "aspectRatio"
            ) as HTMLSelectElement;
            if (aspectRatioSelect) {
                aspectRatioSelect.value = options.aspectRatio.toString();
            }
        }
    }

    /**
     * Get available geometry modes for programmatic access
     */
    static getAvailableModes() {
        return [
            { key: GEOMETRY.MODES.FIXED, label: "Classic (800×600)" },
            { key: GEOMETRY.MODES.FULL_WINDOW, label: "Full Window" },
            { key: GEOMETRY.MODES.ASPECT_FIT, label: "Aspect Fit" },
            { key: GEOMETRY.MODES.CUSTOM, label: "Custom" },
        ];
    }
}
