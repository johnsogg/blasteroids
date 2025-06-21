import { BaseEntity } from "./BaseEntity";
import { Vector2 } from "~/utils/Vector2";
import type { GameEntity } from ".";

/**
 * Trail point data for ship movement trails
 */
export interface TrailPoint {
    position: Vector2;
    timestamp: number;
    opacity: number;
    size: number;
    hue: number; // HSL hue value for color variation
    baseOpacity: number; // Base opacity for additional variation
}

/**
 * AI states for computer-controlled ships
 */
export type AIState =
    | "hunting" // Seeking asteroids to destroy
    | "assisting" // Moving to help player
    | "avoiding" // Dodging asteroids
    | "collecting"; // Going for power-ups (only used by original computer player, not AI companions)

/**
 * Ship entity with ship-specific properties
 */
export interface Ship extends BaseEntity {
    type: "ship";
    playerId: string; // Unique identifier for this ship (required)
    invulnerable?: boolean;
    invulnerableTime?: number;
    thrusting?: boolean;
    strafingLeft?: boolean;
    strafingRight?: boolean;
    isLaserActive?: boolean;
    laserStartTime?: number;
    lightningTargets?: { start: Vector2; end: Vector2 }[];
    lightningTime?: number;
    trail?: TrailPoint[];

    // AI-specific properties (only used by computer players)
    isAI?: boolean;
    aiState?: AIState;
    aiTarget?: GameEntity | null;
    aiLastDecisionTime?: number;

    // Note: Individual fuel, weapons, lives are now stored in PlayerState
}
