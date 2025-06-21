import { Vector2 } from "~/utils/Vector2";
import { ASTEROID, BULLET, SHIP } from "~/config/constants";

export interface Collidable {
    position: Vector2;
    size: Vector2;
    type?: string;
}

export class Collision {
    static checkCircleCollision(a: Collidable, b: Collidable): boolean {
        const dx = a.position.x - b.position.x;
        const dy = a.position.y - b.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Use the larger dimension as radius, accounting for visual scaling
        const radiusA = this.getEntityCollisionRadius(a);
        const radiusB = this.getEntityCollisionRadius(b);

        return distance < radiusA + radiusB;
    }

    /**
     * Calculate collision radius accounting for visual scaling and extent
     */
    static getEntityCollisionRadius(entity: Collidable): number {
        const baseRadius = Math.max(entity.size.x, entity.size.y) / 2;

        switch (entity.type) {
            case "asteroid":
                // Asteroids are scaled by 3.0x and have irregular shape variation (0.1 to 0.5)
                // Plus 1.5px stroke width. Use ~80% of max visual extent for good game feel
                const scaledRadius = baseRadius * ASTEROID.SCALE; // 3.0x
                const maxVariation = 0.5; // From asteroid drawing code
                const strokeWidth = 1.5; // From asteroid drawing code
                return scaledRadius * maxVariation * 0.8 + strokeWidth;

            case "bullet":
                // Bullets are scaled but are small and should be precise
                return baseRadius * BULLET.SCALE;

            case "ship":
                // Ships are scaled and need reasonable collision bounds
                return baseRadius * SHIP.SCALE;

            default:
                // Default entities (gifts, etc.) - use base radius
                return baseRadius;
        }
    }
}
