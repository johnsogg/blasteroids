import type { Ship } from "~/entities";
import { InputManager } from "~/input/InputManager";
import { InputContext } from "~/input/InputContext";
import { GameState } from "./GameState";
import { WeaponSystem } from "./WeaponSystem";
import { EntityManager } from "./EntityManager";
import { MenuManager } from "~/menu/MenuManager";
import { LevelCompleteAnimation } from "~/animations/LevelCompleteAnimation";
import { Vector2 } from "~/utils/Vector2";
import { FUEL, SHIP } from "~/config/constants";

/**
 * Handles context-based input processing for the game
 */
export class InputHandler {
    private input: InputManager;
    private gameState: GameState;
    private weaponSystem: WeaponSystem;
    private entityManager: EntityManager;
    private menuManager: MenuManager;
    private levelCompleteAnimation: LevelCompleteAnimation;

    // Input state
    private isPaused = false;

    constructor(
        input: InputManager,
        gameState: GameState,
        weaponSystem: WeaponSystem,
        entityManager: EntityManager,
        menuManager: MenuManager,
        levelCompleteAnimation: LevelCompleteAnimation
    ) {
        this.input = input;
        this.gameState = gameState;
        this.weaponSystem = weaponSystem;
        this.entityManager = entityManager;
        this.menuManager = menuManager;
        this.levelCompleteAnimation = levelCompleteAnimation;
    }

    /**
     * Process all input based on current game state
     */
    processInput(
        currentTime: number,
        gameOverCallback: () => void,
        restartCallback: () => void
    ): void {
        // Set input context based on current game state
        this.updateInputContext();

        // Handle context-specific input
        this.handleContextInput(currentTime, gameOverCallback, restartCallback);

        // Menu toggle is handled globally since it can be used in multiple contexts
        if (this.input.menuToggle) {
            this.togglePause();
        }
    }

    /**
     * Update input context based on current game state
     */
    private updateInputContext(): void {
        if (this.levelCompleteAnimation.active) {
            this.input.setContext(InputContext.LEVEL_COMPLETE);
        } else if (this.gameState.gameOver) {
            this.input.setContext(InputContext.GAME_OVER);
        } else if (this.menuManager.visible) {
            this.input.setContext(InputContext.MENU);
        } else if (this.isPaused) {
            this.input.setContext(InputContext.PAUSED);
        } else {
            this.input.setContext(InputContext.GAMEPLAY);
        }
    }

    /**
     * Handle input based on current context
     */
    private handleContextInput(
        currentTime: number,
        _gameOverCallback: () => void,
        restartCallback: () => void
    ): void {
        const context = this.input.getContext();

        switch (context) {
            case InputContext.GAMEPLAY:
                this.handleGameplayInput(currentTime);
                break;
            case InputContext.MENU:
                this.handleMenuInput();
                break;
            case InputContext.LEVEL_COMPLETE:
                this.handleLevelCompleteInput();
                break;
            case InputContext.GAME_OVER:
                this.handleGameOverInput(restartCallback);
                break;
            case InputContext.PAUSED:
                this.handlePausedInput();
                break;
        }
    }

    /**
     * Handle gameplay input (normal game state)
     */
    private handleGameplayInput(currentTime: number): void {
        // Get the ship for movement and weapon input
        const ship = this.getShip();
        if (!ship) return;

        // Handle ship movement
        this.updateShipMovement(ship, currentTime);

        // Handle weapon input
        this.weaponSystem.handleWeaponInput(
            ship,
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
    }

    /**
     * Handle menu input
     */
    private handleMenuInput(): void {
        if (this.input.menuUp) this.menuManager.handleInput("up");
        if (this.input.menuDown) this.menuManager.handleInput("down");
        if (this.input.menuLeft) this.menuManager.handleInput("left");
        if (this.input.menuRight) this.menuManager.handleInput("right");
        if (this.input.menuSelect) this.menuManager.handleInput("select");
    }

    /**
     * Handle level complete screen input
     */
    private handleLevelCompleteInput(): void {
        if (
            this.levelCompleteAnimation.canBeDismissed &&
            this.input.shootPressed
        ) {
            this.levelCompleteAnimation.complete();
        }
    }

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

    /**
     * Update ship movement based on input
     */
    private updateShipMovement(ship: Ship, _currentTime: number): void {
        const deltaTime = 1 / 60; // Approximate frame time
        const rotationSpeed = SHIP.ROTATION_SPEED; // radians per second
        const thrustPower = SHIP.THRUST_POWER; // pixels per second squared
        const maxSpeed = SHIP.MAX_SPEED; // pixels per second
        const friction = SHIP.FRICTION; // velocity damping multiplier

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
                    thrustPower * deltaTime
                );
                ship.velocity = ship.velocity.add(thrustVector);
            } else {
                ship.thrusting = false; // Can't thrust without fuel
            }
        }

        // Strafe thrusters (50% power, 1x fuel consumption each)
        const strafePower = thrustPower * 0.5;

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

        // Apply friction
        ship.velocity = ship.velocity.multiply(friction);

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
     * Toggle pause state and menu visibility
     */
    private togglePause(): void {
        this.isPaused = !this.isPaused;
        this.menuManager.toggle();
    }

    /**
     * Get the ship from entity manager
     */
    private getShip(): Ship | null {
        return this.entityManager.getShip();
    }

    /**
     * Reset input handler state (for game restart)
     */
    reset(): void {
        this.isPaused = false;
    }

    /**
     * Check if game is currently paused
     */
    isPausedState(): boolean {
        return this.isPaused;
    }

    /**
     * Set pause state directly
     */
    setPaused(paused: boolean): void {
        this.isPaused = paused;
        if (paused) {
            this.menuManager.show();
        } else {
            this.menuManager.hide();
        }
    }

    /**
     * Get current input context
     */
    getCurrentContext(): InputContext {
        return this.input.getContext();
    }
}
