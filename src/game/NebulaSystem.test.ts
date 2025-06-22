import { describe, test, expect, beforeEach } from "vitest";
import { NebulaSystem } from "./NebulaSystem";
import { NEBULA } from "~/config/constants";

describe("NebulaSystem", () => {
    let nebulaSystem: NebulaSystem;
    const canvasWidth = 800;
    const canvasHeight = 600;

    beforeEach(() => {
        nebulaSystem = new NebulaSystem(canvasWidth, canvasHeight);
    });

    describe("initialization", () => {
        test("should create empty particle array initially", () => {
            expect(nebulaSystem.getParticles()).toHaveLength(0);
        });

        test("should correctly identify nebula zones", () => {
            expect(nebulaSystem.isNebulaZone(1)).toBe(false); // Asteroid Field
            expect(nebulaSystem.isNebulaZone(2)).toBe(true); // Dense Nebula
            expect(nebulaSystem.isNebulaZone(3)).toBe(false); // Gravity Wells
            expect(nebulaSystem.isNebulaZone(99)).toBe(false); // Non-existent zone
        });
    });

    describe("zone initialization", () => {
        test("should not create particles for non-nebula zones", () => {
            nebulaSystem.initializeForZone(1); // Asteroid Field
            expect(nebulaSystem.getParticles()).toHaveLength(0);

            nebulaSystem.initializeForZone(3); // Gravity Wells
            expect(nebulaSystem.getParticles()).toHaveLength(0);
        });

        test("should create correct number of particles for nebula zones", () => {
            nebulaSystem.initializeForZone(2); // Dense Nebula
            expect(nebulaSystem.getParticles()).toHaveLength(
                NEBULA.PARTICLE_COUNT
            );
        });

        test("should create particles with correct properties for zone 2", () => {
            nebulaSystem.initializeForZone(2);
            const particles = nebulaSystem.getParticles();

            particles.forEach((particle) => {
                // Position should be within canvas bounds
                expect(particle.position.x).toBeGreaterThanOrEqual(0);
                expect(particle.position.x).toBeLessThanOrEqual(canvasWidth);
                expect(particle.position.y).toBeGreaterThanOrEqual(0);
                expect(particle.position.y).toBeLessThanOrEqual(canvasHeight);

                // Size should be within defined range
                expect(particle.size).toBeGreaterThanOrEqual(
                    NEBULA.PARTICLE_MIN_SIZE
                );
                expect(particle.size).toBeLessThanOrEqual(
                    NEBULA.PARTICLE_MAX_SIZE
                );

                // Opacity should be within defined range
                expect(particle.baseOpacity).toBeGreaterThanOrEqual(
                    NEBULA.PARTICLE_MIN_OPACITY
                );
                expect(particle.baseOpacity).toBeLessThanOrEqual(
                    NEBULA.PARTICLE_MAX_OPACITY
                );

                // Color should match zone 2
                expect(particle.color).toBe("#aa88ff");

                // Shape type should be valid
                expect(NEBULA.SHAPE_TYPES).toContain(particle.shapeType);

                // Velocity should be within expected range
                const speed = Math.sqrt(
                    particle.velocity.x ** 2 + particle.velocity.y ** 2
                );
                expect(speed).toBeGreaterThanOrEqual(NEBULA.DRIFT_SPEED_MIN);
                expect(speed).toBeLessThanOrEqual(NEBULA.DRIFT_SPEED_MAX);

                // Age should start at 0
                expect(particle.age).toBe(0);
            });
        });

        test("should handle oval particles correctly", () => {
            nebulaSystem.initializeForZone(2);
            const particles = nebulaSystem.getParticles();
            const ovalParticles = particles.filter(
                (p) => p.shapeType === "oval"
            );

            ovalParticles.forEach((particle) => {
                // Oval height should be different from width (size)
                expect(particle.height).not.toBe(particle.size);
                expect(particle.height).toBeLessThan(particle.size);

                // Aspect ratio should be within expected range
                const aspectRatio = particle.size / particle.height;
                expect(aspectRatio).toBeGreaterThanOrEqual(
                    NEBULA.OVAL_ASPECT_RATIO_MIN
                );
                expect(aspectRatio).toBeLessThanOrEqual(
                    NEBULA.OVAL_ASPECT_RATIO_MAX
                );

                // Should have rotation
                expect(particle.rotation).toBeGreaterThanOrEqual(0);
                expect(particle.rotation).toBeLessThanOrEqual(Math.PI * 2);
            });
        });

        test("should handle circle particles correctly", () => {
            nebulaSystem.initializeForZone(2);
            const particles = nebulaSystem.getParticles();
            const circleParticles = particles.filter(
                (p) => p.shapeType === "circle"
            );

            circleParticles.forEach((particle) => {
                // Circle height should equal width (size)
                expect(particle.height).toBe(particle.size);
            });
        });
    });

    describe("particle updates", () => {
        beforeEach(() => {
            nebulaSystem.initializeForZone(2);
        });

        test("should update particle positions based on velocity", () => {
            const particles = nebulaSystem.getParticles();
            const initialPositions = particles.map((p) => ({
                x: p.position.x,
                y: p.position.y,
            }));

            const deltaTime = 0.1; // Smaller delta time to avoid wrapping
            const currentTime = 1000;

            nebulaSystem.update(deltaTime, currentTime);

            particles.forEach((particle, index) => {
                // Check that position changed from initial (unless wrapped)
                const positionChanged =
                    particle.position.x !== initialPositions[index].x ||
                    particle.position.y !== initialPositions[index].y;
                expect(positionChanged).toBe(true);

                // Particles should remain within canvas bounds (accounting for wrapping)
                expect(particle.position.x).toBeGreaterThanOrEqual(
                    -particle.size
                );
                expect(particle.position.x).toBeLessThanOrEqual(
                    canvasWidth + particle.size
                );
                expect(particle.position.y).toBeGreaterThanOrEqual(
                    -particle.size
                );
                expect(particle.position.y).toBeLessThanOrEqual(
                    canvasHeight + particle.size
                );
            });
        });

        test("should update particle opacity with pulsing animation", () => {
            const particles = nebulaSystem.getParticles();
            const currentTime = 1000;

            nebulaSystem.update(0.1, currentTime);

            particles.forEach((particle) => {
                // Opacity should be modified from base opacity
                expect(particle.opacity).toBeGreaterThan(0);
                expect(particle.opacity).toBeLessThanOrEqual(
                    particle.baseOpacity
                );

                // Age should be updated
                expect(particle.age).toBe(currentTime);
            });
        });

        test("should wrap particles around screen edges", () => {
            const particles = nebulaSystem.getParticles();
            const particle = particles[0];

            // Store original velocity to reset it
            const originalVelocity = {
                x: particle.velocity.x,
                y: particle.velocity.y,
            };

            // Set velocity to zero to avoid movement during update
            particle.velocity.x = 0;
            particle.velocity.y = 0;

            // Move particle beyond screen edges (past the wrapping threshold)
            particle.position.x = -particle.size - 1; // Beyond left edge
            particle.position.y = canvasHeight + particle.size + 1; // Beyond bottom edge

            nebulaSystem.update(0.1, 1000);

            // Should wrap around
            // When wrapping from left (position < -particle.size), should appear on right at canvasWidth + particle.size
            expect(particles[0].position.x).toBe(canvasWidth + particle.size);
            // When wrapping from bottom (position > canvasHeight + particle.size), should appear on top at -particle.size
            expect(particles[0].position.y).toBe(-particle.size);

            // Restore original velocity
            particle.velocity.x = originalVelocity.x;
            particle.velocity.y = originalVelocity.y;
        });

        test("should not update particles for non-nebula zones", () => {
            // Switch to non-nebula zone
            nebulaSystem.initializeForZone(1);
            expect(nebulaSystem.getParticles()).toHaveLength(0);

            // Update should not crash
            nebulaSystem.update(1.0, 1000);
            expect(nebulaSystem.getParticles()).toHaveLength(0);
        });
    });

    describe("canvas resizing", () => {
        test("should reinitialize particles when canvas size changes in nebula zone", () => {
            nebulaSystem.initializeForZone(2);
            const originalParticleCount = nebulaSystem.getParticles().length;

            nebulaSystem.updateCanvasSize(1200, 800);

            // Should still have the same number of particles
            expect(nebulaSystem.getParticles()).toHaveLength(
                originalParticleCount
            );

            // Particles should now be positioned within new canvas bounds
            const particles = nebulaSystem.getParticles();
            particles.forEach((particle) => {
                expect(particle.position.x).toBeGreaterThanOrEqual(0);
                expect(particle.position.x).toBeLessThanOrEqual(1200);
                expect(particle.position.y).toBeGreaterThanOrEqual(0);
                expect(particle.position.y).toBeLessThanOrEqual(800);
            });
        });

        test("should not reinitialize particles for non-nebula zones", () => {
            nebulaSystem.initializeForZone(1); // Non-nebula zone
            expect(nebulaSystem.getParticles()).toHaveLength(0);

            nebulaSystem.updateCanvasSize(1200, 800);
            expect(nebulaSystem.getParticles()).toHaveLength(0);
        });
    });

    describe("clearing", () => {
        test("should clear all particles", () => {
            nebulaSystem.initializeForZone(2);
            expect(nebulaSystem.getParticles().length).toBeGreaterThan(0);

            nebulaSystem.clear();
            expect(nebulaSystem.getParticles()).toHaveLength(0);
        });
    });
});
