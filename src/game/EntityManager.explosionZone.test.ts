import { describe, it, expect, beforeEach } from "vitest";
import { EntityManager } from "./EntityManager";
import { Vector2 } from "~/utils/Vector2";
import type { ExplosionZone } from "~/entities";

describe("EntityManager - ExplosionZone Support", () => {
    let entityManager: EntityManager;
    let mockCanvas: HTMLCanvasElement;

    beforeEach(() => {
        mockCanvas = {
            width: 800,
            height: 600,
        } as HTMLCanvasElement;
        entityManager = new EntityManager(mockCanvas);
    });

    it("should add and retrieve explosion zones", () => {
        const explosionZone: ExplosionZone = {
            type: "explosionZone",
            position: new Vector2(100, 200),
            velocity: new Vector2(0, 0),
            size: new Vector2(60, 60),
            rotation: 0,
            color: "#ff8800",
            age: 0,
            remainingFrames: 20,
            explosionRadius: 60,
        };

        entityManager.addEntity(explosionZone);
        const explosionZones = entityManager.getExplosionZones();

        expect(explosionZones).toHaveLength(1);
        expect(explosionZones[0]).toBe(explosionZone);
    });

    it("should update explosion zone remaining frames", () => {
        const explosionZone: ExplosionZone = {
            type: "explosionZone",
            position: new Vector2(100, 200),
            velocity: new Vector2(0, 0),
            size: new Vector2(60, 60),
            rotation: 0,
            color: "#ff8800",
            age: 0,
            remainingFrames: 20,
            explosionRadius: 60,
        };

        entityManager.addEntity(explosionZone);

        // Simulate frame processing
        const explosionZones = entityManager.getExplosionZones();
        explosionZones[0].remainingFrames -= 1;

        expect(explosionZones[0].remainingFrames).toBe(19);
    });

    it("should remove expired explosion zones during cleanup", () => {
        const explosionZone: ExplosionZone = {
            type: "explosionZone",
            position: new Vector2(100, 200),
            velocity: new Vector2(0, 0),
            size: new Vector2(60, 60),
            rotation: 0,
            color: "#ff8800",
            age: 0,
            remainingFrames: 0, // Already expired
            explosionRadius: 60,
        };

        entityManager.addEntity(explosionZone);
        entityManager.updateExplosionZones();

        const explosionZones = entityManager.getExplosionZones();
        expect(explosionZones).toHaveLength(0);
    });

    it("should keep active explosion zones during cleanup", () => {
        const explosionZone: ExplosionZone = {
            type: "explosionZone",
            position: new Vector2(100, 200),
            velocity: new Vector2(0, 0),
            size: new Vector2(60, 60),
            rotation: 0,
            color: "#ff8800",
            age: 0,
            remainingFrames: 10, // Still active
            explosionRadius: 60,
        };

        entityManager.addEntity(explosionZone);
        entityManager.updateExplosionZones();

        const explosionZones = entityManager.getExplosionZones();
        expect(explosionZones).toHaveLength(1);
        expect(explosionZones[0].remainingFrames).toBe(9); // Decremented by 1
    });
});
