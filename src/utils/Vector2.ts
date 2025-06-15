export class Vector2 {
    constructor(public x: number = 0, public y: number = 0) {}

    static zero(): Vector2 {
        return new Vector2(0, 0);
    }

    static fromAngle(angle: number, magnitude: number = 1): Vector2 {
        return new Vector2(
            Math.cos(angle) * magnitude,
            Math.sin(angle) * magnitude
        );
    }

    add(other: Vector2): Vector2 {
        return new Vector2(this.x + other.x, this.y + other.y);
    }

    multiply(scalar: number): Vector2 {
        return new Vector2(this.x * scalar, this.y * scalar);
    }

    copy(): Vector2 {
        return new Vector2(this.x, this.y);
    }
}