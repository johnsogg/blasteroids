import { Vector2 } from "~/utils/Vector2";

export interface Collidable {
    position: Vector2;
    size: Vector2;
}

export class Collision {
    static checkCircleCollision(a: Collidable, b: Collidable): boolean {
        const dx = a.position.x - b.position.x;
        const dy = a.position.y - b.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Use the larger dimension as radius for simple collision
        const radiusA = Math.max(a.size.x, a.size.y) / 2;
        const radiusB = Math.max(b.size.x, b.size.y) / 2;

        return distance < radiusA + radiusB;
    }
}
