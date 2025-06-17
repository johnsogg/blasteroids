export class InputManager {
    private keys: Map<string, boolean> = new Map();
    private keyPressed: Map<string, boolean> = new Map(); // For single-press detection

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

    // Convenient helper methods for common game keys
    get thrust(): boolean {
        return this.isKeyPressed("ArrowUp") || this.isKeyPressed("KeyW");
    }
    get left(): boolean {
        return this.isKeyPressed("ArrowLeft") || this.isKeyPressed("KeyA");
    }
    get right(): boolean {
        return this.isKeyPressed("ArrowRight") || this.isKeyPressed("KeyD");
    }
    get shoot(): boolean {
        return this.wasKeyPressed("Space");
    }
    get restart(): boolean {
        return this.isKeyPressed("KeyR");
    }
    get strafeLeft(): boolean {
        return this.isKeyPressed("KeyQ");
    }
    get strafeRight(): boolean {
        return this.isKeyPressed("KeyE");
    }

    // Menu navigation methods (single press)
    get menuToggle(): boolean {
        return this.wasKeyPressed("Escape");
    }

    get menuUp(): boolean {
        return this.wasKeyPressed("ArrowUp") || this.wasKeyPressed("KeyW");
    }

    get menuDown(): boolean {
        return this.wasKeyPressed("ArrowDown") || this.wasKeyPressed("KeyS");
    }

    get menuLeft(): boolean {
        return this.wasKeyPressed("ArrowLeft") || this.wasKeyPressed("KeyA");
    }

    get menuRight(): boolean {
        return this.wasKeyPressed("ArrowRight") || this.wasKeyPressed("KeyD");
    }

    get menuSelect(): boolean {
        return this.wasKeyPressed("Enter") || this.wasKeyPressed("Space");
    }

    // Weapon switching methods (single press)
    get weapon1(): boolean {
        return this.wasKeyPressed("Digit1");
    }

    get weapon2(): boolean {
        return this.wasKeyPressed("Digit2");
    }

    get weapon3(): boolean {
        return this.wasKeyPressed("Digit3");
    }

    get weapon4(): boolean {
        return this.wasKeyPressed("Digit4");
    }
}
