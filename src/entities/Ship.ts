import { BaseEntity } from "./BaseEntity";

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
}
