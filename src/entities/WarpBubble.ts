import { BaseEntity } from "./BaseEntity";
import type { GiftType } from "~/config/constants";

/**
 * Base warp bubble interface with shared warp properties
 */
interface BaseWarpBubble extends BaseEntity {
    warpAnimationProgress?: number;
    warpDisappearing?: boolean;
    warpDisappearStartTime?: number;
}

/**
 * Incoming warp bubble (opening animation)
 */
export interface WarpBubbleIn extends BaseWarpBubble {
    type: "warpBubbleIn";
    giftType: GiftType; // Required for spawning the correct gift type
}

/**
 * Outgoing warp bubble (closing animation)
 */
export interface WarpBubbleOut extends BaseWarpBubble {
    type: "warpBubbleOut";
}
