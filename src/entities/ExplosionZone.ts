import { BaseEntity } from "./BaseEntity";

/**
 * ExplosionZone entity for persistent missile explosion effects
 * Remains active for a specified number of frames to destroy asteroid fragments
 */
export interface ExplosionZone extends BaseEntity {
    type: "explosionZone";
    remainingFrames: number; // Number of frames this explosion zone will persist
    explosionRadius: number; // Radius of destruction effect
}
