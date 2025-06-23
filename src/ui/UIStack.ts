import { InputContext } from "~/input/InputContext";

/**
 * Standard interface that all UI components must implement to work with the UI stack
 */
export interface UIComponent {
    /**
     * Unique identifier for this UI component
     */
    readonly id: string;

    /**
     * Whether this component is currently visible/active
     */
    readonly active: boolean;

    /**
     * Show the component
     */
    show(): void;

    /**
     * Hide the component
     */
    hide(): void;

    /**
     * Handle input for this component
     * @param key The input key/action
     * @returns true if input was handled, false otherwise
     */
    handleInput(key: string): boolean;

    /**
     * Render the component
     */
    render(): void;

    /**
     * Optional cleanup when component is removed from stack
     */
    cleanup?(): void;
}

/**
 * Configuration for a UI stack entry
 */
export interface UIStackEntry {
    /**
     * Unique identifier for this stack entry
     */
    id: string;

    /**
     * The UI component instance
     */
    component: UIComponent;

    /**
     * Input context to use when this component is on top
     */
    inputContext: InputContext;

    /**
     * Whether this UI pauses the game
     */
    pausesGame: boolean;

    /**
     * Whether this UI is modal (blocks input to components below it)
     */
    modal: boolean;

    /**
     * Render priority (higher numbers render last/on top)
     */
    renderPriority: number;

    /**
     * Optional data associated with this stack entry
     */
    data?: unknown;
}

/**
 * Events emitted by the UI stack
 */
export interface UIStackEvents {
    /**
     * Fired when a component is pushed onto the stack
     */
    componentPushed: (entry: UIStackEntry) => void;

    /**
     * Fired when a component is popped from the stack
     */
    componentPopped: (entry: UIStackEntry) => void;

    /**
     * Fired when the stack is cleared
     */
    stackCleared: () => void;

    /**
     * Fired when the input context changes
     */
    inputContextChanged: (context: InputContext) => void;

    /**
     * Fired when the pause state changes
     */
    pauseStateChanged: (paused: boolean) => void;
}

/**
 * Core UI stack implementation for managing UI component lifecycle and state
 */
export class UIStack {
    private stack: UIStackEntry[] = [];
    private eventListeners: Partial<UIStackEvents> = {};

    /**
     * Push a component onto the UI stack
     */
    push(entry: UIStackEntry): void {
        // Ensure the component ID is unique in the stack
        const existingIndex = this.stack.findIndex((e) => e.id === entry.id);
        if (existingIndex !== -1) {
            console.warn(
                `UIStack: Component with id "${entry.id}" already exists in stack. Removing existing entry.`
            );
            this.stack.splice(existingIndex, 1);
        }

        // Show the component
        entry.component.show();

        // Add to stack (order matters for input handling - last added is "top")
        this.stack.push(entry);

        // Emit events
        this.emit("componentPushed", entry);
        this.checkAndEmitStateChanges();
    }

    /**
     * Pop the top component from the stack
     */
    pop(): UIStackEntry | undefined {
        const entry = this.stack.pop();
        if (!entry) return undefined;

        // Hide the component
        entry.component.hide();

        // Cleanup if supported
        if (entry.component.cleanup) {
            entry.component.cleanup();
        }

        // Call onClose callback if provided
        if (
            entry.data &&
            typeof entry.data === "object" &&
            "onClose" in entry.data
        ) {
            const onClose = (entry.data as { onClose?: () => void }).onClose;
            if (typeof onClose === "function") {
                onClose();
            }
        }

        // Call onChoice callback if provided (for ZoneChoiceScreen)
        if (
            entry.data &&
            typeof entry.data === "object" &&
            "onChoice" in entry.data &&
            "choice" in entry.data
        ) {
            const data = entry.data as { onChoice?: (choice: string) => void; choice?: string };
            if (typeof data.onChoice === "function" && data.choice) {
                data.onChoice(data.choice);
            }
        }

        // Emit events
        this.emit("componentPopped", entry);
        this.checkAndEmitStateChanges();

        return entry;
    }

    /**
     * Pop a specific component by ID
     */
    popById(id: string): UIStackEntry | undefined {
        const index = this.stack.findIndex((e) => e.id === id);
        if (index === -1) return undefined;

        const entry = this.stack.splice(index, 1)[0];

        // Hide the component
        entry.component.hide();

        // Cleanup if supported
        if (entry.component.cleanup) {
            entry.component.cleanup();
        }

        // Call onClose callback if provided
        if (
            entry.data &&
            typeof entry.data === "object" &&
            "onClose" in entry.data
        ) {
            const onClose = (entry.data as { onClose?: () => void }).onClose;
            if (typeof onClose === "function") {
                onClose();
            }
        }

        // Call onChoice callback if provided (for ZoneChoiceScreen)
        if (
            entry.data &&
            typeof entry.data === "object" &&
            "onChoice" in entry.data &&
            "choice" in entry.data
        ) {
            const data = entry.data as { onChoice?: (choice: string) => void; choice?: string };
            if (typeof data.onChoice === "function" && data.choice) {
                data.onChoice(data.choice);
            }
        }

        // Emit events
        this.emit("componentPopped", entry);
        this.checkAndEmitStateChanges();

        return entry;
    }

    /**
     * Clear all components from the stack
     */
    clear(): void {
        // Hide all components
        for (const entry of this.stack) {
            entry.component.hide();
            if (entry.component.cleanup) {
                entry.component.cleanup();
            }
        }

        this.stack = [];

        // Emit events
        this.emit("stackCleared");
        this.checkAndEmitStateChanges();
    }

    /**
     * Get the top component in the stack
     */
    getTopEntry(): UIStackEntry | undefined {
        return this.stack[this.stack.length - 1];
    }

    /**
     * Get the component that should handle input (top modal or top non-modal)
     */
    getInputHandlingEntry(): UIStackEntry | undefined {
        // Start from the top and find the first modal component, or return the top component
        for (let i = this.stack.length - 1; i >= 0; i--) {
            const entry = this.stack[i];
            if (entry.modal) {
                return entry;
            }
        }
        // If no modal components, return the top component
        return this.getTopEntry();
    }

    /**
     * Get the current input context based on the top component
     */
    getInputContext(): InputContext {
        const inputEntry = this.getInputHandlingEntry();
        return inputEntry?.inputContext || InputContext.GAMEPLAY;
    }

    /**
     * Check if the game should be paused based on stack contents
     */
    shouldPauseGame(): boolean {
        return this.stack.some((entry) => entry.pausesGame);
    }

    /**
     * Get all visible components in render order (sorted by priority)
     */
    getVisibleComponents(): UIComponent[] {
        return this.stack
            .filter((entry) => entry.component.active)
            .sort((a, b) => a.renderPriority - b.renderPriority) // Sort by render priority for rendering
            .map((entry) => entry.component);
    }

    /**
     * Get all stack entries in render order
     */
    getAllEntries(): UIStackEntry[] {
        return [...this.stack];
    }

    /**
     * Check if a component with the given ID is in the stack
     */
    hasComponent(id: string): boolean {
        return this.stack.some((entry) => entry.id === id);
    }

    /**
     * Get a component by ID
     */
    getComponent(id: string): UIComponent | undefined {
        const entry = this.stack.find((e) => e.id === id);
        return entry?.component;
    }

    /**
     * Handle input for the appropriate component in the stack
     */
    handleInput(key: string): boolean {
        const inputEntry = this.getInputHandlingEntry();
        if (!inputEntry) return false;

        const handled = inputEntry.component.handleInput(key);

        // Check if the component became inactive after handling input
        // If so, automatically remove it from the stack
        if (!inputEntry.component.active) {
            // Check if component has a choice to store (for ZoneChoiceScreen)
            if ('getLastChoice' in inputEntry.component && typeof inputEntry.component.getLastChoice === 'function') {
                const choice = inputEntry.component.getLastChoice();
                if (choice && inputEntry.data && typeof inputEntry.data === 'object') {
                    (inputEntry.data as any).choice = choice;
                }
            }
            this.popById(inputEntry.id);
        }

        return handled;
    }

    /**
     * Render all visible components in priority order
     */
    render(): void {
        const visibleComponents = this.getVisibleComponents();
        for (const component of visibleComponents) {
            component.render();
        }
    }

    /**
     * Add an event listener
     */
    on<K extends keyof UIStackEvents>(
        event: K,
        listener: UIStackEvents[K]
    ): void {
        this.eventListeners[event] = listener;
    }

    /**
     * Remove an event listener
     */
    off<K extends keyof UIStackEvents>(event: K): void {
        delete this.eventListeners[event];
    }

    /**
     * Emit an event
     */
    private emit<K extends keyof UIStackEvents>(
        event: K,
        ...args: Parameters<UIStackEvents[K]>
    ): void {
        const listener = this.eventListeners[event];
        if (listener) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (listener as any)(...args);
        }
    }

    /**
     * Check for state changes and emit appropriate events
     */
    private checkAndEmitStateChanges(): void {
        // Note: In a more sophisticated implementation, we'd track previous state
        // For now, we'll emit on every change
        this.emit("inputContextChanged", this.getInputContext());
        this.emit("pauseStateChanged", this.shouldPauseGame());
    }

    /**
     * Get debug information about the current stack state
     */
    getDebugInfo(): string {
        const entries = this.stack.map((entry) => ({
            id: entry.id,
            inputContext: entry.inputContext,
            pausesGame: entry.pausesGame,
            modal: entry.modal,
            renderPriority: entry.renderPriority,
            active: entry.component.active,
        }));

        return JSON.stringify(
            {
                stackSize: this.stack.length,
                currentInputContext: this.getInputContext(),
                shouldPauseGame: this.shouldPauseGame(),
                entries,
            },
            null,
            2
        );
    }
}
