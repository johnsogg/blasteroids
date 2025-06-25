import { describe, it, expect } from "vitest";
import { WEAPONS } from "./constants";

describe("Missile Explosion Constants", () => {
    it("should have enhanced explosion configuration", () => {
        expect(WEAPONS.MISSILES.EXPLOSION_RADIUS).toBe(90);
        expect(WEAPONS.MISSILES.EXPLOSION_DURATION_FRAMES).toBe(45);
        expect(WEAPONS.MISSILES.SCALE).toBe(1.0); // Should use proper collision scaling
    });

    it("should maintain existing missile properties", () => {
        expect(WEAPONS.MISSILES.FIRE_RATE).toBe(2000);
        expect(WEAPONS.MISSILES.FUEL_CONSUMPTION).toBe(5);
        expect(WEAPONS.MISSILES.SIZE).toBe(4);
        expect(WEAPONS.MISSILES.MAX_AGE).toBe(3);
        expect(WEAPONS.MISSILES.COLOR).toBe("#ff8800");
    });
});
