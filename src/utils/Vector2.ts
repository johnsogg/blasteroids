export class Vector2 {
    constructor(
        public x: number = 0,
        public y: number = 0
    ) {}

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

    length(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    normalize(): Vector2 {
        const len = this.length();
        if (len === 0) {
            return new Vector2(0, 0);
        }
        return new Vector2(this.x / len, this.y / len);
    }

    dot(other: Vector2): number {
        return this.x * other.x + this.y * other.y;
    }

    copy(): Vector2 {
        return new Vector2(this.x, this.y);
    }
}
