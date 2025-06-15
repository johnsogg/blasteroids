import { InputManager } from '~/input/InputManager';
import { Collision } from '~/physics/Collision';
import { Shapes } from '~/render/Shapes';
import { Vector2 } from '~/utils/Vector2';

import { GameState } from './GameState';

interface GameObject {
    position: Vector2;
    velocity: Vector2;
    size: Vector2;
    rotation: number;
    color: string;
    type: 'ship' | 'asteroid' | 'bullet';
    age?: number; // For bullets with lifespan
    invulnerable?: boolean; // For ship invincibility period
    invulnerableTime?: number; // Time remaining invulnerable
    thrusting?: boolean; // For ship thrust visual effect
}

export class Game {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private gameObjects: GameObject[] = [];
    private input: InputManager;
    private gameState: GameState;
    private lastTime = 0;
    private running = false;
    private lastShotTime = 0;

    constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.input = new InputManager();
        this.gameState = new GameState();
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

        // Create initial asteroids with variety
        for (let i = 0; i < 4; i++) {
            this.createAsteroid();
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
        
        // Check for restart if game is over
        if (this.gameState.gameOver && this.input.restart) {
            this.restart();
            return;
        }
        
        // Skip updates if game is over
        if (this.gameState.gameOver) {
            return;
        }
        
        // Update objects
        this.gameObjects.forEach(obj => {
            if (obj.type === 'ship') {
                this.updateShip(obj, deltaTime, currentTime);
                
                // Update invulnerability
                if (obj.invulnerable && obj.invulnerableTime) {
                    obj.invulnerableTime -= deltaTime;
                    if (obj.invulnerableTime <= 0) {
                        obj.invulnerable = false;
                        obj.invulnerableTime = 0;
                    }
                }
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

        // Check if level is complete (no asteroids left)
        const remainingAsteroids = this.gameObjects.filter(obj => obj.type === 'asteroid');
        if (remainingAsteroids.length === 0) {
            this.nextLevel();
        }
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

        // Check ship-asteroid collisions (only if ship is not invulnerable)
        if (ship && !ship.invulnerable) {
            for (const asteroid of asteroids) {
                if (Collision.checkCircleCollision(ship, asteroid)) {
                    this.destroyShip(ship);
                    break; // Only one collision per frame
                }
            }
        }
    }

    private destroyShip(ship: GameObject): void {
        // Lose a life
        this.gameState.loseLife();
        
        // Reset ship position and velocity
        ship.position = new Vector2(400, 300);
        ship.velocity = Vector2.zero();
        ship.rotation = 0;
        
        // Make ship invulnerable for 3 seconds
        ship.invulnerable = true;
        ship.invulnerableTime = 3.0;
        
        // If game over, stop the game
        if (this.gameState.gameOver) {
            this.showGameOver();
        }
    }

    private showGameOver(): void {
        // Add game over text to the canvas
        this.ctx.save();
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '48px Courier New';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2);
        
        this.ctx.font = '24px Courier New';
        this.ctx.fillText('Press R to Restart', this.canvas.width / 2, this.canvas.height / 2 + 60);
        this.ctx.restore();
    }

    private restart(): void {
        // Reset game state
        this.gameState.reset();
        
        // Clear all objects and reinitialize
        this.gameObjects = [];
        this.init();
        
        // Reset timing
        this.lastShotTime = 0;
    }

    private nextLevel(): void {
        // Advance to next level
        this.gameState.nextLevel();
        
        // Spawn more asteroids based on level (3 + level number)
        const asteroidCount = 3 + this.gameState.level;
        
        for (let i = 0; i < asteroidCount; i++) {
            this.createAsteroid();
        }
    }

    private createAsteroid(basePosition?: Vector2): void {
        // Choose random size category
        const sizeCategory = Math.random();
        let size: number;
        let speed: number;
        
        if (sizeCategory < 0.3) {
            // Large asteroids (30-40px) - slow
            size = 30 + Math.random() * 10;
            speed = 20 + Math.random() * 40;
        } else if (sizeCategory < 0.6) {
            // Medium asteroids (20-30px) - medium speed
            size = 20 + Math.random() * 10;
            speed = 40 + Math.random() * 60;
        } else {
            // Small asteroids (10-20px) - fast
            size = 10 + Math.random() * 10;
            speed = 60 + Math.random() * 80;
        }
        
        // Position - either random or near a base position (for splitting)
        let x, y;
        if (basePosition) {
            // Spawn near the base position (for asteroid splitting)
            x = basePosition.x + (Math.random() - 0.5) * 100;
            y = basePosition.y + (Math.random() - 0.5) * 100;
        } else {
            // Spawn away from ship (at center)
            do {
                x = Math.random() * this.canvas.width;
                y = Math.random() * this.canvas.height;
            } while (Math.abs(x - 400) < 150 && Math.abs(y - 300) < 150); // Avoid center area
        }
        
        // Random velocity direction
        const angle = Math.random() * Math.PI * 2;
        const velocity = Vector2.fromAngle(angle, speed);
        
        this.gameObjects.push({
            position: new Vector2(x, y),
            velocity: velocity,
            size: new Vector2(size, size),
            rotation: Math.random() * Math.PI * 2,
            color: '#ffffff',
            type: 'asteroid'
        });
    }

    private destroyAsteroid(asteroid: GameObject): void {
        // Add score based on asteroid size
        const points = GameState.getAsteroidScore(asteroid.size.x);
        this.gameState.addScore(points);

        // Remove the asteroid
        const index = this.gameObjects.indexOf(asteroid);
        if (index > -1) {
            this.gameObjects.splice(index, 1);
        }

        // Create smaller asteroids if it's large enough to split
        if (asteroid.size.x > 20) {
            // Create 2-3 smaller fragments
            const fragmentCount = 2 + Math.floor(Math.random() * 2);
            for (let i = 0; i < fragmentCount; i++) {
                const fragmentSize = asteroid.size.x * (0.4 + Math.random() * 0.3); // 40-70% of original
                const speed = 80 + Math.random() * 60; // Faster fragments
                const angle = Math.random() * Math.PI * 2;
                
                this.gameObjects.push({
                    position: asteroid.position.add(new Vector2((Math.random() - 0.5) * 40, (Math.random() - 0.5) * 40)),
                    velocity: Vector2.fromAngle(angle, speed),
                    size: new Vector2(fragmentSize, fragmentSize),
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
        ship.thrusting = this.input.thrust;
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
                Shapes.drawShip(this.ctx, obj.position, obj.rotation, obj.color, obj.invulnerable, obj.invulnerableTime, obj.thrusting);
            } else if (obj.type === 'asteroid') {
                Shapes.drawAsteroid(this.ctx, obj.position, obj.rotation, obj.size, obj.color);
            } else if (obj.type === 'bullet') {
                Shapes.drawBullet(this.ctx, obj.position, obj.color);
            }
        });

        // Draw game over screen if needed
        if (this.gameState.gameOver) {
            this.showGameOver();
        }
    }
}