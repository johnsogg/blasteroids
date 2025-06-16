import { BaseEntity } from "./BaseEntity";

/**
 * Bullet entity with bullet-specific properties
 */
export interface Bullet extends BaseEntity {
    type: "bullet";
    // Bullets use age for lifespan tracking
    // All other bullet properties are handled by base entity
}
