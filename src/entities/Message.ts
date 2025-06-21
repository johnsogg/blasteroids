import { Vector2 } from "~/utils/Vector2";

/**
 * Represents an animated text message displayed in the game
 */
export interface Message {
    // Core message properties
    text: string;

    // Position and movement
    startPosition: Vector2;
    endPosition: Vector2;
    currentPosition: Vector2;

    // Animation timing
    startTime: number;
    duration: number; // milliseconds

    // Visual properties
    currentScale: number;
    currentOpacity: number;
    currentHue: number; // For rainbow animation

    // Message metadata
    messageType: MessageType;
    id: string;
}

/**
 * Types of messages that can be displayed
 */
export type MessageType =
    | "gift_collected"
    | "asteroid_collision"
    | "bonus_timer_expired"
    | "generic";

/**
 * Configuration for creating a new message
 */
export interface MessageConfig {
    text: string;
    shipPosition: Vector2;
    canvasWidth: number;
    canvasHeight: number;
    messageType?: MessageType;
    duration?: number;
}

/**
 * Helper function to calculate message positions based on ship location
 */
export function calculateMessagePositions(
    shipPosition: Vector2,
    canvasWidth: number,
    canvasHeight: number,
    shipDiameter: number = 20
): { start: Vector2; end: Vector2 } {
    const canvasCenter = new Vector2(canvasWidth / 2, canvasHeight / 2);
    const directionToCenter = canvasCenter.subtract(shipPosition).normalize();

    // Start position: ship position + 2 ship diameters toward center
    const startOffset = directionToCenter.multiply(shipDiameter * 2);
    const start = shipPosition.add(startOffset);

    // End position: 3 ship diameters further toward center
    const endOffset = directionToCenter.multiply(shipDiameter * 3);
    const end = start.add(endOffset);

    return { start, end };
}
