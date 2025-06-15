import { InputManager } from '~/input/InputManager';
import { Vector2 } from '~/utils/Vector2';

interface GameObject {
    position: Vector2;
    velocity: Vector2;
    size: Vector2;
    rotation: number;
    color: string;
    type: 'ship' | 'asteroid';
}

export class Game {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private gameObjects: GameObject[] = [];
    private input: InputManager;
    private lastTime = 0;
    private running = false;

    constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.input = new InputManager();
        this.init();
    }

    private init(): void {
        // Create a simple ship rectangle
        this.gameObjects.push({
            position: new Vector2(400, 300),
            velocity: Vector2.zero(),
            size: new Vector2(20, 10),
            rotation: 0,
            color: '#00ff00',
            type: 'ship'
        });

        // Create some asteroid rectangles
        for (let i = 0; i < 3; i++) {
            this.gameObjects.push({
                position: new Vector2(Math.random() * 800, Math.random() * 600),
                velocity: new Vector2((Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100),
                size: new Vector2(30, 30),
                rotation: Math.random() * Math.PI * 2,
                color: '#ffffff',
                type: 'asteroid'
            });
        }
    }

    start(): void {
        this.running = true;
        this.gameLoop();
    }

    stop(): void {
        this.running = false;
    }

    private gameLoop = (): void => {
        if (!this.running) return;

        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        this.update(deltaTime);
        this.render();

        requestAnimationFrame(this.gameLoop);
    };

    private update(deltaTime: number): void {
        this.gameObjects.forEach(obj => {
            if (obj.type === 'ship') {
                this.updateShip(obj, deltaTime);
            } else if (obj.type === 'asteroid') {
                // Rotate asteroids
                obj.rotation += deltaTime;
            }

            // Update position
            obj.position = obj.position.add(obj.velocity.multiply(deltaTime));

            // Wrap around screen edges
            if (obj.position.x < 0) obj.position.x = this.canvas.width;
            if (obj.position.x > this.canvas.width) obj.position.x = 0;
            if (obj.position.y < 0) obj.position.y = this.canvas.height;
            if (obj.position.y > this.canvas.height) obj.position.y = 0;
        });
    }

    private updateShip(ship: GameObject, deltaTime: number): void {
        const rotationSpeed = 5; // radians per second
        const thrustPower = 300; // pixels per second squared
        const maxSpeed = 400; // pixels per second
        const friction = 0.98; // velocity damping

        // Rotation
        if (this.input.left) {
            ship.rotation -= rotationSpeed * deltaTime;
        }
        if (this.input.right) {
            ship.rotation += rotationSpeed * deltaTime;
        }

        // Thrust
        if (this.input.thrust) {
            const thrustVector = Vector2.fromAngle(ship.rotation, thrustPower * deltaTime);
            ship.velocity = ship.velocity.add(thrustVector);
        }

        // Apply friction
        ship.velocity = ship.velocity.multiply(friction);

        // Limit max speed
        const speed = Math.sqrt(ship.velocity.x * ship.velocity.x + ship.velocity.y * ship.velocity.y);
        if (speed > maxSpeed) {
            ship.velocity = ship.velocity.multiply(maxSpeed / speed);
        }
    }

    private render(): void {
        // Clear canvas
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw objects
        this.gameObjects.forEach(obj => {
            this.ctx.save();
            this.ctx.translate(obj.position.x, obj.position.y);
            this.ctx.rotate(obj.rotation);
            this.ctx.fillStyle = obj.color;
            this.ctx.fillRect(-obj.size.x / 2, -obj.size.y / 2, obj.size.x, obj.size.y);
            this.ctx.restore();
        });
    }
}