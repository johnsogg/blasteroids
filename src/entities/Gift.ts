import { BaseEntity } from "./BaseEntity";

/**
 * Gift entity with gift-specific properties
 */
export interface Gift extends BaseEntity {
    type: "gift";
    giftSpawnTime?: number;
    giftCollectionDeadline?: number;
    closingWarpCreated?: boolean;
}
