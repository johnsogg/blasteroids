import { Vector2 } from "~/utils/Vector2";
import type { GiftType } from "~/config/constants";

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
    maxAge?: number; // Custom maximum age for this entity (overrides type defaults)

    // Optional properties for specific entity types
    warpAnimationProgress?: number;
    warpDisappearing?: boolean;
    warpDisappearStartTime?: number;
    giftType?: GiftType;
    giftSpawnTime?: number;
    giftCollectionDeadline?: number;
    closingWarpCreated?: boolean;
}

/**
 * Entity type discriminator for type-safe operations
 */
export type EntityType =
    | "ship"
    | "asteroid"
    | "bullet"
    | "missile"
    | "gift"
    | "warpBubbleIn"
    | "warpBubbleOut"
    | "explosionZone";
