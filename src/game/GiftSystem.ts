import { Vector2 } from "~/utils/Vector2";
import type { GameEntity } from "~/entities";
import { AudioManager } from "~/audio/AudioManager";
import { GameState } from "./GameState";
import { EntityManager } from "./EntityManager";
import { GIFT, type GiftType } from "~/config/constants";
import type { UpgradeType } from "~/entities/Weapons";

/**
 * Manages the gift spawning system including warp bubbles and gift lifecycle
 */
export class GiftSystem {
    private audio: AudioManager;
    private gameState: GameState;
    private entityManager: EntityManager;
    private canvas: HTMLCanvasElement;

    // Gift spawning state
    private lastGiftSpawnTime = 0;
    private giftSpawnInterval: number = GIFT.SPAWN_INTERVAL;

    constructor(
        audio: AudioManager,
        gameState: GameState,
        entityManager: EntityManager,
        canvas: HTMLCanvasElement
    ) {
        this.audio = audio;
        this.gameState = gameState;
        this.entityManager = entityManager;
        this.canvas = canvas;
    }

    /**
     * Update gift spawning and lifecycle
     */
    update(currentTime: number): void {
        // Spawn gifts periodically
        if (currentTime - this.lastGiftSpawnTime > this.giftSpawnInterval) {
            this.spawnGift();
            this.lastGiftSpawnTime = currentTime;
        }

        // Handle pending gift spawns and warp bubble creations
        this.handlePendingOperations();
    }

    /**
     * Handle pending operations from EntityManager
     */
    private handlePendingOperations(): void {
        // Check for completed warp bubble openings that need gift spawns
        const completedWarpBubbles = this.entityManager
            .getEntitiesByType("warpBubbleIn")
            .filter(
                (bubble) => (bubble.age || 0) >= GIFT.OPENING_ANIMATION_TIME
            );

        for (const warpBubble of completedWarpBubbles) {
            this.spawnGiftFromWarp(warpBubble);
            this.entityManager.removeEntity(warpBubble);
        }

        // Check for gifts that need closing warp bubbles
        const gifts = this.entityManager.getGifts();
        for (const gift of gifts) {
            if (
                (gift.age || 0) >= GIFT.WARP_BUBBLE_CREATION_DELAY &&
                !gift.closingWarpCreated
            ) {
                this.createClosingWarpBubble(gift);
                gift.closingWarpCreated = true;
            }
        }
    }

    /**
     * Spawn a new gift with warp bubble
     */
    private spawnGift(): void {
        // Select gift type based on current game state
        const giftType = this.selectGiftType();

        // Choose a random position at the edge of the screen
        const spawnPosition = this.getRandomEdgePosition();

        // Get warp bubble color based on gift type
        const warpColor = this.getWarpColor(giftType);

        // Create opening warp bubble with gift type stored for later
        const warpBubble: GameEntity = {
            position: spawnPosition,
            velocity: Vector2.zero(),
            size: new Vector2(80, 80), // Large enough for the bubble
            rotation: 0,
            color: warpColor,
            type: "warpBubbleIn",
            age: 0,
            warpAnimationProgress: 0,
            giftType: giftType, // Store gift type for spawning later
        };

        this.entityManager.addEntity(warpBubble);

        // Play warp bubble opening sound
        this.audio.playWarpBubbleOpening().catch(() => {
            // Ignore audio errors
        });
    }

    /**
     * Get random edge position for gift spawning
     */
    private getRandomEdgePosition(): Vector2 {
        const side = Math.floor(Math.random() * 4); // 0=top, 1=right, 2=bottom, 3=left
        let x, y;

        switch (side) {
            case 0: // top
                x = Math.random() * this.canvas.width;
                y = -50;
                break;
            case 1: // right
                x = this.canvas.width + 50;
                y = Math.random() * this.canvas.height;
                break;
            case 2: // bottom
                x = Math.random() * this.canvas.width;
                y = this.canvas.height + 50;
                break;
            case 3: // left
                x = -50;
                y = Math.random() * this.canvas.height;
                break;
            default:
                x = 100;
                y = 100;
        }

        return new Vector2(x, y);
    }

    /**
     * Get warp bubble color based on gift type
     */
    private getWarpColor(type: GiftType): string {
        switch (type) {
            case "fuel_refill":
                return GIFT.WARP_COLORS.FUEL_REFILL;
            case "extra_life":
                return GIFT.WARP_COLORS.EXTRA_LIFE;
            case "weapon_bullets":
                return GIFT.WARP_COLORS.WEAPON_BULLETS;
            case "weapon_missiles":
                return GIFT.WARP_COLORS.WEAPON_MISSILES;
            case "weapon_laser":
                return GIFT.WARP_COLORS.WEAPON_LASER;
            case "weapon_lightning":
                return GIFT.WARP_COLORS.WEAPON_LIGHTNING;
            case "upgrade_bullets_fire_rate":
                return GIFT.WARP_COLORS.UPGRADE_BULLETS_FIRE_RATE;
            case "upgrade_bullets_size":
                return GIFT.WARP_COLORS.UPGRADE_BULLETS_SIZE;
            case "upgrade_missiles_speed":
                return GIFT.WARP_COLORS.UPGRADE_MISSILES_SPEED;
            case "upgrade_missiles_fire_rate":
                return GIFT.WARP_COLORS.UPGRADE_MISSILES_FIRE_RATE;
            case "upgrade_missiles_homing":
                return GIFT.WARP_COLORS.UPGRADE_MISSILES_HOMING;
            case "upgrade_laser_range":
                return GIFT.WARP_COLORS.UPGRADE_LASER_RANGE;
            case "upgrade_laser_efficiency":
                return GIFT.WARP_COLORS.UPGRADE_LASER_EFFICIENCY;
            case "upgrade_lightning_radius":
                return GIFT.WARP_COLORS.UPGRADE_LIGHTNING_RADIUS;
            case "upgrade_lightning_chain":
                return GIFT.WARP_COLORS.UPGRADE_LIGHTNING_CHAIN;
            default:
                return GIFT.WARP_BUBBLE_COLOR;
        }
    }

    /**
     * Spawn gift from completed warp bubble
     */
    private spawnGiftFromWarp(warpBubble: GameEntity): void {
        // Calculate a trajectory toward the center area (more likely to be seen)
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const targetX = centerX + (Math.random() - 0.5) * 200; // Within 200px of center
        const targetY = centerY + (Math.random() - 0.5) * 200;

        // Gift spawns at EXACT warp bubble location
        const giftPosition = warpBubble.position.copy();

        const direction = new Vector2(
            targetX - giftPosition.x,
            targetY - giftPosition.y
        ).normalize();
        const speed = 30 + Math.random() * 30; // Slower: 30-60 pixels per second
        const velocity = direction.multiply(speed);

        // Get gift type from warp bubble, fallback to fuel_refill
        const giftType = warpBubble.giftType || "fuel_refill";

        // Create the gift
        const gift: GameEntity = {
            position: new Vector2(giftPosition.x, giftPosition.y),
            velocity: new Vector2(velocity.x, velocity.y),
            size: new Vector2(20, 20),
            rotation: 0,
            color: "#ffff00",
            type: "gift",
            age: 0,
            giftSpawnTime: performance.now(),
            giftCollectionDeadline: performance.now() + 8000, // 8 seconds: 5 for collection window + 3 for warp closing
            closingWarpCreated: false, // Track if we've created the exit warp bubble
            giftType: giftType, // Store the gift type
        };

        this.entityManager.addEntity(gift);
    }

    /**
     * Create closing warp bubble for gift
     */
    private createClosingWarpBubble(gift: GameEntity): void {
        // Position the warp bubble where the gift will be in 3 seconds
        // This accounts for the 1-second warp bubble opening animation + 2 seconds travel time
        const futurePosition = gift.position.add(gift.velocity.multiply(3.0)); // 3 seconds ahead

        // Use the calculated future position
        const warpPosition = futurePosition;

        // Create closing warp bubble
        const warpBubble: GameEntity = {
            position: warpPosition,
            velocity: Vector2.zero(),
            size: new Vector2(80, 80),
            rotation: 0,
            color: "#00ffff",
            type: "warpBubbleOut",
            age: 0,
            warpAnimationProgress: 0,
        };

        this.entityManager.addEntity(warpBubble);

        // Play warp bubble closing sound
        this.audio.playWarpBubbleClosing().catch(() => {
            // Ignore audio errors
        });
    }

    /**
     * Select gift type based on current game state and weighted probabilities
     */
    private selectGiftType(): GiftType {
        // Check for debug override first
        const debugGift = this.gameState.consumeDebugNextGift();
        if (debugGift) {
            return debugGift;
        }

        const availableGifts: { type: GiftType; weight: number }[] = [];

        // Always available gifts
        availableGifts.push(
            { type: "fuel_refill", weight: GIFT.SPAWN_WEIGHTS.FUEL_REFILL },
            { type: "extra_life", weight: GIFT.SPAWN_WEIGHTS.EXTRA_LIFE }
        );

        // Weapon unlocks (only if not already unlocked)
        if (!this.gameState.hasWeapon("bullets")) {
            availableGifts.push({
                type: "weapon_bullets",
                weight: GIFT.SPAWN_WEIGHTS.WEAPON_BULLETS,
            });
        }
        if (!this.gameState.hasWeapon("missiles")) {
            availableGifts.push({
                type: "weapon_missiles",
                weight: GIFT.SPAWN_WEIGHTS.WEAPON_MISSILES,
            });
        }
        if (!this.gameState.hasWeapon("laser")) {
            availableGifts.push({
                type: "weapon_laser",
                weight: GIFT.SPAWN_WEIGHTS.WEAPON_LASER,
            });
        }
        if (!this.gameState.hasWeapon("lightning")) {
            availableGifts.push({
                type: "weapon_lightning",
                weight: GIFT.SPAWN_WEIGHTS.WEAPON_LIGHTNING,
            });
        }

        // Weapon upgrades (only if weapon is unlocked and upgrade not already acquired)
        if (this.gameState.hasWeapon("bullets")) {
            if (!this.gameState.hasUpgrade("upgrade_bullets_fire_rate")) {
                availableGifts.push({
                    type: "upgrade_bullets_fire_rate",
                    weight: GIFT.SPAWN_WEIGHTS.UPGRADE_BULLETS_FIRE_RATE,
                });
            }
            if (!this.gameState.hasUpgrade("upgrade_bullets_size")) {
                availableGifts.push({
                    type: "upgrade_bullets_size",
                    weight: GIFT.SPAWN_WEIGHTS.UPGRADE_BULLETS_SIZE,
                });
            }
        }

        if (this.gameState.hasWeapon("missiles")) {
            if (!this.gameState.hasUpgrade("upgrade_missiles_speed")) {
                availableGifts.push({
                    type: "upgrade_missiles_speed",
                    weight: GIFT.SPAWN_WEIGHTS.UPGRADE_MISSILES_SPEED,
                });
            }
            if (!this.gameState.hasUpgrade("upgrade_missiles_fire_rate")) {
                availableGifts.push({
                    type: "upgrade_missiles_fire_rate",
                    weight: GIFT.SPAWN_WEIGHTS.UPGRADE_MISSILES_FIRE_RATE,
                });
            }
            if (!this.gameState.hasUpgrade("upgrade_missiles_homing")) {
                availableGifts.push({
                    type: "upgrade_missiles_homing",
                    weight: GIFT.SPAWN_WEIGHTS.UPGRADE_MISSILES_HOMING,
                });
            }
        }

        if (this.gameState.hasWeapon("laser")) {
            if (!this.gameState.hasUpgrade("upgrade_laser_range")) {
                availableGifts.push({
                    type: "upgrade_laser_range",
                    weight: GIFT.SPAWN_WEIGHTS.UPGRADE_LASER_RANGE,
                });
            }
            if (!this.gameState.hasUpgrade("upgrade_laser_efficiency")) {
                availableGifts.push({
                    type: "upgrade_laser_efficiency",
                    weight: GIFT.SPAWN_WEIGHTS.UPGRADE_LASER_EFFICIENCY,
                });
            }
        }

        if (this.gameState.hasWeapon("lightning")) {
            if (!this.gameState.hasUpgrade("upgrade_lightning_radius")) {
                availableGifts.push({
                    type: "upgrade_lightning_radius",
                    weight: GIFT.SPAWN_WEIGHTS.UPGRADE_LIGHTNING_RADIUS,
                });
            }
            if (!this.gameState.hasUpgrade("upgrade_lightning_chain")) {
                availableGifts.push({
                    type: "upgrade_lightning_chain",
                    weight: GIFT.SPAWN_WEIGHTS.UPGRADE_LIGHTNING_CHAIN,
                });
            }
        }

        // Calculate total weight
        const totalWeight = availableGifts.reduce(
            (sum, gift) => sum + gift.weight,
            0
        );

        // Select random gift based on weights
        let random = Math.random() * totalWeight;
        for (const gift of availableGifts) {
            random -= gift.weight;
            if (random <= 0) {
                return gift.type;
            }
        }

        // Fallback (should never happen)
        return "fuel_refill";
    }

    /**
     * Set gift spawn interval (for debugging/testing)
     */
    setSpawnInterval(interval: number): void {
        this.giftSpawnInterval = interval;
    }

    /**
     * Get current spawn interval
     */
    getSpawnInterval(): number {
        return this.giftSpawnInterval;
    }

    /**
     * Force spawn a gift immediately (for debugging/testing)
     */
    forceSpawnGift(giftType?: GiftType): void {
        // Temporarily override debug gift type if specified
        if (giftType) {
            this.gameState.setDebugNextGift(giftType);
        }

        this.spawnGift();
        this.lastGiftSpawnTime = performance.now(); // Reset timer
    }

    /**
     * Get statistics about available gift types
     */
    getAvailableGiftStats(): {
        weaponUnlocks: number;
        availableUpgrades: number;
        totalOptions: number;
    } {
        let weaponUnlocks = 0;
        let availableUpgrades = 0;

        // Count weapon unlocks
        if (!this.gameState.hasWeapon("bullets")) weaponUnlocks++;
        if (!this.gameState.hasWeapon("missiles")) weaponUnlocks++;
        if (!this.gameState.hasWeapon("laser")) weaponUnlocks++;
        if (!this.gameState.hasWeapon("lightning")) weaponUnlocks++;

        // Count available upgrades
        const weapons = ["bullets", "missiles", "laser", "lightning"] as const;
        for (const weapon of weapons) {
            if (this.gameState.hasWeapon(weapon)) {
                // Count upgrades for this weapon
                const upgradeTypes = this.getUpgradeTypesForWeapon(weapon);
                for (const upgradeType of upgradeTypes) {
                    if (!this.gameState.hasUpgrade(upgradeType)) {
                        availableUpgrades++;
                    }
                }
            }
        }

        return {
            weaponUnlocks,
            availableUpgrades,
            totalOptions: weaponUnlocks + availableUpgrades + 2, // +2 for fuel and extra life
        };
    }

    /**
     * Get upgrade types for a specific weapon
     */
    private getUpgradeTypesForWeapon(weapon: string): UpgradeType[] {
        switch (weapon) {
            case "bullets":
                return ["upgrade_bullets_fire_rate", "upgrade_bullets_size"];
            case "missiles":
                return [
                    "upgrade_missiles_speed",
                    "upgrade_missiles_fire_rate",
                    "upgrade_missiles_homing",
                ];
            case "laser":
                return ["upgrade_laser_range", "upgrade_laser_efficiency"];
            case "lightning":
                return ["upgrade_lightning_radius", "upgrade_lightning_chain"];
            default:
                return [];
        }
    }

    /**
     * Reset gift system state (for game restart)
     */
    reset(): void {
        this.lastGiftSpawnTime = 0;
        this.giftSpawnInterval = GIFT.SPAWN_INTERVAL;
    }
}
