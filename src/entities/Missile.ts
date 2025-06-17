import { BaseEntity } from "./BaseEntity";

/**
 * Missile entity with missile-specific properties
 */
export interface Missile extends BaseEntity {
    type: "missile";
    // Missiles use age for lifespan tracking
    // Explosion radius and homing capabilities handled by weapon system
}
