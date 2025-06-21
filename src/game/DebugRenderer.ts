import { Vector2 } from "~/utils/Vector2";
import type { GameEntity, Ship } from "~/entities";
import { DEBUG, WEAPONS } from "~/config/constants";
import { EntityManager } from "./EntityManager";
import { GameState } from "./GameState";
import { Collision } from "~/physics/Collision";

/**
 * Handles visual debugging rendering - collision circles, weapon ranges, etc.
 */
export class DebugRenderer {
    private entityManager: EntityManager;
    private gameState: GameState;

    constructor(entityManager: EntityManager, gameState: GameState) {
        this.entityManager = entityManager;
        this.gameState = gameState;
    }

    /**
     * Render all debug visuals if debug mode is enabled
     */
    render(ctx: CanvasRenderingContext2D, debugMode: boolean): void {
        if (!debugMode) return;

        // Store current canvas state
        ctx.save();

        // Set debug drawing properties
        ctx.globalAlpha = DEBUG.ALPHA;
        ctx.lineWidth = DEBUG.LINE_WIDTH;

        // Draw collision circles for all entities
        this.renderCollisionCircles(ctx);

        // Draw weapon ranges for player ship
        this.renderWeaponRanges(ctx);

        // Restore canvas state
        ctx.restore();
    }

    /**
     * Draw collision circles around all entities (magenta)
     */
    private renderCollisionCircles(ctx: CanvasRenderingContext2D): void {
        ctx.strokeStyle = DEBUG.COLLISION_CIRCLE_COLOR;

        // Get all entities
        const allEntities = this.getAllEntities();

        for (const entity of allEntities) {
            const radius = this.getCollisionRadius(entity);

            ctx.beginPath();
            ctx.arc(
                entity.position.x,
                entity.position.y,
                radius,
                0,
                Math.PI * 2
            );
            ctx.stroke();
        }
    }

    /**
     * Draw weapon ranges for the player ship (cyan)
     */
    private renderWeaponRanges(ctx: CanvasRenderingContext2D): void {
        const playerShip = this.entityManager.getPlayerShip();
        if (!playerShip) return;

        ctx.strokeStyle = DEBUG.WEAPON_RANGE_COLOR;

        const currentWeapon = this.gameState.currentWeapon;

        switch (currentWeapon) {
            case WEAPONS.TYPES.BULLETS:
                this.renderDirectedWeaponRange(
                    ctx,
                    playerShip,
                    this.getBulletRange()
                );
                break;
            case WEAPONS.TYPES.MISSILES:
                this.renderDirectedWeaponRange(
                    ctx,
                    playerShip,
                    this.getMissileRange()
                );
                break;
            case WEAPONS.TYPES.LASER:
                this.renderDirectedWeaponRange(
                    ctx,
                    playerShip,
                    this.getLaserRange()
                );
                break;
            case WEAPONS.TYPES.LIGHTNING:
                this.renderAOEWeaponRange(
                    ctx,
                    playerShip,
                    this.getLightningRange()
                );
                break;
        }
    }

    /**
     * Draw a line from ship showing directed weapon range
     */
    private renderDirectedWeaponRange(
        ctx: CanvasRenderingContext2D,
        ship: Ship,
        range: number
    ): void {
        const endPosition = Vector2.fromAngle(ship.rotation, range).add(
            ship.position
        );

        ctx.beginPath();
        ctx.moveTo(ship.position.x, ship.position.y);
        ctx.lineTo(endPosition.x, endPosition.y);
        ctx.stroke();
    }

    /**
     * Draw a circle around ship showing AOE weapon range
     */
    private renderAOEWeaponRange(
        ctx: CanvasRenderingContext2D,
        ship: Ship,
        range: number
    ): void {
        ctx.beginPath();
        ctx.arc(ship.position.x, ship.position.y, range, 0, Math.PI * 2);
        ctx.stroke();
    }

    /**
     * Get collision radius for an entity (same logic as collision system)
     */
    private getCollisionRadius(entity: GameEntity): number {
        return Collision.getEntityCollisionRadius(entity);
    }

    /**
     * Get all entities from entity manager
     */
    private getAllEntities(): GameEntity[] {
        const entities: GameEntity[] = [];

        // Add ships
        entities.push(...this.entityManager.getShips());

        // Add asteroids
        entities.push(...this.entityManager.getAsteroids());

        // Add bullets
        entities.push(...this.entityManager.getBullets());

        // Add missiles
        entities.push(...this.entityManager.getMissiles());

        // Add gifts
        entities.push(...this.entityManager.getGifts());

        // Add warp bubbles (outgoing only as that's what's available)
        entities.push(...this.entityManager.getWarpBubblesOut());

        return entities;
    }

    /**
     * Calculate bullet weapon range
     */
    private getBulletRange(): number {
        const playerState = this.gameState.getPlayerState("player");
        if (!playerState) return 600; // Default range

        const baseRange = 600; // Base range estimate from bullet speed * maxAge
        const hasRangeUpgrade = this.gameState.hasUpgrade(
            "upgrade_bullets_size"
        );
        return (
            baseRange * (hasRangeUpgrade ? WEAPONS.BULLETS.RANGE_UPGRADE : 1)
        );
    }

    /**
     * Calculate missile weapon range
     */
    private getMissileRange(): number {
        const playerState = this.gameState.getPlayerState("player");
        if (!playerState) return 900; // Default range

        const baseSpeed = WEAPONS.MISSILES.MAX_SPEED;
        const maxAge = WEAPONS.MISSILES.MAX_AGE;
        const hasSpeedUpgrade = this.gameState.hasUpgrade(
            "upgrade_missiles_speed"
        );
        const speedMultiplier = hasSpeedUpgrade
            ? WEAPONS.MISSILES.SPEED_UPGRADE
            : 1;
        return baseSpeed * speedMultiplier * maxAge;
    }

    /**
     * Calculate laser weapon range
     */
    private getLaserRange(): number {
        const playerState = this.gameState.getPlayerState("player");
        if (!playerState) return WEAPONS.LASER.LENGTH; // Default range

        const baseRange = WEAPONS.LASER.LENGTH;
        const hasRangeUpgrade = this.gameState.hasUpgrade(
            "upgrade_laser_range"
        );
        return baseRange * (hasRangeUpgrade ? WEAPONS.LASER.LENGTH_UPGRADE : 1);
    }

    /**
     * Calculate lightning weapon range
     */
    private getLightningRange(): number {
        const playerState = this.gameState.getPlayerState("player");
        if (!playerState) return WEAPONS.LIGHTNING.RADIUS; // Default range

        const baseRadius = WEAPONS.LIGHTNING.RADIUS;
        const hasRadiusUpgrade = this.gameState.hasUpgrade(
            "upgrade_lightning_radius"
        );
        return (
            baseRadius *
            (hasRadiusUpgrade ? WEAPONS.LIGHTNING.RADIUS_UPGRADE : 1)
        );
    }
}
