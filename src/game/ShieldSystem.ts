import type { GameEntity, Ship } from "~/entities";
import { AudioManager } from "~/audio/AudioManager";
import { GameState } from "./GameState";
import { EntityManager } from "./EntityManager";
import { InputContext } from "~/input/InputContext";
import { SHIELD } from "~/config/constants";

/**
 * Shield state for a player
 */
interface ShieldState {
    isActive: boolean;
    isRecharging: boolean;
    rechargeEndTime: number;
    audioControl?: { stop: () => void };
}

/**
 * Shield rendering information
 */
export interface ShieldRenderInfo {
    isActive: boolean;
    isRecharging: boolean;
}

/**
 * Shield input interface
 */
export interface ShieldInput {
    shield: boolean;
    shieldPressed: boolean;
}

/**
 * Manages shield system - activation, collision handling, audio, and rendering
 */
export class ShieldSystem {
    private audio: AudioManager;
    private gameState: GameState;

    // Shield state per player
    private shieldStates: Map<string, ShieldState> = new Map();

    constructor(
        audio: AudioManager,
        gameState: GameState,
        _entityManager: EntityManager
    ) {
        this.audio = audio;
        this.gameState = gameState;
    }

    /**
     * Handle shield input from player
     */
    handleShieldInput(
        ship: Ship,
        input: ShieldInput,
        _currentTime: number,
        context: InputContext
    ): void {
        // Only handle shield input during gameplay
        if (context !== InputContext.GAMEPLAY) {
            return;
        }

        const playerId = ship.playerId;
        const shieldState = this.getOrCreateShieldState(playerId);

        if (input.shield) {
            // Activate shield
            if (!shieldState.isActive) {
                shieldState.isActive = true;

                // Play appropriate audio based on recharging state
                if (input.shieldPressed) {
                    if (shieldState.isRecharging) {
                        this.playShieldRechargingSound();
                    } else {
                        this.playShieldLoopSound(shieldState);
                    }
                }
            } else {
                // Shield is already active - check if we need to play recharging sound
                if (input.shieldPressed && shieldState.isRecharging) {
                    this.playShieldRechargingSound();
                }
            }
        } else {
            // Deactivate shield
            if (shieldState.isActive) {
                shieldState.isActive = false;
                this.stopShieldAudio(shieldState);
            }
        }
    }

    /**
     * Handle collision between shield and asteroid
     */
    handleShieldCollision(
        ship: Ship,
        asteroid: GameEntity,
        currentTime: number = Date.now()
    ): void {
        const playerId = ship.playerId;
        const shieldState = this.getOrCreateShieldState(playerId);

        // Only handle collision if shield is active and not in recharging mode
        if (!shieldState.isActive || shieldState.isRecharging) {
            return;
        }

        // Play collision sound
        this.playShieldCollisionSound();

        // Consume fuel based on asteroid size
        const fuelConsumption = this.getFuelConsumptionForAsteroid(asteroid);
        this.gameState.consumeFuel(fuelConsumption, playerId);

        // Apply bouncing physics
        this.applyBouncingPhysics(ship, asteroid);

        // Enter recharging mode
        shieldState.isRecharging = true;
        shieldState.rechargeEndTime = currentTime + SHIELD.RECHARGE_DURATION;

        // Stop current shield audio and switch to recharging if shield is still active
        this.stopShieldAudio(shieldState);
    }

    /**
     * Update shield system (handle recharge timers)
     */
    update(currentTime: number): void {
        for (const [_playerId, shieldState] of this.shieldStates) {
            if (
                shieldState.isRecharging &&
                currentTime >= shieldState.rechargeEndTime
            ) {
                shieldState.isRecharging = false;

                // If shield is still active, restart the loop sound
                if (shieldState.isActive) {
                    this.playShieldLoopSound(shieldState);
                }
            }
        }
    }

    /**
     * Check if shield is active for a player
     */
    isShieldActive(playerId: string): boolean {
        const shieldState = this.shieldStates.get(playerId);
        return shieldState?.isActive ?? false;
    }

    /**
     * Check if shield is recharging for a player
     */
    isShieldRecharging(playerId: string): boolean {
        const shieldState = this.shieldStates.get(playerId);
        return shieldState?.isRecharging ?? false;
    }

    /**
     * Get movement slowdown factor for a player
     */
    getMovementSlowdownFactor(playerId: string): number {
        const shieldState = this.shieldStates.get(playerId);
        return shieldState?.isActive ? SHIELD.MOVEMENT_SLOWDOWN_FACTOR : 1.0;
    }

    /**
     * Get shield rendering information for a player
     */
    getShieldRenderInfo(playerId: string): ShieldRenderInfo | null {
        const shieldState = this.shieldStates.get(playerId);
        if (!shieldState?.isActive) {
            return null;
        }

        return {
            isActive: shieldState.isActive,
            isRecharging: shieldState.isRecharging,
        };
    }

    /**
     * Reset all shield states (for game restart)
     */
    resetShieldState(): void {
        // Stop all audio
        for (const shieldState of this.shieldStates.values()) {
            this.stopShieldAudio(shieldState);
        }

        // Clear all states
        this.shieldStates.clear();
    }

    /**
     * Get or create shield state for a player
     */
    private getOrCreateShieldState(playerId: string): ShieldState {
        if (!this.shieldStates.has(playerId)) {
            this.shieldStates.set(playerId, {
                isActive: false,
                isRecharging: false,
                rechargeEndTime: 0,
            });
        }
        return this.shieldStates.get(playerId)!;
    }

    /**
     * Get fuel consumption based on asteroid size
     */
    private getFuelConsumptionForAsteroid(asteroid: GameEntity): number {
        const asteroidSize = (
            asteroid as GameEntity & { asteroidSize?: string }
        ).asteroidSize;

        switch (asteroidSize) {
            case "large":
                return SHIELD.FUEL_CONSUMPTION.large;
            case "medium":
                return SHIELD.FUEL_CONSUMPTION.medium;
            case "small":
                return SHIELD.FUEL_CONSUMPTION.small;
            default:
                return SHIELD.FUEL_CONSUMPTION.default;
        }
    }

    /**
     * Apply bouncing physics between ship and asteroid
     */
    private applyBouncingPhysics(ship: Ship, asteroid: GameEntity): void {
        // Calculate collision normal (from asteroid to ship)
        const collisionNormal = ship.position
            .subtract(asteroid.position)
            .normalize();

        // Apply impulse to both objects
        const impulseStrength = SHIELD.BOUNCE_IMPULSE_STRENGTH;

        // Bounce ship away from asteroid
        const shipImpulse = collisionNormal.multiply(impulseStrength);
        ship.velocity = ship.velocity.add(shipImpulse);

        // Bounce asteroid away from ship
        const asteroidImpulse = collisionNormal.multiply(
            -impulseStrength * SHIELD.ASTEROID_BOUNCE_MULTIPLIER
        );
        asteroid.velocity = asteroid.velocity.add(asteroidImpulse);
    }

    /**
     * Play shield loop sound
     */
    private async playShieldLoopSound(shieldState: ShieldState): Promise<void> {
        try {
            const audioControl = await this.audio.playShieldLoop();
            shieldState.audioControl = audioControl;
        } catch (_error) {
            // Ignore audio errors
        }
    }

    /**
     * Play shield recharging sound
     */
    private async playShieldRechargingSound(): Promise<void> {
        try {
            await this.audio.playShieldRecharging();
        } catch (_error) {
            // Ignore audio errors
        }
    }

    /**
     * Play shield collision sound
     */
    private async playShieldCollisionSound(): Promise<void> {
        try {
            await this.audio.playShieldCollision();
        } catch (_error) {
            // Ignore audio errors
        }
    }

    /**
     * Stop shield audio
     */
    private stopShieldAudio(shieldState: ShieldState): void {
        if (shieldState.audioControl) {
            shieldState.audioControl.stop();
            shieldState.audioControl = undefined;
        }
    }
}
