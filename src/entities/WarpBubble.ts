import { BaseEntity } from "./BaseEntity";

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
}

/**
 * Outgoing warp bubble (closing animation)
 */
export interface WarpBubbleOut extends BaseWarpBubble {
    type: "warpBubbleOut";
}
