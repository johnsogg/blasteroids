import { describe, it, expect } from "vitest";
import { WEAPONS, ASTEROID } from "~/config/constants";

describe("Missile AOE Fragment Coverage", () => {
    it("should have explosion radius large enough to cover worst-case fragment spawn", () => {
        // Worst case scenario:
        // - Largest asteroid: 40px radius
        // - Fragment spawn radius: 40px from asteroid center
        // - Total distance from original center: 40px + 40px = 80px

        const largestAsteroidRadius = ASTEROID.LARGE_MAX_SIZE;
        const fragmentSpawnRadius = ASTEROID.FRAGMENT_SPAWN_RADIUS;
        const worstCaseDistance = largestAsteroidRadius + fragmentSpawnRadius;

        expect(WEAPONS.MISSILES.EXPLOSION_RADIUS).toBeGreaterThan(
            worstCaseDistance
        );

        // Verify the math
        expect(largestAsteroidRadius).toBe(40);
        expect(fragmentSpawnRadius).toBe(40);
        expect(worstCaseDistance).toBe(80);
        expect(WEAPONS.MISSILES.EXPLOSION_RADIUS).toBe(90); // 10px buffer
    });

    it("should calculate optimal duration for current radius", () => {
        // Current radius should cover: asteroid radius + spawn radius + some movement buffer
        const currentRadius = WEAPONS.MISSILES.EXPLOSION_RADIUS;
        const staticDistance =
            ASTEROID.LARGE_MAX_SIZE + ASTEROID.FRAGMENT_SPAWN_RADIUS; // 80px
        const availableMovementBuffer = currentRadius - staticDistance; // 90 - 80 = 10px

        // Calculate how long explosion should last for fragments to move this distance
        const maxFragmentSpeed = ASTEROID.FRAGMENT_SPEED_MAX; // 140 px/s
        const optimalDurationSeconds =
            availableMovementBuffer / maxFragmentSpeed;
        const optimalDurationFrames = Math.ceil(optimalDurationSeconds * 60);

        console.log(`Static distance (asteroid + spawn): ${staticDistance}px`);
        console.log(`Available movement buffer: ${availableMovementBuffer}px`);
        console.log(
            `Optimal duration: ${optimalDurationFrames} frames (${(optimalDurationSeconds * 1000).toFixed(0)}ms)`
        );
        console.log(
            `Current duration: ${WEAPONS.MISSILES.EXPLOSION_DURATION_FRAMES} frames`
        );

        // The current setup should work for the worst case
        expect(currentRadius).toBeGreaterThanOrEqual(staticDistance);
    });
});
