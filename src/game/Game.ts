import { InputManager } from '~/input/InputManager';
import { Collision } from '~/physics/Collision';
import { Shapes } from '~/render/Shapes';
import { Vector2 } from '~/utils/Vector2';

interface GameObject {
    position: Vector2;
    velocity: Vector2;
    size: Vector2;
    rotation: number;
    color: string;
    type: 'ship' | 'asteroid' | 'bullet';
    age?: number; // For bullets with lifespan
}

export class Game {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private gameObjects: GameObject[] = [];
    private input: InputManager;
    private lastTime = 0;
    private running = false;
    private lastShotTime = 0;

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
        const currentTime = performance.now();
        
        // Update objects
        this.gameObjects.forEach(obj => {
            if (obj.type === 'ship') {
                this.updateShip(obj, deltaTime, currentTime);
            } else if (obj.type === 'asteroid') {
                // Rotate asteroids
                obj.rotation += deltaTime;
            } else if (obj.type === 'bullet') {
                // Age bullets
                obj.age = (obj.age || 0) + deltaTime;
            }

            // Update position
            obj.position = obj.position.add(obj.velocity.multiply(deltaTime));

            // Wrap around screen edges (except bullets)
            if (obj.type !== 'bullet') {
                if (obj.position.x < 0) obj.position.x = this.canvas.width;
                if (obj.position.x > this.canvas.width) obj.position.x = 0;
                if (obj.position.y < 0) obj.position.y = this.canvas.height;
                if (obj.position.y > this.canvas.height) obj.position.y = 0;
            }
        });

        // Check collisions
        this.checkCollisions();

        // Remove old bullets
        this.gameObjects = this.gameObjects.filter(obj => {
            if (obj.type === 'bullet') {
                const maxAge = 3; // seconds
                const outOfBounds = obj.position.x < -50 || obj.position.x > this.canvas.width + 50 ||
                                  obj.position.y < -50 || obj.position.y > this.canvas.height + 50;
                return (obj.age || 0) < maxAge && !outOfBounds;
            }
            return true;
        });
    }

    private checkCollisions(): void {
        const bullets = this.gameObjects.filter(obj => obj.type === 'bullet');
        const asteroids = this.gameObjects.filter(obj => obj.type === 'asteroid');
        const ship = this.gameObjects.find(obj => obj.type === 'ship');
        
        // Check bullet-asteroid collisions
        for (const bullet of bullets) {
            for (const asteroid of asteroids) {
                if (Collision.checkCircleCollision(bullet, asteroid)) {
                    // Mark for removal by setting age very high
                    bullet.age = 999;
                    
                    // Create smaller asteroids if this one is large enough
                    this.destroyAsteroid(asteroid);
                    break; // Bullet can only hit one asteroid
                }
            }
        }

        // Check ship-asteroid collisions
        if (ship) {
            for (const asteroid of asteroids) {
                if (Collision.checkCircleCollision(ship, asteroid)) {
                    // Simple respawn for now - just move ship to center
                    ship.position = new Vector2(400, 300);
                    ship.velocity = Vector2.zero();
                    ship.rotation = 0;
                    
                    // Visual feedback - make ship blink by changing color briefly
                    const originalColor = ship.color;
                    ship.color = '#ff0000';
                    setTimeout(() => {
                        ship.color = originalColor;
                    }, 200);
                    
                    break; // Only one collision per frame
                }
            }
        }
    }

    private destroyAsteroid(asteroid: GameObject): void {
        // Remove the asteroid
        const index = this.gameObjects.indexOf(asteroid);
        if (index > -1) {
            this.gameObjects.splice(index, 1);
        }

        // Create smaller asteroids if it's large enough
        if (asteroid.size.x > 15) {
            for (let i = 0; i < 2; i++) {
                this.gameObjects.push({
                    position: asteroid.position.add(new Vector2((Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20)),
                    velocity: new Vector2((Math.random() - 0.5) * 150, (Math.random() - 0.5) * 150),
                    size: new Vector2(asteroid.size.x * 0.6, asteroid.size.y * 0.6),
                    rotation: Math.random() * Math.PI * 2,
                    color: '#ffffff',
                    type: 'asteroid'
                });
            }
        }
    }

    private updateShip(ship: GameObject, deltaTime: number, currentTime: number): void {
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

        // Shooting
        if (this.input.shoot && currentTime - this.lastShotTime > 150) { // 150ms between shots
            this.shoot(ship);
            this.lastShotTime = currentTime;
        }
    }

    private shoot(ship: GameObject): void {
        const bulletSpeed = 500; // pixels per second
        const bulletVelocity = Vector2.fromAngle(ship.rotation, bulletSpeed);
        
        // Add ship's velocity to bullet for realistic physics
        const finalVelocity = ship.velocity.add(bulletVelocity);
        
        // Position bullet slightly in front of ship
        const bulletOffset = Vector2.fromAngle(ship.rotation, ship.size.x);
        const bulletPosition = ship.position.add(bulletOffset);

        this.gameObjects.push({
            position: bulletPosition,
            velocity: finalVelocity,
            size: new Vector2(3, 3),
            rotation: 0,
            color: '#ffff00',
            type: 'bullet',
            age: 0
        });
    }

    private render(): void {
        // Clear canvas
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw objects with vector graphics
        this.gameObjects.forEach(obj => {
            if (obj.type === 'ship') {
                Shapes.drawShip(this.ctx, obj.position, obj.rotation, obj.color);
            } else if (obj.type === 'asteroid') {
                Shapes.drawAsteroid(this.ctx, obj.position, obj.rotation, obj.size, obj.color);
            } else if (obj.type === 'bullet') {
                Shapes.drawBullet(this.ctx, obj.position, obj.color);
            }
        });
    }
}