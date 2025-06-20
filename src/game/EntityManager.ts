import { Vector2 } from "~/utils/Vector2";
import type { GameEntity, Ship } from "~/entities";
import { isGift } from "~/entities";
import { isShip } from "~/entities";
import { GIFT, BULLET, WEAPONS } from "~/config/constants";

/**
 * Manages all game entities - creation, updates, removal, and queries
 */
export class EntityManager {
    private entities: GameEntity[] = [];
    private canvas: HTMLCanvasElement;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
    }

    /**
     * Add an entity to the game
     */
    addEntity(entity: GameEntity): void {
        this.entities.push(entity);
    }

    /**
     * Remove an entity from the game
     */
    removeEntity(entity: GameEntity): void {
        const index = this.entities.indexOf(entity);
        if (index > -1) {
            this.entities.splice(index, 1);
        }
    }

    /**
     * Get all entities
     */
    getAllEntities(): GameEntity[] {
        return [...this.entities];
    }

    /**
     * Get entities by type
     */
    getEntitiesByType<T extends GameEntity>(type: string): T[] {
        return this.entities.filter((entity) => entity.type === type) as T[];
    }

    /**
     * Get specific entity types for common queries
     */
    getBullets(): GameEntity[] {
        return this.getEntitiesByType("bullet");
    }

    getMissiles(): GameEntity[] {
        return this.getEntitiesByType("missile");
    }

    getAsteroids(): GameEntity[] {
        return this.getEntitiesByType("asteroid");
    }

    getGifts(): GameEntity[] {
        return this.getEntitiesByType("gift");
    }

    getWarpBubblesOut(): GameEntity[] {
        return this.getEntitiesByType("warpBubbleOut");
    }

    getShip(): Ship | null {
        const shipEntity = this.entities.find(
            (entity) => entity.type === "ship"
        );
        return shipEntity && isShip(shipEntity) ? shipEntity : null;
    }

    /**
     * Update all entities
     */
    updateEntities(deltaTime: number, currentTime: number): void {
        this.entities.forEach((entity) => {
            this.updateEntityByType(entity, deltaTime, currentTime);
            this.updateEntityPosition(entity, deltaTime);
            this.applyScreenWrapping(entity);
        });
    }

    /**
     * Update entity based on its type
     */
    private updateEntityByType(
        entity: GameEntity,
        deltaTime: number,
        _currentTime: number
    ): void {
        if (entity.type === "ship" && isShip(entity)) {
            // Update invulnerability
            if (entity.invulnerable && entity.invulnerableTime) {
                entity.invulnerableTime -= deltaTime;
                if (entity.invulnerableTime <= 0) {
                    entity.invulnerable = false;
                    entity.invulnerableTime = 0;
                }
            }
        } else if (entity.type === "asteroid") {
            // Age asteroids and rotate them
            entity.age = (entity.age || 0) + deltaTime;
            entity.rotation += deltaTime;
        } else if (entity.type === "bullet") {
            // Age bullets
            entity.age = (entity.age || 0) + deltaTime;
        } else if (entity.type === "warpBubbleIn") {
            // Update warp bubble opening animation
            entity.age = (entity.age || 0) + deltaTime;
            entity.warpAnimationProgress = Math.min(
                1,
                (entity.age || 0) / GIFT.OPENING_ANIMATION_TIME
            );
        } else if (entity.type === "warpBubbleOut") {
            // Update warp bubble closing animation
            entity.age = (entity.age || 0) + deltaTime;
            if (!entity.warpDisappearing) {
                entity.warpAnimationProgress = Math.min(
                    1,
                    (entity.age || 0) / GIFT.CLOSING_ANIMATION_TIME
                );
            }
        } else if (entity.type === "gift") {
            // Age gifts and check for expiration
            entity.age = (entity.age || 0) + deltaTime;
            entity.rotation += deltaTime * 2; // Slow rotation for visual appeal
        } else if (entity.type === "missile") {
            // Age missiles
            entity.age = (entity.age || 0) + deltaTime;
        }
    }

    /**
     * Update entity position
     */
    private updateEntityPosition(entity: GameEntity, deltaTime: number): void {
        entity.position = entity.position.add(
            entity.velocity.multiply(deltaTime)
        );
    }

    /**
     * Apply screen wrapping to entities (except bullets and warp bubbles)
     */
    private applyScreenWrapping(entity: GameEntity): void {
        if (
            entity.type !== "bullet" &&
            entity.type !== "warpBubbleIn" &&
            entity.type !== "warpBubbleOut"
        ) {
            if (entity.position.x < 0) entity.position.x = this.canvas.width;
            if (entity.position.x > this.canvas.width) entity.position.x = 0;
            if (entity.position.y < 0) entity.position.y = this.canvas.height;
            if (entity.position.y > this.canvas.height) entity.position.y = 0;
        }
    }

    /**
     * Remove expired entities
     */
    filterExpiredEntities(currentTime: number): void {
        this.entities = this.entities.filter((entity) => {
            return this.shouldKeepEntity(entity, currentTime);
        });
    }

    /**
     * Check if entity should be kept
     */
    private shouldKeepEntity(entity: GameEntity, currentTime: number): boolean {
        if (entity.type === "bullet") {
            const maxAge = entity.maxAge || BULLET.MAX_AGE;
            const outOfBounds =
                entity.position.x < -50 ||
                entity.position.x > this.canvas.width + 50 ||
                entity.position.y < -50 ||
                entity.position.y > this.canvas.height + 50;
            return (entity.age || 0) < maxAge && !outOfBounds;
        } else if (entity.type === "missile") {
            const maxAge = WEAPONS.MISSILES.MAX_AGE;
            const outOfBounds =
                entity.position.x < -50 ||
                entity.position.x > this.canvas.width + 50 ||
                entity.position.y < -50 ||
                entity.position.y > this.canvas.height + 50;
            return (entity.age || 0) < maxAge && !outOfBounds;
        } else if (entity.type === "warpBubbleIn") {
            // Warp bubbles in are managed by GiftSystem
            return true;
        } else if (entity.type === "warpBubbleOut") {
            if (entity.warpDisappearing && entity.warpDisappearStartTime) {
                const disappearElapsed =
                    currentTime - entity.warpDisappearStartTime;
                return disappearElapsed < GIFT.DISAPPEAR_ANIMATION_TIME * 1000;
            }
            return (entity.age || 0) < GIFT.WARP_BUBBLE_CREATION_DELAY;
        } else if (entity.type === "gift") {
            // Gift lifecycle is managed by GiftSystem
            const isExpired = (entity.age || 0) >= GIFT.LIFESPAN;
            
            // Stop wubwub sound if gift is expiring
            if (isExpired && isGift(entity) && entity.wubwubAudioControl) {
                entity.wubwubAudioControl.stop();
            }
            
            return !isExpired;
        }
        return true;
    }

    /**
     * Clear all entities
     */
    clearAllEntities(): void {
        this.entities = [];
    }

    /**
     * Clear all entities except ships
     */
    clearAllExceptShips(): void {
        this.entities = this.entities.filter(
            (entity) => entity.type === "ship"
        );
    }

    /**
     * Get entity count by type
     */
    getEntityCount(type?: string): number {
        if (type) {
            return this.entities.filter((entity) => entity.type === type)
                .length;
        }
        return this.entities.length;
    }

    /**
     * Find entities within a radius of a position
     */
    findEntitiesInRadius(
        position: Vector2,
        radius: number,
        types?: string[]
    ): GameEntity[] {
        return this.entities.filter((entity) => {
            if (types && !types.includes(entity.type)) {
                return false;
            }
            const distance = position.subtract(entity.position).magnitude();
            return distance <= radius;
        });
    }
}
