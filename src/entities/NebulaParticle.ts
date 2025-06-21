import { Vector2 } from "~/utils/Vector2";
import type { NebulaShapeType } from "~/config/constants";

/**
 * NebulaParticle represents a single cloud particle in the nebula effect
 */
export interface NebulaParticle {
    /** Current position of the particle */
    position: Vector2;

    /** Base size of the particle (radius for circles, width for ovals) */
    size: number;

    /** Height for oval shapes (for circles, this equals size) */
    height: number;

    /** Current opacity (0.0 to 1.0) */
    opacity: number;

    /** Base opacity for pulsing animation */
    baseOpacity: number;

    /** Particle color (hex string) */
    color: string;

    /** Drift velocity vector */
    velocity: Vector2;

    /** Age of particle in milliseconds for animation */
    age: number;

    /** Shape type (circle or oval) */
    shapeType: NebulaShapeType;

    /** Rotation angle for ovals (in radians) */
    rotation: number;

    /** Phase offset for pulsing animation */
    pulsePhase: number;
}
