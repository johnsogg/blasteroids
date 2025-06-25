import { describe, it, expect } from "vitest";
import type { ExplosionZone } from "./ExplosionZone";
import { Vector2 } from "~/utils/Vector2";

describe("ExplosionZone Entity", () => {
    it("should have correct base properties", () => {
        const explosionZone: ExplosionZone = {
            type: "explosionZone",
            position: new Vector2(100, 200),
            velocity: new Vector2(0, 0),
            size: new Vector2(60, 60), // radius 60
            rotation: 0,
            color: "#ff8800",
            age: 0,
            remainingFrames: 20,
            explosionRadius: 60,
        };

        expect(explosionZone.type).toBe("explosionZone");
        expect(explosionZone.position).toEqual(new Vector2(100, 200));
        expect(explosionZone.explosionRadius).toBe(60);
        expect(explosionZone.remainingFrames).toBe(20);
    });

    it("should track remaining frames correctly", () => {
        const explosionZone: ExplosionZone = {
            type: "explosionZone",
            position: new Vector2(0, 0),
            velocity: new Vector2(0, 0),
            size: new Vector2(60, 60),
            rotation: 0,
            color: "#ff8800",
            age: 0,
            remainingFrames: 20,
            explosionRadius: 60,
        };

        expect(explosionZone.remainingFrames).toBe(20);

        // Simulate frame decrement
        explosionZone.remainingFrames -= 1;
        expect(explosionZone.remainingFrames).toBe(19);
    });
});
