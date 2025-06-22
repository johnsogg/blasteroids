import { BaseEntity } from "./BaseEntity";
import { Vector2 } from "~/utils/Vector2";

/**
 * Missile entity with missile-specific properties
 */
export interface Missile extends BaseEntity {
    type: "missile";
    // Store original direction to prevent drift during acceleration
    originalDirection: Vector2;
    // Missiles use age for lifespan tracking
    // Explosion radius and homing capabilities handled by weapon system
}
