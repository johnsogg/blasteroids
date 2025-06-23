import type { Ship } from "~/entities";
import { InputManager } from "~/input/InputManager";
import { InputContext } from "~/input/InputContext";
import { GameState } from "./GameState";
import { WeaponSystem } from "./WeaponSystem";
import { ShieldSystem } from "./ShieldSystem";
import { EntityManager } from "./EntityManager";
import { MenuManager } from "~/menu/MenuManager";
import { LevelCompleteAnimation } from "~/animations/LevelCompleteAnimation";
import { ZoneChoiceScreen } from "~/ui/ZoneChoiceScreen";
import { ShopUI } from "~/ui/ShopUI";
import { Vector2 } from "~/utils/Vector2";
import { FUEL, SHIP } from "~/config/constants";
import { UIStackManager } from "~/ui/UIStackManager";

/**
 * Handles context-based input processing for the game
 */
export class InputHandler {
    private input: InputManager;
    private gameState: GameState;
    private weaponSystem: WeaponSystem;
    private shieldSystem: ShieldSystem;
    private entityManager: EntityManager;
    private uiStackManager: UIStackManager;

    // Keep references for backwards compatibility during migration
    private menuManager: MenuManager;

    // Input state - now managed entirely by UIStackManager

    constructor(
        input: InputManager,
        gameState: GameState,
        weaponSystem: WeaponSystem,
        shieldSystem: ShieldSystem,
        entityManager: EntityManager,
        uiStackManager: UIStackManager,
        menuManager: MenuManager,
        _levelCompleteAnimation: LevelCompleteAnimation,
        _zoneChoiceScreen: ZoneChoiceScreen,
        _shopUI: ShopUI
    ) {
        this.input = input;
        this.gameState = gameState;
        this.weaponSystem = weaponSystem;
        this.shieldSystem = shieldSystem;
        this.entityManager = entityManager;
        this.uiStackManager = uiStackManager;
        this.menuManager = menuManager;
        // LevelCompleteAnimation, ZoneChoiceScreen and ShopUI are now managed by UIStackManager
    }

    /**
     * Process all input based on current game state
     */
    processInput(
        currentTime: number,
        gameOverCallback: () => void,
        restartCallback: () => void,
        screenshotCallback?: () => void
    ): void {
        // Set input context based on current game state
        this.updateInputContext();

        // Handle context-specific input
        this.handleContextInput(
            currentTime,
            gameOverCallback,
            restartCallback,
            screenshotCallback
        );

        // Handle escape key when no UI components are active (for opening menu from gameplay)
        if (this.input.menuToggle && this.uiStackManager.getStackSize() === 0) {
            this.uiStackManager.showMenu(this.menuManager);
        }
    }

    /**
     * Update input context based on current game state
     */
    private updateInputContext(): void {
        // Use UI stack to determine context, with fallbacks for game states not in the stack
        if (
            this.gameState.gameOver &&
            !this.uiStackManager.isVisible("game_over")
        ) {
            this.input.setContext(InputContext.GAME_OVER);
        } else {
            // Get context from UI stack
            const stackContext = this.uiStackManager.getCurrentInputContext();
            this.input.setContext(stackContext);
        }
    }

    /**
     * Handle input based on current context
     */
    private handleContextInput(
        currentTime: number,
        _gameOverCallback: () => void,
        restartCallback: () => void,
        screenshotCallback?: () => void
    ): void {
        const context = this.input.getContext();

        // First try to handle input through the UI stack
        if (this.uiStackManager.getStackSize() > 0) {
            // Convert raw key inputs to processed inputs for the UI stack
            const keyInputs = this.getInputKeys();
            for (const key of keyInputs) {
                if (this.uiStackManager.handleInput(key)) {
                    return; // Input was handled by UI stack
                }
            }
        }

        // Fallback to old context-based handling for inputs not handled by UI stack
        switch (context) {
            case InputContext.GAMEPLAY:
                this.handleGameplayInput(currentTime, screenshotCallback);
                break;
            case InputContext.GAME_OVER:
                this.handleGameOverInput(restartCallback);
                break;
            case InputContext.PAUSED:
                this.handlePausedInput();
                break;
            // Other contexts are now handled by UI stack components
        }
    }

    /**
     * Get currently pressed keys for UI input handling
     */
    private getInputKeys(): string[] {
        const keys: string[] = [];

        // Convert InputManager getters to key strings
        if (this.input.menuUp) keys.push("ArrowUp");
        if (this.input.menuDown) keys.push("ArrowDown");
        if (this.input.menuLeft) keys.push("ArrowLeft");
        if (this.input.menuRight) keys.push("ArrowRight");
        if (this.input.menuSelect) keys.push("Enter");
        if (this.input.shootPressed) keys.push(" ");
        if (this.input.menuToggle) keys.push("Escape");

        return keys;
    }

    /**
     * Handle gameplay input (normal game state)
     */
    private handleGameplayInput(
        currentTime: number,
        screenshotCallback?: () => void
    ): void {
        // Handle screenshot input
        if (this.input.screenshot && screenshotCallback) {
            screenshotCallback();
        }

        // Get the player ship for movement and weapon input
        const playerShip = this.entityManager.getPlayerShip();
        if (!playerShip) return;

        // Handle ship movement
        this.updateShipMovement(playerShip, currentTime);

        // Handle weapon input
        this.weaponSystem.handleWeaponInput(
            playerShip,
            {
                weapon1: this.input.weapon1,
                weapon2: this.input.weapon2,
                weapon3: this.input.weapon3,
                weapon4: this.input.weapon4,
                shoot: this.input.shoot,
                shootPressed: this.input.shootPressed,
            },
            currentTime,
            InputContext.GAMEPLAY
        );

        // Handle shield input
        this.shieldSystem.handleShieldInput(
            playerShip,
            {
                shield: this.input.shield,
                shieldPressed: this.input.shieldPressed,
            },
            currentTime,
            InputContext.GAMEPLAY
        );
    }

    // Menu input now handled by UI stack components
    // Level complete input also handled by the UI stack

    /**
     * Handle game over input
     */
    private handleGameOverInput(restartCallback: () => void): void {
        if (this.input.restart) {
            restartCallback();
        }
    }

    /**
     * Handle paused input
     */
    private handlePausedInput(): void {
        // Only menu toggle (escape) is allowed, handled globally
    }

    // Zone choice and shop input now handled by UI stack components
    // These methods removed as they're no longer needed

    /**
     * Update ship movement based on input
     */
    private updateShipMovement(ship: Ship, _currentTime: number): void {
        const deltaTime = 1 / 60; // Approximate frame time
        const rotationSpeed = SHIP.ROTATION_SPEED; // radians per second
        const thrustPower = SHIP.THRUST_POWER; // pixels per second squared
        const maxSpeed = SHIP.MAX_SPEED; // pixels per second
        const friction = SHIP.FRICTION; // velocity damping multiplier

        // Apply shield slowdown factor if shield is active
        const shieldSlowdownFactor =
            this.shieldSystem.getMovementSlowdownFactor(ship.playerId);
        const effectiveThrustPower = thrustPower * shieldSlowdownFactor;

        // Rotation
        if (this.input.left) {
            ship.rotation -= rotationSpeed * deltaTime;
        }
        if (this.input.right) {
            ship.rotation += rotationSpeed * deltaTime;
        }

        // Main thrust (2x fuel consumption)
        ship.thrusting = this.input.thrust;
        if (this.input.thrust) {
            const fuelNeeded = 2 * deltaTime; // 2 units per second
            if (this.gameState.consumeFuel(fuelNeeded)) {
                const thrustVector = Vector2.fromAngle(
                    ship.rotation,
                    effectiveThrustPower * deltaTime
                );
                ship.velocity = ship.velocity.add(thrustVector);
            } else {
                ship.thrusting = false; // Can't thrust without fuel
            }
        }

        // Strafe thrusters (50% power, 1x fuel consumption each)
        const strafePower = effectiveThrustPower * 0.5;

        ship.strafingLeft = this.input.strafeLeft;
        if (this.input.strafeLeft) {
            const fuelNeeded = 1 * deltaTime; // 1 unit per second
            if (this.gameState.consumeFuel(fuelNeeded)) {
                // Q key: Move ship LEFT (starboard thruster fires right-ward flames)
                const strafeVector = Vector2.fromAngle(
                    ship.rotation - Math.PI / 2,
                    strafePower * deltaTime
                );
                ship.velocity = ship.velocity.add(strafeVector);
            } else {
                ship.strafingLeft = false; // Can't strafe without fuel
            }
        }

        ship.strafingRight = this.input.strafeRight;
        if (this.input.strafeRight) {
            const fuelNeeded = 1 * deltaTime; // 1 unit per second
            if (this.gameState.consumeFuel(fuelNeeded)) {
                // E key: Move ship RIGHT (port thruster fires left-ward flames)
                const strafeVector = Vector2.fromAngle(
                    ship.rotation + Math.PI / 2,
                    strafePower * deltaTime
                );
                ship.velocity = ship.velocity.add(strafeVector);
            } else {
                ship.strafingRight = false; // Can't strafe without fuel
            }
        }

        // Life support fuel consumption (continuous)
        const lifeSupportFuelNeeded = FUEL.LIFE_SUPPORT_CONSUMPTION * deltaTime;
        if (!this.gameState.consumeFuel(lifeSupportFuelNeeded)) {
            // Out of fuel - life support failure!
            this.handleFuelDepletion(ship);
            return; // Don't continue processing this frame
        }

        // Apply friction (and additional shield friction if shield is active)
        const effectiveFriction = friction * shieldSlowdownFactor;
        ship.velocity = ship.velocity.multiply(effectiveFriction);

        // Limit max speed
        const speed = Math.sqrt(
            ship.velocity.x * ship.velocity.x +
                ship.velocity.y * ship.velocity.y
        );
        if (speed > maxSpeed) {
            ship.velocity = ship.velocity.multiply(maxSpeed / speed);
        }
    }

    /**
     * Handle fuel depletion (life support failure)
     */
    private handleFuelDepletion(_ship: Ship): void {
        // This would normally trigger ship destruction
        // For now, we'll just reset fuel as a safety measure
        this.gameState.refillFuel();
        console.warn("Fuel depletion detected - refilling as safety measure");
    }

    /**
     * Reset input handler state (for game restart)
     */
    reset(): void {
        // Clear all UI components from stack
        this.uiStackManager.clear();
    }

    /**
     * Check if game is currently paused
     */
    isPausedState(): boolean {
        return this.uiStackManager.shouldPauseGame();
    }

    /**
     * Set pause state directly
     */
    setPaused(paused: boolean): void {
        if (paused) {
            this.uiStackManager.showMenu(this.menuManager);
        } else {
            this.uiStackManager.hide(this.menuManager.id);
        }
    }

    /**
     * Get current input context
     */
    getCurrentContext(): InputContext {
        return this.input.getContext();
    }
}
