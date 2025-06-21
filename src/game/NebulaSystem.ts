import { Vector2 } from "~/utils/Vector2";
import { NEBULA, type NebulaShapeType } from "~/config/constants";
import type { NebulaParticle } from "~/entities/NebulaParticle";

/**
 * NebulaSystem manages the generation, animation, and rendering of nebula particles
 * for zones that have nebula effects (currently zone 2: Dense Nebula)
 */
export class NebulaSystem {
    private particles: NebulaParticle[] = [];
    private canvasWidth: number;
    private canvasHeight: number;
    private currentZone: number = 1;

    constructor(canvasWidth: number, canvasHeight: number) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
    }

    /**
     * Initialize nebula particles for the given zone
     */
    initializeForZone(zone: number): void {
        this.currentZone = zone;
        this.particles = [];

        // Only generate particles for zones with nebula effects
        if (!this.isNebulaZone(zone)) {
            return;
        }

        const zoneColor = this.getZoneColor(zone);

        // Generate the specified number of particles
        for (let i = 0; i < NEBULA.PARTICLE_COUNT; i++) {
            this.particles.push(this.createParticle(zoneColor));
        }
    }

    /**
     * Update all nebula particles
     */
    update(deltaTime: number, currentTime: number): void {
        if (!this.isNebulaZone(this.currentZone)) {
            return;
        }

        for (const particle of this.particles) {
            // Update position based on drift velocity
            particle.position = particle.position.add(
                particle.velocity.multiply(deltaTime)
            );

            // Wrap around screen edges
            this.wrapParticlePosition(particle);

            // Update age
            particle.age = currentTime;

            // Update opacity with pulsing animation
            const pulseTime =
                currentTime * NEBULA.OPACITY_PULSE_SPEED + particle.pulsePhase;
            const pulseFactor = 0.5 + 0.5 * Math.sin(pulseTime);
            particle.opacity = particle.baseOpacity * pulseFactor;
        }
    }

    /**
     * Get all nebula particles for rendering
     */
    getParticles(): readonly NebulaParticle[] {
        return this.particles;
    }

    /**
     * Check if the given zone has nebula effects
     */
    isNebulaZone(zone: number): boolean {
        return zone in NEBULA.ZONE_COLORS;
    }

    /**
     * Update canvas dimensions (for window resize)
     */
    updateCanvasSize(width: number, height: number): void {
        this.canvasWidth = width;
        this.canvasHeight = height;

        // Re-initialize particles with new canvas dimensions if needed
        if (this.isNebulaZone(this.currentZone) && this.particles.length > 0) {
            this.initializeForZone(this.currentZone);
        }
    }

    /**
     * Clear all particles (for zone transitions)
     */
    clear(): void {
        this.particles = [];
    }

    /**
     * Create a single nebula particle with random properties
     */
    private createParticle(color: string): NebulaParticle {
        // Random position anywhere on screen
        const position = new Vector2(
            Math.random() * this.canvasWidth,
            Math.random() * this.canvasHeight
        );

        // Random size
        const size =
            NEBULA.PARTICLE_MIN_SIZE +
            Math.random() *
                (NEBULA.PARTICLE_MAX_SIZE - NEBULA.PARTICLE_MIN_SIZE);

        // Random shape type
        const shapeType: NebulaShapeType =
            NEBULA.SHAPE_TYPES[
                Math.floor(Math.random() * NEBULA.SHAPE_TYPES.length)
            ];

        // Height calculation (for ovals)
        let height = size;
        if (shapeType === "oval") {
            const aspectRatio =
                NEBULA.OVAL_ASPECT_RATIO_MIN +
                Math.random() *
                    (NEBULA.OVAL_ASPECT_RATIO_MAX -
                        NEBULA.OVAL_ASPECT_RATIO_MIN);
            height = size / aspectRatio;
        }

        // Random opacity
        const baseOpacity =
            NEBULA.PARTICLE_MIN_OPACITY +
            Math.random() *
                (NEBULA.PARTICLE_MAX_OPACITY - NEBULA.PARTICLE_MIN_OPACITY);

        // Random drift velocity
        const speed =
            NEBULA.DRIFT_SPEED_MIN +
            Math.random() * (NEBULA.DRIFT_SPEED_MAX - NEBULA.DRIFT_SPEED_MIN);
        const direction = Math.random() * Math.PI * 2;
        const velocity = Vector2.fromAngle(direction, speed);

        // Random rotation (for ovals)
        const rotation = Math.random() * Math.PI * 2;

        // Random pulse phase offset
        const pulsePhase = Math.random() * Math.PI * 2;

        return {
            position,
            size,
            height,
            opacity: baseOpacity,
            baseOpacity,
            color,
            velocity,
            age: 0,
            shapeType,
            rotation,
            pulsePhase,
        };
    }

    /**
     * Wrap particle position around screen edges
     */
    private wrapParticlePosition(particle: NebulaParticle): void {
        const margin = particle.size; // Use particle size as margin for smooth wrapping

        if (particle.position.x < -margin) {
            particle.position.x = this.canvasWidth + margin;
        } else if (particle.position.x > this.canvasWidth + margin) {
            particle.position.x = -margin;
        }

        if (particle.position.y < -margin) {
            particle.position.y = this.canvasHeight + margin;
        } else if (particle.position.y > this.canvasHeight + margin) {
            particle.position.y = -margin;
        }
    }

    /**
     * Get the nebula color for the given zone
     */
    private getZoneColor(zone: number): string {
        return (
            NEBULA.ZONE_COLORS[zone as keyof typeof NEBULA.ZONE_COLORS] ||
            "#aa88ff"
        );
    }
}
