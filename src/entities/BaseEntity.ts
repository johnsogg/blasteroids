import { Vector2 } from "~/utils/Vector2";

/**
 * Base entity interface for all game objects
 * Contains only the properties that ALL entities share
 */
export interface BaseEntity {
    position: Vector2;
    velocity: Vector2;
    size: Vector2;
    rotation: number;
    color: string;
    age?: number; // Time since entity was created
}

/**
 * Entity type discriminator for type-safe operations
 */
export type EntityType =
    | "ship"
    | "asteroid"
    | "bullet"
    | "gift"
    | "warpBubbleIn"
    | "warpBubbleOut";
