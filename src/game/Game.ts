import { AudioManager } from "~/audio/AudioManager";
import { InputManager } from "~/input/InputManager";
import { Collision } from "~/physics/Collision";
import { ParticleSystem } from "~/render/ParticleSystem";
import { Shapes } from "~/render/Shapes";
import { Vector2 } from "~/utils/Vector2";
import type { GameEntity, Ship } from "~/entities";
import { isShip } from "~/entities";
import {
    SCORING,
    SHIP,
    GIFT,
    BULLET,
    WEAPONS,
    type GeometryMode,
    type GiftType,
} from "~/config/constants";
import { CanvasManager } from "~/display/CanvasManager";
import { MenuManager } from "~/menu/MenuManager";
import { LevelCompleteAnimation } from "~/animations/LevelCompleteAnimation";

import { GameState } from "./GameState";

// Legacy type alias for backward compatibility during refactoring
type GameObject = GameEntity;

export class Game {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private gameObjects: GameEntity[] = [];
    private input: InputManager;
    private gameState: GameState;
    private audio: AudioManager;
    private particles: ParticleSystem;
    private canvasManager: CanvasManager;
    private menuManager: MenuManager;
    private levelCompleteAnimation: LevelCompleteAnimation;
    private levelAnimationStarted = false;
    private levelStartTime = 0;
    private lastTime = 0;
    private isPaused = false;
    private running = false;
    private lastShotTime = 0;
    private lastThrustTime = 0;
    private gameOverSoundPlayed = false;
    private lastGiftSpawnTime = 0;
    private giftSpawnInterval = GIFT.SPAWN_INTERVAL; // Time between gifts
    private pendingGiftSpawn: Vector2 | null = null; // Deferred gift creation
    private pendingWarpBubbleCreation: GameObject | null = null; // Deferred warp bubble creation

    constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.input = new InputManager();
        this.gameState = new GameState();
        this.audio = new AudioManager();
        this.particles = new ParticleSystem();
        this.canvasManager = new CanvasManager(canvas);
        this.menuManager = new MenuManager(this, canvas, ctx);
        this.levelCompleteAnimation = new LevelCompleteAnimation(
            canvas,
            ctx,
            this.gameState
        );

        // Listen for canvas resize events
        this.canvasManager.onResize(() => this.handleCanvasResize());

        this.gameState.init(); // Initialize high score
        this.init();
    }

    private init(): void {
        // Create a simple ship rectangle
        const ship: Ship = {
            position: this.getShipSpawnPosition(),
            velocity: Vector2.zero(),
            size: new Vector2(SHIP.WIDTH, SHIP.HEIGHT),
            rotation: 0,
            color: SHIP.COLOR,
            type: "ship",
        };
        this.gameObjects.push(ship);

        // Create initial asteroids with variety
        for (let i = 0; i < 4; i++) {
            this.createAsteroid();
        }

        // Start timing the first level
        this.levelStartTime = performance.now();
    }

    /**
     * Get current canvas dimensions
     */
    private getCanvasDimensions() {
        return {
            width: this.canvas.width,
            height: this.canvas.height,
        };
    }

    /**
     * Get ship spawn position based on current canvas size
     */
    private getShipSpawnPosition(): Vector2 {
        const dimensions = this.getCanvasDimensions();
        return new Vector2(
            dimensions.width * SHIP.SPAWN_X_RATIO,
            dimensions.height * SHIP.SPAWN_Y_RATIO
        );
    }

    /**
     * Handle canvas resize events
     */
    private handleCanvasResize(): void {
        // Note: Game objects will automatically adapt to new canvas dimensions
        // through the existing screen wrapping logic
        // Canvas dimensions updated automatically
    }

    /**
     * Set geometry mode for the canvas
     */
    setGeometry(
        mode: string,
        options?: {
            aspectRatio?: number;
            customWidth?: number;
            customHeight?: number;
        }
    ): void {
        this.canvasManager.setGeometry({
            mode: mode as GeometryMode,
            aspectRatio: options?.aspectRatio,
            customWidth: options?.customWidth,
            customHeight: options?.customHeight,
        });
    }

    /**
     * Toggle pause state and menu visibility
     */
    private togglePause(): void {
        this.isPaused = !this.isPaused;
        this.menuManager.toggle();
    }

    start(): void {
        this.running = true;

        // Play game start fanfare
        this.audio.playGameStart().catch(() => {
            // Ignore audio errors
        });

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

        // Handle menu toggle
        if (this.input.menuToggle) {
            this.togglePause();
            return;
        }

        // Handle menu input when menu is visible
        if (this.menuManager.visible) {
            if (this.input.menuUp) this.menuManager.handleInput("up");
            if (this.input.menuDown) this.menuManager.handleInput("down");
            if (this.input.menuLeft) this.menuManager.handleInput("left");
            if (this.input.menuRight) this.menuManager.handleInput("right");
            if (this.input.menuSelect) this.menuManager.handleInput("select");
            return; // Don't update game while menu is open
        }

        // Check for restart if game is over
        if (this.gameState.gameOver && this.input.restart) {
            this.restart();
            return;
        }

        // Handle weapon switching (only when game is not over or paused)
        if (!this.gameState.gameOver && !this.isPaused) {
            if (this.input.weapon1) {
                this.gameState.switchWeapon("bullets");
            } else if (this.input.weapon2) {
                this.gameState.switchWeapon("missiles");
            } else if (this.input.weapon3) {
                this.gameState.switchWeapon("laser");
            } else if (this.input.weapon4) {
                this.gameState.switchWeapon("lightning");
            }
        }

        // Update level completion animation
        this.levelCompleteAnimation.update(currentTime);

        // Check for space key dismissal of level complete animation
        if (
            this.levelCompleteAnimation.active &&
            this.levelCompleteAnimation.canBeDismissed &&
            this.input.shoot
        ) {
            this.levelCompleteAnimation.complete();
        }

        // Check if animation completed and advance to next level
        if (!this.levelCompleteAnimation.active && this.levelAnimationStarted) {
            this.advanceToNextLevel();
            this.levelAnimationStarted = false;
        }

        // Skip updates if game is over, paused, or level animation is playing
        if (
            this.gameState.gameOver ||
            this.isPaused ||
            this.levelCompleteAnimation.active
        ) {
            return;
        }

        // Spawn gifts periodically
        if (currentTime - this.lastGiftSpawnTime > this.giftSpawnInterval) {
            this.spawnGift();
            this.lastGiftSpawnTime = currentTime;
        }

        // Update objects
        this.gameObjects.forEach((obj) => {
            if (obj.type === "ship" && isShip(obj)) {
                this.updateShip(obj, deltaTime, currentTime);

                // Update invulnerability
                if (obj.invulnerable && obj.invulnerableTime) {
                    obj.invulnerableTime -= deltaTime;
                    if (obj.invulnerableTime <= 0) {
                        obj.invulnerable = false;
                        obj.invulnerableTime = 0;
                    }
                }
            } else if (obj.type === "asteroid") {
                // Rotate asteroids
                obj.rotation += deltaTime;
            } else if (obj.type === "bullet") {
                // Age bullets
                obj.age = (obj.age || 0) + deltaTime;
            } else if (obj.type === "warpBubbleIn") {
                // Update warp bubble opening animation
                obj.age = (obj.age || 0) + deltaTime;
                obj.warpAnimationProgress = Math.min(
                    1,
                    (obj.age || 0) / GIFT.OPENING_ANIMATION_TIME
                );
            } else if (obj.type === "warpBubbleOut") {
                // Update warp bubble closing animation
                obj.age = (obj.age || 0) + deltaTime;
                if (!obj.warpDisappearing) {
                    obj.warpAnimationProgress = Math.min(
                        1,
                        (obj.age || 0) / GIFT.CLOSING_ANIMATION_TIME
                    ); // Animation timing from constants
                }
            } else if (obj.type === "gift") {
                // Age gifts and check for expiration
                obj.age = (obj.age || 0) + deltaTime;
                obj.rotation += deltaTime * 2; // Slow rotation for visual appeal
            }

            // Update position
            obj.position = obj.position.add(obj.velocity.multiply(deltaTime));

            // Wrap around screen edges (except bullets and warp bubbles)
            if (
                obj.type !== "bullet" &&
                obj.type !== "warpBubbleIn" &&
                obj.type !== "warpBubbleOut"
            ) {
                if (obj.position.x < 0) obj.position.x = this.canvas.width;
                if (obj.position.x > this.canvas.width) obj.position.x = 0;
                if (obj.position.y < 0) obj.position.y = this.canvas.height;
                if (obj.position.y > this.canvas.height) obj.position.y = 0;
            }
        });

        // Update particles
        this.particles.update(deltaTime);

        // Check collisions
        this.checkCollisions();

        // Remove old objects and handle gift lifecycle
        this.gameObjects = this.gameObjects.filter((obj) => {
            if (obj.type === "bullet") {
                const maxAge = 3; // seconds
                const outOfBounds =
                    obj.position.x < -50 ||
                    obj.position.x > this.canvas.width + 50 ||
                    obj.position.y < -50 ||
                    obj.position.y > this.canvas.height + 50;
                return (obj.age || 0) < maxAge && !outOfBounds;
            } else if (obj.type === "warpBubbleIn") {
                // Remove when animation is complete
                if ((obj.age || 0) >= GIFT.OPENING_ANIMATION_TIME) {
                    // Schedule gift spawn for after filter operation
                    this.pendingGiftSpawn = obj.position.copy();
                    return false;
                }
                return true;
            } else if (obj.type === "warpBubbleOut") {
                // If disappearing animation is active, check if it's complete
                if (obj.warpDisappearing && obj.warpDisappearStartTime) {
                    const disappearElapsed =
                        currentTime - obj.warpDisappearStartTime;
                    return (
                        disappearElapsed < GIFT.DISAPPEAR_ANIMATION_TIME * 1000
                    ); // Convert to milliseconds
                }
                // Otherwise keep the exit warp bubble visible for designated time
                return (obj.age || 0) < GIFT.WARP_BUBBLE_CREATION_DELAY;
            } else if (obj.type === "gift") {
                // Check if it's time to create closing warp bubble
                if (
                    (obj.age || 0) >= GIFT.WARP_BUBBLE_CREATION_DELAY &&
                    !obj.closingWarpCreated
                ) {
                    // Schedule for after filter operation (like pendingGiftSpawn)
                    this.pendingWarpBubbleCreation = obj;
                    obj.closingWarpCreated = true; // Mark so we don't create multiple
                }
                // Remove gift only after collision with exit warp or designated lifespan
                return (obj.age || 0) < GIFT.LIFESPAN;
            }
            return true;
        });

        // Handle pending gift spawn after filter operation
        if (this.pendingGiftSpawn) {
            this.spawnGiftFromWarp({
                position: this.pendingGiftSpawn,
            } as GameObject);
            this.pendingGiftSpawn = null;
        }

        // Handle pending warp bubble creation after filter operation
        if (this.pendingWarpBubbleCreation) {
            this.createClosingWarpBubble(this.pendingWarpBubbleCreation);
            this.pendingWarpBubbleCreation = null;
        }

        // Check if level is complete (no asteroids left)
        const remainingAsteroids = this.gameObjects.filter(
            (obj) => obj.type === "asteroid"
        );
        if (remainingAsteroids.length === 0) {
            this.nextLevel();
        }
    }

    private checkCollisions(): void {
        const bullets = this.gameObjects.filter((obj) => obj.type === "bullet");
        const asteroids = this.gameObjects.filter(
            (obj) => obj.type === "asteroid"
        );
        const gifts = this.gameObjects.filter((obj) => obj.type === "gift");
        const warpBubblesOut = this.gameObjects.filter(
            (obj) => obj.type === "warpBubbleOut"
        );
        const shipEntity = this.gameObjects.find((obj) => obj.type === "ship");
        const ship = shipEntity && isShip(shipEntity) ? shipEntity : null;

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

        // Check bullet-gift collisions
        for (const bullet of bullets) {
            for (const gift of gifts) {
                if (Collision.checkCircleCollision(bullet, gift)) {
                    // Mark bullet for removal
                    bullet.age = 999;

                    // Destroy the gift with penalty
                    this.destroyGift(gift);
                    break; // Bullet can only hit one gift
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

        // Check ship-gift collisions
        if (ship) {
            for (const gift of gifts) {
                if (Collision.checkCircleCollision(ship, gift)) {
                    this.collectGift(gift);
                    break; // Only collect one gift per frame
                }
            }
        }

        // Check gift-warpBubbleOut collisions (gift gets captured by closing warp)
        for (const gift of gifts) {
            for (const warpOut of warpBubblesOut) {
                // Check if gift has reached the center of the warp bubble (within 10 pixels)
                const dx = gift.position.x - warpOut.position.x;
                const dy = gift.position.y - warpOut.position.y;
                const distanceToCenter = Math.sqrt(dx * dx + dy * dy);
                if (distanceToCenter <= 10 && !warpOut.warpDisappearing) {
                    // Remove the gift (it gets captured by the closing warp)
                    const giftIndex = this.gameObjects.indexOf(gift);
                    if (giftIndex > -1) {
                        this.gameObjects.splice(giftIndex, 1);
                    }
                    // Start the warp bubble disappearing animation
                    warpOut.warpDisappearing = true;
                    warpOut.warpDisappearStartTime = performance.now();
                    break;
                }
            }
        }
    }

    private destroyShip(ship: Ship): void {
        // Create ship explosion particles
        this.particles.createShipExplosion(ship.position);

        // Play ship destruction sound
        this.audio.playShipHit().catch(() => {
            // Ignore audio errors
        });

        // Lose a life
        this.gameState.loseLife();

        // If game over, remove the ship from the game
        if (this.gameState.gameOver) {
            const shipIndex = this.gameObjects.indexOf(ship);
            if (shipIndex > -1) {
                this.gameObjects.splice(shipIndex, 1);
            }
            this.showGameOver();
        } else {
            // Reset ship position and velocity
            ship.position = this.getShipSpawnPosition();
            ship.velocity = Vector2.zero();
            ship.rotation = 0;

            // Make ship invulnerable for designated time
            ship.invulnerable = true;
            ship.invulnerableTime = SHIP.INVULNERABLE_TIME;

            // Reset game over sound flag when not game over
            this.gameOverSoundPlayed = false;
        }
    }

    private showGameOver(): void {
        // Play sad trombone sound (only once)
        if (!this.gameOverSoundPlayed) {
            this.audio.playGameOver().catch(() => {
                // Ignore audio errors
            });
            this.gameOverSoundPlayed = true;
        }

        // Add game over text to the canvas
        this.ctx.save();
        this.ctx.textAlign = "center";

        // Game Over text in red with Orbitron font
        this.ctx.fillStyle = "#ff0000";
        this.ctx.font = '900 48px Orbitron, "Courier New", monospace';
        this.ctx.fillText(
            "GAME OVER",
            this.canvas.width / 2,
            this.canvas.height / 2
        );

        // Restart text in light yellow with Orbitron font
        this.ctx.fillStyle = "#ffff88";
        this.ctx.font = '700 24px Orbitron, "Courier New", monospace';
        this.ctx.fillText(
            "Press R to Restart",
            this.canvas.width / 2,
            this.canvas.height / 2 + 60
        );
        this.ctx.restore();
    }

    restart(): void {
        // Reset game state
        this.gameState.reset();

        // Clear all objects and reinitialize
        this.gameObjects = [];
        this.init();

        // Reset timing and flags
        this.lastShotTime = 0;
        this.lastThrustTime = 0;
        this.gameOverSoundPlayed = false;
        this.lastGiftSpawnTime = 0;

        // Reset pause state and hide menu
        this.isPaused = false;
        this.menuManager.hide();

        // Play game start fanfare
        this.audio.playGameStart().catch(() => {
            // Ignore audio errors
        });
    }

    private nextLevel(): void {
        // Calculate level completion time
        const completionTime = (performance.now() - this.levelStartTime) / 1000; // Convert to seconds

        // Start level completion animation
        this.levelCompleteAnimation.start(this.gameState.level, completionTime);
        this.levelAnimationStarted = true;
    }

    private advanceToNextLevel(): void {
        // Clean up all objects except the ship before starting new level
        this.gameObjects = this.gameObjects.filter(
            (obj) => obj.type === "ship"
        );

        // Advance to next level
        this.gameState.nextLevel();

        // Spawn more asteroids based on level (3 + level number)
        const asteroidCount = 3 + this.gameState.level;

        for (let i = 0; i < asteroidCount; i++) {
            this.createAsteroid();
        }

        // Start timing the new level
        this.levelStartTime = performance.now();
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
            color: "#ffffff",
            type: "asteroid",
        });
    }

    private destroyAsteroid(asteroid: GameObject): void {
        // Create asteroid explosion particles
        this.particles.createAsteroidExplosion(
            asteroid.position,
            asteroid.size.x
        );

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
            // Play asteroid break sound (splitting into pieces)
            this.audio.playAsteroidHit().catch(() => {
                // Ignore audio errors
            });

            // Create 2-3 smaller fragments
            const fragmentCount = 2 + Math.floor(Math.random() * 2);
            for (let i = 0; i < fragmentCount; i++) {
                const fragmentSize =
                    asteroid.size.x * (0.4 + Math.random() * 0.3); // 40-70% of original
                const speed = 80 + Math.random() * 60; // Faster fragments
                const angle = Math.random() * Math.PI * 2;

                this.gameObjects.push({
                    position: asteroid.position.add(
                        new Vector2(
                            (Math.random() - 0.5) * 40,
                            (Math.random() - 0.5) * 40
                        )
                    ),
                    velocity: Vector2.fromAngle(angle, speed),
                    size: new Vector2(fragmentSize, fragmentSize),
                    rotation: Math.random() * Math.PI * 2,
                    color: "#ffffff",
                    type: "asteroid",
                });
            }
        } else {
            // Play asteroid destruction sound (completely destroyed)
            this.audio.playAsteroidDestroy().catch(() => {
                // Ignore audio errors
            });
        }
    }

    private collectGift(gift: GameObject): void {
        // Play gift collection sound
        this.audio.playGiftCollected().catch(() => {
            // Ignore audio errors
        });

        // Remove the gift from the game
        const giftIndex = this.gameObjects.indexOf(gift);
        if (giftIndex > -1) {
            this.gameObjects.splice(giftIndex, 1);
        }

        // Award points for gift collection
        this.gameState.addScore(SCORING.GIFT);

        // Apply gift benefits based on type
        const giftType = gift.giftType || "fuel_refill";

        switch (giftType) {
            case "fuel_refill":
                this.gameState.refillFuel();
                break;

            case "extra_life":
                // Add extra life (we'll need to add this method to GameState)
                this.gameState.addLife();
                break;

            case "weapon_bullets":
                this.gameState.unlockWeapon("bullets");
                break;

            case "weapon_missiles":
                this.gameState.unlockWeapon("missiles");
                break;

            case "weapon_laser":
                this.gameState.unlockWeapon("laser");
                break;

            case "weapon_lightning":
                this.gameState.unlockWeapon("lightning");
                break;

            default:
                // Handle upgrades
                this.gameState.applyWeaponUpgrade(giftType);
                break;
        }
    }

    private destroyGift(gift: GameObject): void {
        // Play frustrated cat sound
        this.audio.playGiftDestroyed().catch(() => {
            // Ignore audio errors
        });

        // Remove the gift from the game
        const giftIndex = this.gameObjects.indexOf(gift);
        if (giftIndex > -1) {
            this.gameObjects.splice(giftIndex, 1);
        }

        // Apply score penalty for destroying a gift
        this.gameState.addScore(-SCORING.GIFT_DESTRUCTION_PENALTY);

        // Create explosion particles for visual feedback
        this.particles.createGiftExplosion(gift.position);
    }

    private updateShip(
        ship: Ship,
        deltaTime: number,
        currentTime: number
    ): void {
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

        // Main thrust (2x fuel consumption)
        ship.thrusting = this.input.thrust;
        if (this.input.thrust) {
            const fuelNeeded = 2 * deltaTime; // 2 units per second
            if (this.gameState.consumeFuel(fuelNeeded)) {
                const thrustVector = Vector2.fromAngle(
                    ship.rotation,
                    thrustPower * deltaTime
                );
                ship.velocity = ship.velocity.add(thrustVector);

                // Play thrust sound periodically while thrusting
                if (currentTime - this.lastThrustTime > 200) {
                    // Every 200ms
                    this.audio.playThrust().catch(() => {
                        // Ignore audio errors
                    });
                    this.lastThrustTime = currentTime;
                }
            } else {
                ship.thrusting = false; // Can't thrust without fuel
            }
        }

        // Strafe thrusters (50% power, 1x fuel consumption each)
        const strafePower = thrustPower * 0.5;

        ship.strafingLeft = this.input.strafeLeft;
        if (this.input.strafeLeft) {
            const fuelNeeded = 1 * deltaTime; // 1 unit per second
            if (this.gameState.consumeFuel(fuelNeeded)) {
                // Q key: Move ship LEFT (starboard thruster fires right-ward flames)
                const strafeVector = Vector2.fromAngle(
                    ship.rotation - Math.PI / 2,
                    strafePower * deltaTime
                );
                ship.velocity = ship.velocity.add(strafeVector);
            } else {
                ship.strafingLeft = false; // Can't strafe without fuel
            }
        }

        ship.strafingRight = this.input.strafeRight;
        if (this.input.strafeRight) {
            const fuelNeeded = 1 * deltaTime; // 1 unit per second
            if (this.gameState.consumeFuel(fuelNeeded)) {
                // E key: Move ship RIGHT (port thruster fires left-ward flames)
                const strafeVector = Vector2.fromAngle(
                    ship.rotation + Math.PI / 2,
                    strafePower * deltaTime
                );
                ship.velocity = ship.velocity.add(strafeVector);
            } else {
                ship.strafingRight = false; // Can't strafe without fuel
            }
        }

        // Apply friction
        ship.velocity = ship.velocity.multiply(friction);

        // Limit max speed
        const speed = Math.sqrt(
            ship.velocity.x * ship.velocity.x +
                ship.velocity.y * ship.velocity.y
        );
        if (speed > maxSpeed) {
            ship.velocity = ship.velocity.multiply(maxSpeed / speed);
        }

        // Shooting
        if (this.input.shoot) {
            this.handleShooting(ship, currentTime);
        }
    }

    private handleShooting(ship: GameObject, currentTime: number): void {
        const weaponState = this.gameState.weaponState;
        
        switch (weaponState.currentWeapon) {
            case "bullets":
                this.shootBullets(ship, currentTime);
                break;
            case "missiles":
                // TODO: Implement missile shooting
                break;
            case "laser":
                // TODO: Implement laser shooting
                break;
            case "lightning":
                // TODO: Implement lightning shooting
                break;
        }
    }

    private shootBullets(ship: GameObject, currentTime: number): void {
        // Check fire rate (with upgrade consideration)
        let fireRate = BULLET.FIRE_RATE;
        if (this.gameState.hasUpgrade("upgrade_bullets_fire_rate")) {
            fireRate *= WEAPONS.BULLETS.FIRE_RATE_UPGRADE; // 25% faster
        }
        
        if (currentTime - this.lastShotTime < fireRate) {
            return; // Too soon to fire again
        }

        // Check and consume fuel
        if (!this.gameState.consumeFuel(WEAPONS.BULLETS.FUEL_CONSUMPTION)) {
            return; // Not enough fuel
        }

        const bulletSpeed = 500; // pixels per second
        const bulletVelocity = Vector2.fromAngle(ship.rotation, bulletSpeed);

        // Add ship's velocity to bullet for realistic physics
        const finalVelocity = ship.velocity.add(bulletVelocity);

        // Position bullet slightly in front of ship
        const bulletOffset = Vector2.fromAngle(ship.rotation, ship.size.x);
        const bulletPosition = ship.position.add(bulletOffset);

        // Determine bullet size (with upgrade consideration)
        let bulletSize = BULLET.SIZE;
        let bulletColor = WEAPONS.BULLETS.COLOR;
        if (this.gameState.hasUpgrade("upgrade_bullets_size")) {
            bulletSize *= WEAPONS.BULLETS.SIZE_UPGRADE; // 50% larger
            bulletColor = WEAPONS.BULLETS.UPGRADED_COLOR;
        }

        this.gameObjects.push({
            position: bulletPosition,
            velocity: finalVelocity,
            size: new Vector2(bulletSize, bulletSize),
            rotation: 0,
            color: bulletColor,
            type: "bullet",
            age: 0,
        });

        this.lastShotTime = currentTime;

        // Play shooting sound
        this.audio.playShoot().catch(() => {
            // Ignore audio errors (user hasn't interacted yet)
        });
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
            color: "#ffff00",
            type: "bullet",
            age: 0,
        });

        // Play shooting sound
        this.audio.playShoot().catch(() => {
            // Ignore audio errors (user hasn't interacted yet)
        });
    }

    private drawObjectWithWrapAround(obj: GameObject): void {
        // Get object radius for wrap-around detection
        const radius =
            obj.type === "bullet" ? 5 : Math.max(obj.size.x, obj.size.y) / 2;

        // Calculate all positions where object should be drawn
        const positions: Vector2[] = [obj.position];

        // Check if object is near edges and add wrap-around positions
        if (obj.position.x - radius < 0) {
            // Near left edge, also draw on right side
            positions.push(
                new Vector2(obj.position.x + this.canvas.width, obj.position.y)
            );
        }
        if (obj.position.x + radius > this.canvas.width) {
            // Near right edge, also draw on left side
            positions.push(
                new Vector2(obj.position.x - this.canvas.width, obj.position.y)
            );
        }
        if (obj.position.y - radius < 0) {
            // Near top edge, also draw on bottom
            positions.push(
                new Vector2(obj.position.x, obj.position.y + this.canvas.height)
            );
        }
        if (obj.position.y + radius > this.canvas.height) {
            // Near bottom edge, also draw on top
            positions.push(
                new Vector2(obj.position.x, obj.position.y - this.canvas.height)
            );
        }

        // Handle corner cases (object near both horizontal and vertical edges)
        if (positions.length > 2) {
            // Add diagonal wrap-around positions for corners
            if (obj.position.x - radius < 0 && obj.position.y - radius < 0) {
                positions.push(
                    new Vector2(
                        obj.position.x + this.canvas.width,
                        obj.position.y + this.canvas.height
                    )
                );
            }
            if (
                obj.position.x + radius > this.canvas.width &&
                obj.position.y - radius < 0
            ) {
                positions.push(
                    new Vector2(
                        obj.position.x - this.canvas.width,
                        obj.position.y + this.canvas.height
                    )
                );
            }
            if (
                obj.position.x - radius < 0 &&
                obj.position.y + radius > this.canvas.height
            ) {
                positions.push(
                    new Vector2(
                        obj.position.x + this.canvas.width,
                        obj.position.y - this.canvas.height
                    )
                );
            }
            if (
                obj.position.x + radius > this.canvas.width &&
                obj.position.y + radius > this.canvas.height
            ) {
                positions.push(
                    new Vector2(
                        obj.position.x - this.canvas.width,
                        obj.position.y - this.canvas.height
                    )
                );
            }
        }

        // Draw object at all calculated positions
        positions.forEach((pos) => {
            if (obj.type === "ship") {
                Shapes.drawShip(
                    this.ctx,
                    pos,
                    obj.rotation,
                    obj.color,
                    obj.invulnerable,
                    obj.invulnerableTime,
                    obj.thrusting,
                    1.0,
                    obj.strafingLeft,
                    obj.strafingRight
                );
            } else if (obj.type === "asteroid") {
                Shapes.drawAsteroid(
                    this.ctx,
                    pos,
                    obj.rotation,
                    obj.size,
                    obj.color
                );
            } else if (obj.type === "bullet") {
                Shapes.drawBullet(this.ctx, pos, obj.color);
            } else if (obj.type === "warpBubbleIn") {
                Shapes.drawWarpBubble(
                    this.ctx,
                    pos,
                    obj.warpAnimationProgress || 0,
                    false
                );
            } else if (obj.type === "warpBubbleOut") {
                let disappearProgress = 0;
                if (obj.warpDisappearing && obj.warpDisappearStartTime) {
                    const disappearElapsed =
                        performance.now() - obj.warpDisappearStartTime;
                    disappearProgress = Math.min(1, disappearElapsed / 500); // 0.5 second animation
                }
                Shapes.drawWarpBubble(
                    this.ctx,
                    pos,
                    obj.warpAnimationProgress || 0,
                    false, // Exit warp should grow open, not shrink closed
                    obj.warpDisappearing || false,
                    disappearProgress
                );
            } else if (obj.type === "gift") {
                Shapes.drawGift(this.ctx, pos, obj.rotation, obj.giftType);
            }
        });
    }

    private getFuelColor(percentage: number): string {
        if (percentage < 20) {
            return "#ff0000"; // Red
        }

        // Smooth transition from yellow to green (20% to 100%)
        const normalizedPercentage = (percentage - 20) / 80; // 0 to 1
        const red = Math.round(255 * (1 - normalizedPercentage)); // 255 to 0
        const green = 255; // Constant
        const blue = 0; // Constant

        return `rgb(${red}, ${green}, ${blue})`;
    }

    private renderFuelGauge(): void {
        const gaugeWidth = 200;
        const gaugeHeight = 20;
        const gaugeX = (this.canvas.width - gaugeWidth) / 2;
        const gaugeY = 20;
        const cornerRadius = 4;

        this.ctx.save();

        // Set 40% opacity for subtle appearance
        this.ctx.globalAlpha = 0.4;

        // Draw gauge outline with rounded corners (medium gray)
        this.ctx.strokeStyle = "#888888";
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.roundRect(
            gaugeX,
            gaugeY,
            gaugeWidth,
            gaugeHeight,
            cornerRadius
        );
        this.ctx.stroke();

        // Draw fuel fill with rounded corners
        const fuelPercentage = this.gameState.fuelPercentage;
        const fillWidth = (gaugeWidth - 4) * (fuelPercentage / 100); // -4 for border

        if (fillWidth > 0) {
            this.ctx.fillStyle = this.getFuelColor(fuelPercentage);
            this.ctx.beginPath();
            this.ctx.roundRect(
                gaugeX + 2,
                gaugeY + 2,
                fillWidth,
                gaugeHeight - 4,
                cornerRadius - 1
            );
            this.ctx.fill();
        }

        this.ctx.restore();
    }

    private renderWeaponHUD(): void {
        const weaponState = this.gameState.weaponState;
        const weapons = [
            {
                type: "bullets",
                unlocked: weaponState.inventory.bullets,
                selected: weaponState.currentWeapon === "bullets",
            },
            {
                type: "missiles",
                unlocked: weaponState.inventory.missiles,
                selected: weaponState.currentWeapon === "missiles",
            },
            {
                type: "laser",
                unlocked: weaponState.inventory.laser,
                selected: weaponState.currentWeapon === "laser",
            },
            {
                type: "lightning",
                unlocked: weaponState.inventory.lightning,
                selected: weaponState.currentWeapon === "lightning",
            },
        ];

        const hudPosition = new Vector2(
            WEAPONS.HUD.X_OFFSET,
            WEAPONS.HUD.Y_START
        );

        Shapes.drawWeaponHUD(
            this.ctx,
            weapons,
            hudPosition,
            WEAPONS.HUD.ICON_SIZE,
            WEAPONS.HUD.ICON_SPACING
        );
    }

    private render(): void {
        // Clear canvas
        this.ctx.fillStyle = "#000000";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw objects with vector graphics and wrap-around
        this.gameObjects.forEach((obj) => {
            this.drawObjectWithWrapAround(obj);
        });

        // Draw particles
        this.particles.render(this.ctx);

        // Draw fuel gauge
        this.renderFuelGauge();

        // Draw weapon HUD
        this.renderWeaponHUD();

        // Draw game over screen if needed
        if (this.gameState.gameOver) {
            this.showGameOver();
        }

        // Draw menu overlay if visible
        this.menuManager.render();

        // Draw level completion animation if active
        this.levelCompleteAnimation.render();
    }

    private selectGiftType(): GiftType {
        const availableGifts: { type: GiftType; weight: number }[] = [];

        // Always available gifts
        availableGifts.push(
            { type: "fuel_refill", weight: GIFT.SPAWN_WEIGHTS.FUEL_REFILL },
            { type: "extra_life", weight: GIFT.SPAWN_WEIGHTS.EXTRA_LIFE }
        );

        // Weapon unlocks (only if not already unlocked)
        if (!this.gameState.hasWeapon("bullets")) {
            availableGifts.push({
                type: "weapon_bullets",
                weight: GIFT.SPAWN_WEIGHTS.WEAPON_BULLETS,
            });
        }
        if (!this.gameState.hasWeapon("missiles")) {
            availableGifts.push({
                type: "weapon_missiles",
                weight: GIFT.SPAWN_WEIGHTS.WEAPON_MISSILES,
            });
        }
        if (!this.gameState.hasWeapon("laser")) {
            availableGifts.push({
                type: "weapon_laser",
                weight: GIFT.SPAWN_WEIGHTS.WEAPON_LASER,
            });
        }
        if (!this.gameState.hasWeapon("lightning")) {
            availableGifts.push({
                type: "weapon_lightning",
                weight: GIFT.SPAWN_WEIGHTS.WEAPON_LIGHTNING,
            });
        }

        // Weapon upgrades (only if weapon is unlocked and upgrade not already acquired)
        if (this.gameState.hasWeapon("bullets")) {
            if (!this.gameState.hasUpgrade("upgrade_bullets_fire_rate")) {
                availableGifts.push({
                    type: "upgrade_bullets_fire_rate",
                    weight: GIFT.SPAWN_WEIGHTS.UPGRADE_BULLETS_FIRE_RATE,
                });
            }
            if (!this.gameState.hasUpgrade("upgrade_bullets_size")) {
                availableGifts.push({
                    type: "upgrade_bullets_size",
                    weight: GIFT.SPAWN_WEIGHTS.UPGRADE_BULLETS_SIZE,
                });
            }
        }

        if (this.gameState.hasWeapon("missiles")) {
            if (!this.gameState.hasUpgrade("upgrade_missiles_speed")) {
                availableGifts.push({
                    type: "upgrade_missiles_speed",
                    weight: GIFT.SPAWN_WEIGHTS.UPGRADE_MISSILES_SPEED,
                });
            }
            if (!this.gameState.hasUpgrade("upgrade_missiles_fire_rate")) {
                availableGifts.push({
                    type: "upgrade_missiles_fire_rate",
                    weight: GIFT.SPAWN_WEIGHTS.UPGRADE_MISSILES_FIRE_RATE,
                });
            }
            if (!this.gameState.hasUpgrade("upgrade_missiles_homing")) {
                availableGifts.push({
                    type: "upgrade_missiles_homing",
                    weight: GIFT.SPAWN_WEIGHTS.UPGRADE_MISSILES_HOMING,
                });
            }
        }

        if (this.gameState.hasWeapon("laser")) {
            if (!this.gameState.hasUpgrade("upgrade_laser_range")) {
                availableGifts.push({
                    type: "upgrade_laser_range",
                    weight: GIFT.SPAWN_WEIGHTS.UPGRADE_LASER_RANGE,
                });
            }
            if (!this.gameState.hasUpgrade("upgrade_laser_efficiency")) {
                availableGifts.push({
                    type: "upgrade_laser_efficiency",
                    weight: GIFT.SPAWN_WEIGHTS.UPGRADE_LASER_EFFICIENCY,
                });
            }
        }

        if (this.gameState.hasWeapon("lightning")) {
            if (!this.gameState.hasUpgrade("upgrade_lightning_radius")) {
                availableGifts.push({
                    type: "upgrade_lightning_radius",
                    weight: GIFT.SPAWN_WEIGHTS.UPGRADE_LIGHTNING_RADIUS,
                });
            }
            if (!this.gameState.hasUpgrade("upgrade_lightning_chain")) {
                availableGifts.push({
                    type: "upgrade_lightning_chain",
                    weight: GIFT.SPAWN_WEIGHTS.UPGRADE_LIGHTNING_CHAIN,
                });
            }
        }

        // Calculate total weight
        const totalWeight = availableGifts.reduce(
            (sum, gift) => sum + gift.weight,
            0
        );

        // Select random gift based on weights
        let random = Math.random() * totalWeight;
        for (const gift of availableGifts) {
            random -= gift.weight;
            if (random <= 0) {
                return gift.type;
            }
        }

        // Fallback (should never happen)
        return "fuel_refill";
    }

    private spawnGift(): void {
        // Select gift type based on current game state
        const giftType = this.selectGiftType();

        // Choose a random position at the edge of the screen
        const side = Math.floor(Math.random() * 4); // 0=top, 1=right, 2=bottom, 3=left
        let x, y;

        switch (side) {
            case 0: // top
                x = Math.random() * this.canvas.width;
                y = -50;
                break;
            case 1: // right
                x = this.canvas.width + 50;
                y = Math.random() * this.canvas.height;
                break;
            case 2: // bottom
                x = Math.random() * this.canvas.width;
                y = this.canvas.height + 50;
                break;
            case 3: // left
                x = -50;
                y = Math.random() * this.canvas.height;
                break;
            default:
                x = 100;
                y = 100;
        }

        // Get warp bubble color based on gift type
        const getWarpColor = (type: GiftType): string => {
            switch (type) {
                case "fuel_refill": return GIFT.WARP_COLORS.FUEL_REFILL;
                case "extra_life": return GIFT.WARP_COLORS.EXTRA_LIFE;
                case "weapon_bullets": return GIFT.WARP_COLORS.WEAPON_BULLETS;
                case "weapon_missiles": return GIFT.WARP_COLORS.WEAPON_MISSILES;
                case "weapon_laser": return GIFT.WARP_COLORS.WEAPON_LASER;
                case "weapon_lightning": return GIFT.WARP_COLORS.WEAPON_LIGHTNING;
                case "upgrade_bullets_fire_rate": return GIFT.WARP_COLORS.UPGRADE_BULLETS_FIRE_RATE;
                case "upgrade_bullets_size": return GIFT.WARP_COLORS.UPGRADE_BULLETS_SIZE;
                case "upgrade_missiles_speed": return GIFT.WARP_COLORS.UPGRADE_MISSILES_SPEED;
                case "upgrade_missiles_fire_rate": return GIFT.WARP_COLORS.UPGRADE_MISSILES_FIRE_RATE;
                case "upgrade_missiles_homing": return GIFT.WARP_COLORS.UPGRADE_MISSILES_HOMING;
                case "upgrade_laser_range": return GIFT.WARP_COLORS.UPGRADE_LASER_RANGE;
                case "upgrade_laser_efficiency": return GIFT.WARP_COLORS.UPGRADE_LASER_EFFICIENCY;
                case "upgrade_lightning_radius": return GIFT.WARP_COLORS.UPGRADE_LIGHTNING_RADIUS;
                case "upgrade_lightning_chain": return GIFT.WARP_COLORS.UPGRADE_LIGHTNING_CHAIN;
                default: return GIFT.WARP_BUBBLE_COLOR;
            }
        };
        const warpColor = getWarpColor(giftType);

        // Create opening warp bubble with gift type stored for later
        this.gameObjects.push({
            position: new Vector2(x, y),
            velocity: Vector2.zero(),
            size: new Vector2(80, 80), // Large enough for the bubble
            rotation: 0,
            color: warpColor,
            type: "warpBubbleIn",
            age: 0,
            warpAnimationProgress: 0,
            giftType: giftType, // Store gift type for spawning later
        });

        // Play warp bubble opening sound
        this.audio.playWarpBubbleOpening().catch(() => {
            // Ignore audio errors
        });
    }

    private spawnGiftFromWarp(warpBubble: GameObject): void {
        // Calculate a trajectory toward the center area (more likely to be seen)
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const targetX = centerX + (Math.random() - 0.5) * 200; // Within 200px of center
        const targetY = centerY + (Math.random() - 0.5) * 200;

        // Gift spawns at EXACT warp bubble location
        const giftPosition = warpBubble.position.copy();

        const direction = new Vector2(
            targetX - giftPosition.x,
            targetY - giftPosition.y
        ).normalize();
        const speed = 30 + Math.random() * 30; // Slower: 30-60 pixels per second
        const velocity = direction.multiply(speed);

        // Get gift type from warp bubble, fallback to fuel_refill
        const giftType = warpBubble.giftType || "fuel_refill";

        // Create the gift
        const gift: GameObject = {
            position: new Vector2(giftPosition.x, giftPosition.y),
            velocity: new Vector2(velocity.x, velocity.y),
            size: new Vector2(20, 20),
            rotation: 0,
            color: "#ffff00",
            type: "gift",
            age: 0,
            giftSpawnTime: performance.now(),
            giftCollectionDeadline: performance.now() + 8000, // 8 seconds: 5 for collection window + 3 for warp closing
            closingWarpCreated: false, // Track if we've created the exit warp bubble
            giftType: giftType, // Store the gift type
        };

        this.gameObjects.push(gift);
    }

    private createClosingWarpBubble(gift: GameObject): void {
        // Position the warp bubble where the gift will be in 3 seconds
        // This accounts for the 1-second warp bubble opening animation + 2 seconds travel time
        const futurePosition = gift.position.add(gift.velocity.multiply(3.0)); // 3 seconds ahead

        // Use the calculated future position
        const warpPosition = futurePosition;

        // Create closing warp bubble
        const warpBubble = {
            position: warpPosition,
            velocity: Vector2.zero(),
            size: new Vector2(80, 80),
            rotation: 0,
            color: "#00ffff",
            type: "warpBubbleOut" as const,
            age: 0,
            warpAnimationProgress: 0,
        };

        this.gameObjects.push(warpBubble);

        // Play warp bubble closing sound
        this.audio.playWarpBubbleClosing().catch(() => {
            // Ignore audio errors
        });
    }
}
