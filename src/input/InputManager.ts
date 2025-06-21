import {
    InputContext,
    INPUT_CONTEXT_PERMISSIONS,
    InputName,
} from "./InputContext";

export class InputManager {
    private keys: Map<string, boolean> = new Map();
    private keyPressed: Map<string, boolean> = new Map(); // For single-press detection
    private consumedInputs: Set<string> = new Set(); // For preventing input bleeding
    private currentContext: InputContext = InputContext.GAMEPLAY;

    constructor() {
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        window.addEventListener("keydown", (e) => {
            const wasPressed = this.keys.get(e.code) || false;
            this.keys.set(e.code, true);

            // Track single press (key wasn't pressed before)
            if (!wasPressed) {
                this.keyPressed.set(e.code, true);
            }
        });

        window.addEventListener("keyup", (e) => {
            this.keys.set(e.code, false);
            this.keyPressed.set(e.code, false);
        });
    }

    isKeyPressed(keyCode: string): boolean {
        return this.keys.get(keyCode) || false;
    }

    /**
     * Check if a key was just pressed (single press detection)
     */
    wasKeyPressed(keyCode: string): boolean {
        const pressed = this.keyPressed.get(keyCode) || false;
        if (pressed) {
            this.keyPressed.set(keyCode, false); // Clear after reading
        }
        return pressed;
    }

    /**
     * Set the current input context
     */
    setContext(context: InputContext): void {
        this.currentContext = context;
        // Clear consumed inputs when context changes
        this.consumedInputs.clear();
    }

    /**
     * Get the current input context
     */
    getContext(): InputContext {
        return this.currentContext;
    }

    /**
     * Consume an input to prevent it from triggering other actions
     */
    consumeInput(inputName: InputName): void {
        this.consumedInputs.add(inputName);
    }

    /**
     * Check if an input is allowed in the current context and not consumed
     */
    private isInputAllowed(inputName: InputName): boolean {
        const allowedInputs = INPUT_CONTEXT_PERMISSIONS[this.currentContext];
        return (
            allowedInputs.includes(inputName) &&
            !this.consumedInputs.has(inputName)
        );
    }

    // Convenient helper methods for common game keys
    get thrust(): boolean {
        if (!this.isInputAllowed("thrust")) return false;
        return this.isKeyPressed("ArrowUp") || this.isKeyPressed("KeyW");
    }
    get left(): boolean {
        if (!this.isInputAllowed("left")) return false;
        return this.isKeyPressed("ArrowLeft") || this.isKeyPressed("KeyA");
    }
    get right(): boolean {
        if (!this.isInputAllowed("right")) return false;
        return this.isKeyPressed("ArrowRight") || this.isKeyPressed("KeyD");
    }
    get shoot(): boolean {
        if (!this.isInputAllowed("shoot")) return false;
        return this.isKeyPressed("Space");
    }

    get shootPressed(): boolean {
        if (!this.isInputAllowed("shootPressed")) return false;
        const pressed = this.wasKeyPressed("Space");
        if (pressed) {
            this.consumeInput("shootPressed"); // Consume to prevent bleeding
        }
        return pressed;
    }
    get restart(): boolean {
        if (!this.isInputAllowed("restart")) return false;
        return this.isKeyPressed("KeyR");
    }
    get strafeLeft(): boolean {
        if (!this.isInputAllowed("strafeLeft")) return false;
        return this.isKeyPressed("KeyQ");
    }
    get strafeRight(): boolean {
        if (!this.isInputAllowed("strafeRight")) return false;
        return this.isKeyPressed("KeyE");
    }

    get shield(): boolean {
        if (!this.isInputAllowed("shield")) return false;
        return this.isKeyPressed("KeyS") || this.isKeyPressed("ArrowDown");
    }

    get shieldPressed(): boolean {
        if (!this.isInputAllowed("shieldPressed")) return false;
        const pressed =
            this.wasKeyPressed("KeyS") || this.wasKeyPressed("ArrowDown");
        if (pressed) {
            this.consumeInput("shieldPressed"); // Consume to prevent bleeding
        }
        return pressed;
    }

    // Menu navigation methods (single press)
    get menuToggle(): boolean {
        if (!this.isInputAllowed("menuToggle")) return false;
        const pressed = this.wasKeyPressed("Escape");
        if (pressed) {
            this.consumeInput("menuToggle");
        }
        return pressed;
    }

    get menuUp(): boolean {
        if (!this.isInputAllowed("menuUp")) return false;
        return this.wasKeyPressed("ArrowUp") || this.wasKeyPressed("KeyW");
    }

    get menuDown(): boolean {
        if (!this.isInputAllowed("menuDown")) return false;
        return this.wasKeyPressed("ArrowDown") || this.wasKeyPressed("KeyS");
    }

    get menuLeft(): boolean {
        if (!this.isInputAllowed("menuLeft")) return false;
        return this.wasKeyPressed("ArrowLeft") || this.wasKeyPressed("KeyA");
    }

    get menuRight(): boolean {
        if (!this.isInputAllowed("menuRight")) return false;
        return this.wasKeyPressed("ArrowRight") || this.wasKeyPressed("KeyD");
    }

    get menuSelect(): boolean {
        if (!this.isInputAllowed("menuSelect")) return false;
        return this.wasKeyPressed("Enter") || this.wasKeyPressed("Space");
    }

    // Weapon switching methods (single press)
    get weapon1(): boolean {
        if (!this.isInputAllowed("weapon1")) return false;
        return this.wasKeyPressed("Digit1");
    }

    get weapon2(): boolean {
        if (!this.isInputAllowed("weapon2")) return false;
        return this.wasKeyPressed("Digit2");
    }

    get weapon3(): boolean {
        if (!this.isInputAllowed("weapon3")) return false;
        return this.wasKeyPressed("Digit3");
    }

    get weapon4(): boolean {
        if (!this.isInputAllowed("weapon4")) return false;
        return this.wasKeyPressed("Digit4");
    }
}
