import { BaseEntity } from "./BaseEntity";
import type { GiftType } from "~/config/constants";

/**
 * Gift entity with gift-specific properties
 */
export interface Gift extends BaseEntity {
    type: "gift";
    giftSpawnTime?: number;
    giftCollectionDeadline?: number;
    closingWarpCreated?: boolean;
    giftType: GiftType;
}
