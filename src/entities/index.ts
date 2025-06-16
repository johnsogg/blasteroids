/**
 * Centralized entity exports and type definitions
 */

export type { BaseEntity, EntityType } from "./BaseEntity";
export type { Ship } from "./Ship";
export type { Asteroid } from "./Asteroid";
export type { Bullet } from "./Bullet";
export type { Gift } from "./Gift";
export type { WarpBubbleIn, WarpBubbleOut } from "./WarpBubble";

// Import types for local use
import type { Ship } from "./Ship";
import type { Asteroid } from "./Asteroid";
import type { Bullet } from "./Bullet";
import type { Gift } from "./Gift";
import type { WarpBubbleIn, WarpBubbleOut } from "./WarpBubble";

/**
 * Union type of all game entities for type-safe operations
 */
export type GameEntity =
    | Ship
    | Asteroid
    | Bullet
    | Gift
    | WarpBubbleIn
    | WarpBubbleOut;

/**
 * Type guard functions for safe entity type checking
 */
export const isShip = (entity: GameEntity): entity is Ship =>
    entity.type === "ship";

export const isAsteroid = (entity: GameEntity): entity is Asteroid =>
    entity.type === "asteroid";

export const isBullet = (entity: GameEntity): entity is Bullet =>
    entity.type === "bullet";

export const isGift = (entity: GameEntity): entity is Gift =>
    entity.type === "gift";

export const isWarpBubbleIn = (entity: GameEntity): entity is WarpBubbleIn =>
    entity.type === "warpBubbleIn";

export const isWarpBubbleOut = (entity: GameEntity): entity is WarpBubbleOut =>
    entity.type === "warpBubbleOut";

export const isWarpBubble = (
    entity: GameEntity
): entity is WarpBubbleIn | WarpBubbleOut =>
    entity.type === "warpBubbleIn" || entity.type === "warpBubbleOut";
