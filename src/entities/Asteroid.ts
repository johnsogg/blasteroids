import { BaseEntity } from "./BaseEntity";

/**
 * Asteroid entity with asteroid-specific properties
 */
export interface Asteroid extends BaseEntity {
    type: "asteroid";
    // Asteroids use the base properties and rotation for spinning
    // Future: Could add asteroid-specific properties like mineral type, density, etc.
}
