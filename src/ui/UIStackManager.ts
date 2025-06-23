import { UIStack, UIStackEntry, UIComponent } from "./UIStack";
import { InputContext } from "~/input/InputContext";

/**
 * Predefined render priorities for common UI components
 */
export const UI_RENDER_PRIORITIES = {
    HUD: 100, // Background HUD elements
    GAME_OVERLAY: 200, // In-game overlays like level complete
    MENU: 300, // Menus and settings
    DIALOG: 400, // Dialog boxes and confirmations
    MODAL: 500, // Modal overlays that block everything
    DEBUG: 900, // Debug overlays (always on top)
} as const;

/**
 * Common UI stack entry configurations
 */
export const UI_CONFIGS = {
    MENU: {
        inputContext: InputContext.MENU,
        pausesGame: true,
        modal: true,
        renderPriority: UI_RENDER_PRIORITIES.MENU,
    },
    SHOP: {
        inputContext: InputContext.SHOP,
        pausesGame: true,
        modal: true,
        renderPriority: UI_RENDER_PRIORITIES.MODAL,
    },
    ZONE_CHOICE: {
        inputContext: InputContext.ZONE_CHOICE,
        pausesGame: true,
        modal: true,
        renderPriority: UI_RENDER_PRIORITIES.MODAL,
    },
    LEVEL_COMPLETE: {
        inputContext: InputContext.LEVEL_COMPLETE,
        pausesGame: false,
        modal: false,
        renderPriority: UI_RENDER_PRIORITIES.GAME_OVERLAY,
    },
    GAME_OVER: {
        inputContext: InputContext.GAME_OVER,
        pausesGame: true,
        modal: true,
        renderPriority: UI_RENDER_PRIORITIES.MODAL,
    },
} as const;

/**
 * High-level manager for the UI stack system that provides convenient methods
 * for common UI operations and integrates with the game's input and render systems
 */
export class UIStackManager {
    private stack: UIStack;
    private inputContextChangeCallback?: (context: InputContext) => void;
    private pauseStateChangeCallback?: (paused: boolean) => void;

    constructor() {
        this.stack = new UIStack();
        this.setupEventListeners();
    }

    /**
     * Set up event listeners for stack changes
     */
    private setupEventListeners(): void {
        this.stack.on("inputContextChanged", (context) => {
            if (this.inputContextChangeCallback) {
                this.inputContextChangeCallback(context);
            }
        });

        this.stack.on("pauseStateChanged", (paused) => {
            if (this.pauseStateChangeCallback) {
                this.pauseStateChangeCallback(paused);
            }
        });
    }

    /**
     * Set callback for input context changes
     */
    onInputContextChange(callback: (context: InputContext) => void): void {
        this.inputContextChangeCallback = callback;
    }

    /**
     * Set callback for pause state changes
     */
    onPauseStateChange(callback: (paused: boolean) => void): void {
        this.pauseStateChangeCallback = callback;
    }

    /**
     * Show a menu component
     */
    showMenu(component: UIComponent): void {
        this.stack.push({
            id: component.id,
            component,
            ...UI_CONFIGS.MENU,
        });
    }

    /**
     * Show the shop UI
     */
    showShop(component: UIComponent, onClose?: () => void): void {
        this.stack.push({
            id: component.id,
            component,
            ...UI_CONFIGS.SHOP,
            data: { onClose },
        });
    }

    /**
     * Show the zone choice screen
     */
    showZoneChoice(
        component: UIComponent,
        onChoice?: (choice: string) => void
    ): void {
        this.stack.push({
            id: component.id,
            component,
            ...UI_CONFIGS.ZONE_CHOICE,
            data: { onChoice },
        });
    }

    /**
     * Show a level complete animation
     */
    showLevelComplete(component: UIComponent): void {
        this.stack.push({
            id: component.id,
            component,
            ...UI_CONFIGS.LEVEL_COMPLETE,
        });
    }

    /**
     * Show game over screen
     */
    showGameOver(component: UIComponent): void {
        this.stack.push({
            id: component.id,
            component,
            ...UI_CONFIGS.GAME_OVER,
        });
    }

    /**
     * Show a custom UI component with specific configuration
     */
    showCustom(entry: UIStackEntry): void {
        this.stack.push(entry);
    }

    /**
     * Hide a specific component by ID
     */
    hide(componentId: string): boolean {
        const entry = this.stack.popById(componentId);
        return entry !== undefined;
    }

    /**
     * Hide the top component
     */
    hideTop(): UIStackEntry | undefined {
        return this.stack.pop();
    }

    /**
     * Clear all components from the stack
     */
    clear(): void {
        this.stack.clear();
    }

    /**
     * Check if a specific component is currently visible
     */
    isVisible(componentId: string): boolean {
        return this.stack.hasComponent(componentId);
    }

    /**
     * Get the current input context
     */
    getCurrentInputContext(): InputContext {
        return this.stack.getInputContext();
    }

    /**
     * Check if the game should be paused
     */
    shouldPauseGame(): boolean {
        return this.stack.shouldPauseGame();
    }

    /**
     * Handle input for the current top component
     */
    handleInput(key: string): boolean {
        return this.stack.handleInput(key);
    }

    /**
     * Render all visible components
     */
    render(): void {
        this.stack.render();
    }

    /**
     * Get debug information about the current stack
     */
    getDebugInfo(): string {
        return this.stack.getDebugInfo();
    }

    /**
     * Toggle a menu component (show if hidden, hide if shown)
     */
    toggleMenu(component: UIComponent): boolean {
        if (this.isVisible(component.id)) {
            this.hide(component.id);
            return false;
        } else {
            this.showMenu(component);
            return true;
        }
    }

    /**
     * Close all modal components (useful for escape key handling)
     */
    closeAllModals(): void {
        const entries = this.stack.getAllEntries();
        const modalEntries = entries.filter((entry) => entry.modal);

        for (const entry of modalEntries) {
            this.stack.popById(entry.id);
        }
    }

    /**
     * Get all currently visible components
     */
    getVisibleComponents(): UIComponent[] {
        return this.stack.getVisibleComponents();
    }

    /**
     * Replace the current top component with a new one
     */
    replace(newEntry: UIStackEntry): UIStackEntry | undefined {
        const oldEntry = this.stack.pop();
        this.stack.push(newEntry);
        return oldEntry;
    }

    /**
     * Check if any modal components are currently active
     */
    hasModalActive(): boolean {
        return this.stack.getAllEntries().some((entry) => entry.modal);
    }

    /**
     * Get the number of components currently in the stack
     */
    getStackSize(): number {
        return this.stack.getAllEntries().length;
    }

    /**
     * For backwards compatibility - check if escape menu specifically is visible
     */
    isEscapeMenuVisible(): boolean {
        // This will be updated when we migrate the MenuManager
        return this.isVisible("escape_menu") || this.isVisible("menu");
    }

    /**
     * For backwards compatibility - get pause state in the old format
     */
    isPaused(): boolean {
        return this.shouldPauseGame();
    }
}
