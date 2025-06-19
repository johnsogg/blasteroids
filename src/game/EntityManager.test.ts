import { describe, it, expect, beforeEach } from "vitest";
import { EntityManager } from "./EntityManager";
import { Vector2 } from "~/utils/Vector2";
import type { GameEntity, Ship } from "~/entities";

// Mock canvas
const createMockCanvas = () =>
    ({
        width: 800,
        height: 600,
    }) as HTMLCanvasElement;

describe("EntityManager", () => {
    let entityManager: EntityManager;
    let mockCanvas: HTMLCanvasElement;

    beforeEach(() => {
        mockCanvas = createMockCanvas();
        entityManager = new EntityManager(mockCanvas);
    });

    describe("Entity Management", () => {
        it("should add entities", () => {
            const entity: GameEntity = {
                position: Vector2.zero(),
                velocity: Vector2.zero(),
                size: new Vector2(10, 10),
                rotation: 0,
                color: "#ffffff",
                type: "asteroid",
            };

            entityManager.addEntity(entity);
            expect(entityManager.getEntityCount()).toBe(1);
            expect(entityManager.getAllEntities()).toContain(entity);
        });

        it("should remove entities", () => {
            const entity: GameEntity = {
                position: Vector2.zero(),
                velocity: Vector2.zero(),
                size: new Vector2(10, 10),
                rotation: 0,
                color: "#ffffff",
                type: "asteroid",
            };

            entityManager.addEntity(entity);
            entityManager.removeEntity(entity);
            expect(entityManager.getEntityCount()).toBe(0);
            expect(entityManager.getAllEntities()).not.toContain(entity);
        });

        it("should clear all entities", () => {
            const entities = [
                {
                    position: Vector2.zero(),
                    velocity: Vector2.zero(),
                    size: new Vector2(10, 10),
                    rotation: 0,
                    color: "#ffffff",
                    type: "asteroid",
                },
                {
                    position: Vector2.zero(),
                    velocity: Vector2.zero(),
                    size: new Vector2(10, 10),
                    rotation: 0,
                    color: "#ffffff",
                    type: "bullet",
                },
            ] as GameEntity[];

            entities.forEach((entity) => entityManager.addEntity(entity));
            entityManager.clearAllEntities();
            expect(entityManager.getEntityCount()).toBe(0);
        });

        it("should clear all entities except ships", () => {
            const ship: Ship = {
                position: Vector2.zero(),
                velocity: Vector2.zero(),
                size: new Vector2(10, 10),
                rotation: 0,
                color: "#ffffff",
                type: "ship",
                trail: [],
            };

            const asteroid: GameEntity = {
                position: Vector2.zero(),
                velocity: Vector2.zero(),
                size: new Vector2(10, 10),
                rotation: 0,
                color: "#ffffff",
                type: "asteroid",
            };

            entityManager.addEntity(ship);
            entityManager.addEntity(asteroid);
            entityManager.clearAllExceptShips();

            expect(entityManager.getEntityCount()).toBe(1);
            expect(entityManager.getShip()).toBe(ship);
            expect(entityManager.getAsteroids()).toHaveLength(0);
        });
    });

    describe("Entity Queries", () => {
        beforeEach(() => {
            // Add test entities
            const ship: Ship = {
                position: Vector2.zero(),
                velocity: Vector2.zero(),
                size: new Vector2(10, 10),
                rotation: 0,
                color: "#ffffff",
                type: "ship",
                trail: [],
            };

            const asteroid: GameEntity = {
                position: new Vector2(100, 100),
                velocity: Vector2.zero(),
                size: new Vector2(20, 20),
                rotation: 0,
                color: "#ffffff",
                type: "asteroid",
            };

            const bullet: GameEntity = {
                position: new Vector2(30, 40), // Distance = 50, within radius 60
                velocity: new Vector2(100, 0),
                size: new Vector2(2, 2),
                rotation: 0,
                color: "#ffffff",
                type: "bullet",
            };

            entityManager.addEntity(ship);
            entityManager.addEntity(asteroid);
            entityManager.addEntity(bullet);
        });

        it("should get entities by type", () => {
            expect(entityManager.getAsteroids()).toHaveLength(1);
            expect(entityManager.getBullets()).toHaveLength(1);
            expect(entityManager.getShip()).toBeTruthy();
        });

        it("should get entity count by type", () => {
            expect(entityManager.getEntityCount("asteroid")).toBe(1);
            expect(entityManager.getEntityCount("bullet")).toBe(1);
            expect(entityManager.getEntityCount("ship")).toBe(1);
            expect(entityManager.getEntityCount()).toBe(3);
        });

        it("should find entities in radius", () => {
            const entitiesNearOrigin = entityManager.findEntitiesInRadius(
                Vector2.zero(),
                60,
                ["ship", "bullet"]
            );

            expect(entitiesNearOrigin).toHaveLength(2); // ship and bullet
        });
    });

    describe("Entity Updates", () => {
        it("should update entity positions", () => {
            const entity: GameEntity = {
                position: Vector2.zero(),
                velocity: new Vector2(10, 20),
                size: new Vector2(10, 10),
                rotation: 0,
                color: "#ffffff",
                type: "bullet",
            };

            entityManager.addEntity(entity);
            entityManager.updateEntities(1, 1000); // 1 second

            expect(entity.position.x).toBe(10);
            expect(entity.position.y).toBe(20);
        });

        it("should age entities", () => {
            const entity: GameEntity = {
                position: Vector2.zero(),
                velocity: Vector2.zero(),
                size: new Vector2(10, 10),
                rotation: 0,
                color: "#ffffff",
                type: "asteroid",
                age: 0,
            };

            entityManager.addEntity(entity);
            entityManager.updateEntities(0.5, 500);

            expect(entity.age).toBe(0.5);
        });

        it("should apply screen wrapping", () => {
            const entity: GameEntity = {
                position: new Vector2(-10, -10),
                velocity: Vector2.zero(),
                size: new Vector2(10, 10),
                rotation: 0,
                color: "#ffffff",
                type: "asteroid",
            };

            entityManager.addEntity(entity);
            entityManager.updateEntities(0, 0);

            expect(entity.position.x).toBe(mockCanvas.width);
            expect(entity.position.y).toBe(mockCanvas.height);
        });

        it("should not wrap bullets", () => {
            const bullet: GameEntity = {
                position: new Vector2(-10, -10),
                velocity: Vector2.zero(),
                size: new Vector2(2, 2),
                rotation: 0,
                color: "#ffffff",
                type: "bullet",
            };

            entityManager.addEntity(bullet);
            entityManager.updateEntities(0, 0);

            expect(bullet.position.x).toBe(-10);
            expect(bullet.position.y).toBe(-10);
        });
    });

    describe("Entity Filtering", () => {
        it("should remove expired bullets", () => {
            const expiredBullet: GameEntity = {
                position: Vector2.zero(),
                velocity: Vector2.zero(),
                size: new Vector2(2, 2),
                rotation: 0,
                color: "#ffffff",
                type: "bullet",
                age: 999, // Very old
            };

            entityManager.addEntity(expiredBullet);
            entityManager.filterExpiredEntities(1000);

            expect(entityManager.getBullets()).toHaveLength(0);
        });

        it("should remove out-of-bounds bullets", () => {
            const outOfBoundsBullet: GameEntity = {
                position: new Vector2(-100, -100),
                velocity: Vector2.zero(),
                size: new Vector2(2, 2),
                rotation: 0,
                color: "#ffffff",
                type: "bullet",
                age: 0,
            };

            entityManager.addEntity(outOfBoundsBullet);
            entityManager.filterExpiredEntities(1000);

            expect(entityManager.getBullets()).toHaveLength(0);
        });

        it("should keep young bullets in bounds", () => {
            const validBullet: GameEntity = {
                position: new Vector2(100, 100),
                velocity: Vector2.zero(),
                size: new Vector2(2, 2),
                rotation: 0,
                color: "#ffffff",
                type: "bullet",
                age: 0.5, // Young
            };

            entityManager.addEntity(validBullet);
            entityManager.filterExpiredEntities(1000);

            expect(entityManager.getBullets()).toHaveLength(1);
        });
    });
});
