import { BaseEntity } from "./BaseEntity";
import { Vector2 } from "~/utils/Vector2";

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
 * Ship entity with ship-specific properties
 */
export interface Ship extends BaseEntity {
    type: "ship";
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
}
