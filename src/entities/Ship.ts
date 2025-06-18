import { BaseEntity } from "./BaseEntity";
import { Vector2 } from "~/utils/Vector2";

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
}
