import { AudioManager } from "~/audio/AudioManager";
import { InputManager } from "~/input/InputManager";
import { InputContext } from "~/input/InputContext";
import { ParticleSystem } from "~/render/ParticleSystem";
import { Shapes } from "~/render/Shapes";
import { Vector2 } from "~/utils/Vector2";
import { ScaleManager } from "~/utils/ScaleManager";
import type { GameEntity, Ship } from "~/entities";
import {
    SHIP,
    BULLET,
    WEAPONS,
    ASTEROID,
    GIFT,
    WARP_BUBBLE,
    AI,
    SHIELD,
    type GeometryMode,
    type GiftType,
} from "~/config/constants";
import { CanvasManager } from "~/display/CanvasManager";
import { MenuManager } from "~/menu/MenuManager";
import { LevelCompleteAnimation } from "~/animations/LevelCompleteAnimation";

import { GameState } from "./GameState";
import { EntityManager } from "./EntityManager";
import { WeaponSystem } from "./WeaponSystem";
import { ShieldSystem } from "./ShieldSystem";
import { CollisionSystem } from "./CollisionSystem";
import { GiftSystem } from "./GiftSystem";
import { InputHandler } from "./InputHandler";
import { AISystem } from "./AISystem";

export class Game {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private input: InputManager;
    private gameState: GameState;
    private audio: AudioManager;
    private particles: ParticleSystem;
    private canvasManager: CanvasManager;
    private menuManager: MenuManager;
    private levelCompleteAnimation: LevelCompleteAnimation;
    private scaleManager: ScaleManager;

    // Extracted systems
    private entityManager: EntityManager;
    private weaponSystem: WeaponSystem;
    private shieldSystem: ShieldSystem;
    private collisionSystem: CollisionSystem;
    private giftSystem: GiftSystem;
    private inputHandler: InputHandler;
    private aiSystem: AISystem;

    // Game state
    private levelAnimationStarted = false;
    private levelStartTime = 0;
    private lastTime = 0;
    private running = false;
    private gameOverSoundPlayed = false;

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
        this.scaleManager = new ScaleManager(canvas.width, canvas.height);

        // Initialize extracted systems
        this.entityManager = new EntityManager(canvas);
        this.weaponSystem = new WeaponSystem(
            this.audio,
            this.particles,
            this.gameState,
            this.entityManager
        );
        this.shieldSystem = new ShieldSystem(
            this.audio,
            this.gameState,
            this.entityManager
        );
        this.collisionSystem = new CollisionSystem(
            this.audio,
            this.particles,
            this.gameState,
            this.entityManager,
            this.weaponSystem,
            this.shieldSystem
        );
        this.giftSystem = new GiftSystem(
            this.audio,
            this.gameState,
            this.entityManager,
            canvas
        );
        this.inputHandler = new InputHandler(
            this.input,
            this.gameState,
            this.weaponSystem,
            this.shieldSystem,
            this.entityManager,
            this.menuManager,
            this.levelCompleteAnimation
        );
        this.aiSystem = new AISystem(this.entityManager, this.gameState);

        // Listen for canvas resize events
        this.canvasManager.onResize(() => this.handleCanvasResize());

        this.gameState.init(); // Initialize high score
        this.init();
    }

    private init(): void {
        // Create player ship
        const playerShip: Ship = {
            position: this.getPlayerShipSpawnPosition(),
            velocity: Vector2.zero(),
            size: new Vector2(SHIP.WIDTH, SHIP.HEIGHT),
            rotation: 0,
            color: SHIP.COLOR,
            type: "ship",
            playerId: "player",
            trail: [],
        };
        this.entityManager.addEntity(playerShip);

        // Create computer AI ship if enabled
        if (AI.ENABLED) {
            const computerShip: Ship = {
                position: this.getComputerShipSpawnPosition(),
                velocity: Vector2.zero(),
                size: new Vector2(SHIP.WIDTH, SHIP.HEIGHT),
                rotation: 0,
                color: "#00ffff", // Cyan color for AI ship
                type: "ship",
                playerId: "computer",
                isAI: true,
                aiState: "hunting",
                aiTarget: null,
                trail: [],
            };
            this.entityManager.addEntity(computerShip);

            // Give AI ship some initial weapons
            this.gameState.unlockWeapon("bullets", "computer");
            this.gameState.unlockWeapon("missiles", "computer");
        }

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
     * Get player ship spawn position (left side of center)
     */
    private getPlayerShipSpawnPosition(): Vector2 {
        const dimensions = this.getCanvasDimensions();
        return new Vector2(
            dimensions.width * 0.4, // 40% from left
            dimensions.height * 0.5 // Center vertically
        );
    }

    /**
     * Get computer ship spawn position (right side of center)
     */
    private getComputerShipSpawnPosition(): Vector2 {
        const dimensions = this.getCanvasDimensions();
        return new Vector2(
            dimensions.width * 0.6, // 60% from left
            dimensions.height * 0.5 // Center vertically
        );
    }

    /**
     * Handle canvas resize events
     */
    private handleCanvasResize(): void {
        // Update the scale manager with the new canvas dimensions
        this.scaleManager.updateCanvasSize(
            this.canvas.width,
            this.canvas.height
        );

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
     * Set debug next gift type
     */
    setDebugNextGift(giftType: GiftType | null): void {
        this.gameState.setDebugNextGift(giftType);
    }

    /**
     * Get current debug next gift type
     */
    getDebugNextGift(): GiftType | null {
        return this.gameState.debugNextGift;
    }

    // Pause toggling is now handled by InputHandler

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

        // Handle input processing through InputHandler
        this.inputHandler.processInput(
            currentTime,
            () => this.showGameOver(),
            () => this.restart()
        );

        // Update level completion animation
        this.levelCompleteAnimation.update(currentTime);

        // Check if animation completed and advance to next level
        if (!this.levelCompleteAnimation.active && this.levelAnimationStarted) {
            this.advanceToNextLevel();
            this.levelAnimationStarted = false;
        }

        // Skip updates if game is over, paused, or level animation is playing
        if (
            this.gameState.gameOver ||
            this.inputHandler.isPausedState() ||
            this.levelCompleteAnimation.active
        ) {
            return;
        }

        // Update level timer
        this.gameState.updateLevelTimer(deltaTime);

        // Update gift system
        this.giftSystem.update(currentTime);

        // Update shield system
        this.shieldSystem.update(currentTime);

        // Update all entities through EntityManager
        this.entityManager.updateEntities(deltaTime, currentTime);

        // Update weapon-specific physics (missile acceleration, homing)
        this.weaponSystem.updateMissilePhysics(deltaTime);

        // Update AI system for all AI ships
        const aiInputs = this.aiSystem.updateAllAI(currentTime);
        for (const [playerId, aiInput] of aiInputs) {
            const aiShip = this.entityManager
                .getShips()
                .find((ship) => ship.playerId === playerId);
            if (aiShip && aiShip.isAI) {
                this.updateAIShipMovement(aiShip, aiInput, currentTime);
            }
        }

        // Update ship trails for all ships
        const ships = this.entityManager.getShips();
        for (const ship of ships) {
            this.updateShipTrail(ship, currentTime);
        }

        // Update particles
        this.particles.update(deltaTime);

        // Check all collisions through CollisionSystem
        this.collisionSystem.checkAllCollisions(currentTime);

        // Remove expired entities through EntityManager
        this.entityManager.filterExpiredEntities(currentTime);

        // Check if level is complete (no asteroids left)
        const remainingAsteroids = this.entityManager.getAsteroids();
        if (remainingAsteroids.length === 0) {
            this.nextLevel();
        }
    }

    // Collision detection is now handled by CollisionSystem

    // Input handling is now managed by InputHandler

    // Ship destruction and fuel depletion are now handled by CollisionSystem and InputHandler

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

        // Clear all entities and reinitialize
        this.entityManager.clearAllEntities();
        this.init();

        // Reset systems
        this.weaponSystem.reset();
        this.shieldSystem.resetShieldState();
        this.giftSystem.reset();
        this.inputHandler.reset();

        // Reset timing and flags
        this.gameOverSoundPlayed = false;

        // Play game start fanfare
        this.audio.playGameStart().catch(() => {
            // Ignore audio errors
        });
    }

    private nextLevel(): void {
        // Calculate level completion time
        const completionTime = (performance.now() - this.levelStartTime) / 1000; // Convert to seconds

        // Calculate and award time bonus points
        const timeBonus = this.gameState.getLevelTimeBonusPoints();
        if (timeBonus > 0) {
            this.gameState.addScore(timeBonus);
        }

        // Start level completion animation
        this.levelCompleteAnimation.start(this.gameState.level, completionTime);
        this.levelAnimationStarted = true;
    }

    private advanceToNextLevel(): void {
        // Clean up all entities except the ship before starting new level
        this.entityManager.clearAllExceptShips();

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

        this.entityManager.addEntity({
            position: new Vector2(x, y),
            velocity: velocity,
            size: new Vector2(size, size),
            rotation: Math.random() * Math.PI * 2,
            color: "#ffffff",
            type: "asteroid",
            age: 0, // Mark as newly created
        });
    }

    // Asteroid, gift destruction methods are now handled by CollisionSystem

    // Ship movement and weapon systems are now handled by InputHandler and WeaponSystem
    // This massive block of ~1000 lines has been extracted to separate systems

    // Gift system methods (selectGiftType, spawnGift, spawnGiftFromWarp, createClosingWarpBubble)
    // are now handled by GiftSystem - approximately 280 lines of duplicate code removed

    private updateShipTrail(ship: Ship, currentTime: number): void {
        // Initialize trail if it doesn't exist
        if (!ship.trail) {
            ship.trail = [];
        }

        // Trail configuration
        const TRAIL_MAX_POINTS = 8; // Maximum number of trail points (80% fewer particles)
        const TRAIL_POINT_INTERVAL = 150; // Milliseconds between trail points (slower for fewer particles)
        const TRAIL_DECAY_TIME = 2500; // Trail fades over 2.5 seconds (much longer)
        const MIN_MOVEMENT_THRESHOLD = 5; // Minimum distance to add new trail point (less sensitive for spacing)

        // Add new trail point if enough time has passed and ship has moved
        const lastTrailPoint = ship.trail[ship.trail.length - 1];
        const shouldAddPoint =
            !lastTrailPoint ||
            (currentTime - lastTrailPoint.timestamp >= TRAIL_POINT_INTERVAL &&
                ship.position.subtract(lastTrailPoint.position).magnitude() >=
                    MIN_MOVEMENT_THRESHOLD);

        if (shouldAddPoint) {
            // Generate random variations for this trail point
            const baseSize = 1.8; // 40% smaller than previous (was 3.0, now 3.0 * 0.6 = 1.8)
            const sizeVariation = 0.5 + Math.random() * 1.0; // Range: 0.5 to 1.5
            const hueVariation = 25 + Math.random() * 20; // Orange hues: 25-45 degrees
            const opacityVariation = (0.7 + Math.random() * 0.3) * 0.6; // Range: 0.42 to 0.6 (40% dimmer)

            ship.trail.push({
                position: ship.position,
                timestamp: currentTime,
                opacity: opacityVariation,
                size: baseSize * sizeVariation,
                hue: hueVariation,
                baseOpacity: opacityVariation,
            });

            // Limit trail length
            if (ship.trail.length > TRAIL_MAX_POINTS) {
                ship.trail.shift(); // Remove oldest point
            }
        }

        // Update opacity of existing trail points
        ship.trail = ship.trail.filter((point) => {
            const age = currentTime - point.timestamp;
            const ageFactor = Math.max(0, 1 - age / TRAIL_DECAY_TIME);
            point.opacity = point.baseOpacity * ageFactor;
            return point.opacity > 0.01; // Remove fully faded points
        });
    }

    /**
     * Update AI ship movement and weapons based on AI input
     */
    private updateAIShipMovement(
        ship: Ship,
        aiInput: import("./AISystem").AIInput,
        currentTime: number
    ): void {
        const deltaTime = 1 / 60; // Approximate frame time
        const rotationSpeed = SHIP.ROTATION_SPEED; // radians per second
        const thrustPower = SHIP.THRUST_POWER; // pixels per second squared
        const maxSpeed = SHIP.MAX_SPEED; // pixels per second
        const friction = SHIP.FRICTION; // velocity damping multiplier

        // Rotation
        if (aiInput.left) {
            ship.rotation -= rotationSpeed * deltaTime;
        }
        if (aiInput.right) {
            ship.rotation += rotationSpeed * deltaTime;
        }

        // Main thrust (2x fuel consumption)
        ship.thrusting = aiInput.thrust;
        if (aiInput.thrust) {
            const fuelNeeded = 2 * deltaTime; // 2 units per second
            if (this.gameState.consumeFuel(fuelNeeded, ship.playerId)) {
                const thrustVector = Vector2.fromAngle(
                    ship.rotation,
                    thrustPower * deltaTime
                );
                ship.velocity = ship.velocity.add(thrustVector);
            } else {
                ship.thrusting = false; // Can't thrust without fuel
            }
        }

        // Strafe thrusters (50% power, 1x fuel consumption each)
        const strafePower = thrustPower * 0.5;

        ship.strafingLeft = aiInput.strafeLeft;
        if (aiInput.strafeLeft) {
            const fuelNeeded = 1 * deltaTime; // 1 unit per second
            if (this.gameState.consumeFuel(fuelNeeded, ship.playerId)) {
                const strafeVector = Vector2.fromAngle(
                    ship.rotation - Math.PI / 2,
                    strafePower * deltaTime
                );
                ship.velocity = ship.velocity.add(strafeVector);
            } else {
                ship.strafingLeft = false;
            }
        }

        ship.strafingRight = aiInput.strafeRight;
        if (aiInput.strafeRight) {
            const fuelNeeded = 1 * deltaTime; // 1 unit per second
            if (this.gameState.consumeFuel(fuelNeeded, ship.playerId)) {
                const strafeVector = Vector2.fromAngle(
                    ship.rotation + Math.PI / 2,
                    strafePower * deltaTime
                );
                ship.velocity = ship.velocity.add(strafeVector);
            } else {
                ship.strafingRight = false;
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

        // Handle weapon input
        this.weaponSystem.handleWeaponInput(
            ship,
            {
                weapon1: aiInput.weapon1,
                weapon2: aiInput.weapon2,
                weapon3: aiInput.weapon3,
                weapon4: aiInput.weapon4,
                shoot: aiInput.shoot,
                shootPressed: aiInput.shootPressed,
            },
            currentTime,
            InputContext.GAMEPLAY
        );
    }

    /**
     * Consume fuel from a specific ship's fuel pool
     */

    private render(): void {
        // Clear canvas
        this.ctx.fillStyle = "#000000";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw all entities using EntityManager
        const allEntities = this.entityManager.getAllEntities();
        allEntities.forEach((entity) => {
            this.drawObjectWithWrapAround(entity);
        });

        // Draw shields for all ships
        this.renderShields();

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

    private drawObjectWithWrapAround(obj: GameEntity): void {
        // Get object radius for wrap-around detection
        const radius =
            obj.type === "bullet" ? 5 : Math.max(obj.size.x, obj.size.y) / 2;

        // Calculate all positions where object should be drawn
        const positions: Vector2[] = [obj.position];

        // Check if object is near edges and add wrap-around positions
        if (obj.position.x - radius < 0) {
            positions.push(
                new Vector2(obj.position.x + this.canvas.width, obj.position.y)
            );
        }
        if (obj.position.x + radius > this.canvas.width) {
            positions.push(
                new Vector2(obj.position.x - this.canvas.width, obj.position.y)
            );
        }
        if (obj.position.y - radius < 0) {
            positions.push(
                new Vector2(obj.position.x, obj.position.y + this.canvas.height)
            );
        }
        if (obj.position.y + radius > this.canvas.height) {
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
                Shapes.drawShip({
                    ctx: this.ctx,
                    position: pos,
                    rotation: obj.rotation,
                    color: obj.color,
                    invulnerable: obj.invulnerable,
                    invulnerableTime: obj.invulnerableTime,
                    showThrust: obj.thrusting,
                    scale: SHIP.SCALE,
                    strafingLeft: obj.strafingLeft,
                    strafingRight: obj.strafingRight,
                    trail: obj.trail,
                    scaleManager: this.scaleManager,
                });

                // Draw laser beam if active
                if (obj.isLaserActive) {
                    let laserLength = WEAPONS.LASER.LENGTH;
                    if (this.gameState.hasUpgrade("upgrade_laser_range")) {
                        laserLength *= WEAPONS.LASER.LENGTH_UPGRADE;
                    }

                    Shapes.drawLaser(
                        this.ctx,
                        pos,
                        obj.rotation,
                        laserLength,
                        WEAPONS.LASER.COLOR,
                        WEAPONS.LASER.WIDTH
                    );
                }

                // Draw lightning arcs if active
                if (obj.lightningTargets && obj.lightningTime !== undefined) {
                    Shapes.drawLightning(
                        this.ctx,
                        obj.lightningTargets,
                        obj.lightningTime,
                        this.lastTime,
                        WEAPONS.LIGHTNING.ARC_COLOR,
                        WEAPONS.LIGHTNING.ARC_WIDTH
                    );
                }
            } else if (obj.type === "asteroid") {
                Shapes.drawAsteroid({
                    ctx: this.ctx,
                    position: pos,
                    rotation: obj.rotation,
                    size: obj.size,
                    color: obj.color,
                    scale: ASTEROID.SCALE,
                    scaleManager: this.scaleManager,
                });
            } else if (obj.type === "bullet") {
                Shapes.drawBullet({
                    ctx: this.ctx,
                    position: pos,
                    color: obj.color,
                    scale: BULLET.SCALE,
                    scaleManager: this.scaleManager,
                });
            } else if (obj.type === "missile") {
                Shapes.drawMissile({
                    ctx: this.ctx,
                    position: pos,
                    rotation: obj.rotation,
                    color: obj.color,
                    scale: WEAPONS.MISSILES.SCALE,
                    scaleManager: this.scaleManager,
                });
            } else if (obj.type === "warpBubbleIn") {
                Shapes.drawWarpBubble({
                    ctx: this.ctx,
                    position: pos,
                    animationProgress: obj.warpAnimationProgress || 0,
                    isClosing: false,
                    scale: WARP_BUBBLE.SCALE,
                    scaleManager: this.scaleManager,
                });
            } else if (obj.type === "warpBubbleOut") {
                let disappearProgress = 0;
                if (obj.warpDisappearing && obj.warpDisappearStartTime) {
                    const disappearElapsed =
                        performance.now() - obj.warpDisappearStartTime;
                    disappearProgress = Math.min(1, disappearElapsed / 500);
                }
                Shapes.drawWarpBubble({
                    ctx: this.ctx,
                    position: pos,
                    animationProgress: obj.warpAnimationProgress || 0,
                    isClosing: false,
                    isDisappearing: obj.warpDisappearing || false,
                    disappearProgress: disappearProgress,
                    scale: WARP_BUBBLE.SCALE,
                    scaleManager: this.scaleManager,
                });
            } else if (obj.type === "gift") {
                Shapes.drawGift({
                    ctx: this.ctx,
                    position: pos,
                    giftType: obj.giftType,
                    scale: GIFT.SCALE,
                    scaleManager: this.scaleManager,
                });
            }
        });
    }

    private renderFuelGauge(): void {
        const gaugeWidth = 200;
        const gaugeHeight = 20;
        const gaugeX = (this.canvas.width - gaugeWidth) / 2;
        const gaugeY = 20;
        const cornerRadius = 4;

        this.ctx.save();
        this.ctx.globalAlpha = 0.4;

        // Draw gauge outline
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

        // Draw fuel fill
        const fuelPercentage = this.gameState.fuelPercentage;
        const fillWidth = (gaugeWidth - 4) * (fuelPercentage / 100);

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

    private getFuelColor(percentage: number): string {
        if (percentage < 20) {
            return "#ff0000";
        }
        const normalizedPercentage = (percentage - 20) / 80;
        const red = Math.round(255 * (1 - normalizedPercentage));
        const green = 255;
        const blue = 0;
        return `rgb(${red}, ${green}, ${blue})`;
    }

    private renderWeaponHUD(): void {
        const weaponState = this.gameState.weaponState;
        const weapons = [
            {
                type: "bullets",
                unlocked: weaponState.unlockedWeapons.has("bullets"),
                selected: weaponState.currentWeapon === "bullets",
            },
            {
                type: "missiles",
                unlocked: weaponState.unlockedWeapons.has("missiles"),
                selected: weaponState.currentWeapon === "missiles",
            },
            {
                type: "laser",
                unlocked: weaponState.unlockedWeapons.has("laser"),
                selected: weaponState.currentWeapon === "laser",
            },
            {
                type: "lightning",
                unlocked: weaponState.unlockedWeapons.has("lightning"),
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

    /**
     * Render shields for all ships
     */
    private renderShields(): void {
        const ships = this.entityManager.getShips();

        for (const ship of ships) {
            const shieldInfo = this.shieldSystem.getShieldRenderInfo(
                ship.playerId
            );
            if (shieldInfo?.isActive) {
                this.drawShieldWithWrapAround(ship, shieldInfo);
            }
        }
    }

    /**
     * Draw a shield with wrap-around support
     */
    private drawShieldWithWrapAround(
        ship: Ship,
        shieldInfo: { isActive: boolean; isRecharging: boolean }
    ): void {
        const shipRadius = Math.max(ship.size.x, ship.size.y) / 2;
        const shieldRadius = shipRadius + 5; // 5 pixels larger than ship

        // Determine shield color based on state
        const baseColor = SHIELD.COLOR; // "#00bfff" (bright light blue)
        const alpha = shieldInfo.isRecharging
            ? SHIELD.ALPHA * 0.5
            : SHIELD.ALPHA; // Dimmer when recharging

        // Convert hex color to rgba
        const r = parseInt(baseColor.slice(1, 3), 16);
        const g = parseInt(baseColor.slice(3, 5), 16);
        const b = parseInt(baseColor.slice(5, 7), 16);
        const shieldColor = `rgba(${r}, ${g}, ${b}, ${alpha})`;

        // Calculate positions where shield should be drawn (including wrap-around)
        const positions: Vector2[] = [ship.position];

        // Check if shield is near edges and add wrap-around positions
        if (ship.position.x - shieldRadius < 0) {
            positions.push(
                new Vector2(
                    ship.position.x + this.canvas.width,
                    ship.position.y
                )
            );
        }
        if (ship.position.x + shieldRadius > this.canvas.width) {
            positions.push(
                new Vector2(
                    ship.position.x - this.canvas.width,
                    ship.position.y
                )
            );
        }
        if (ship.position.y - shieldRadius < 0) {
            positions.push(
                new Vector2(
                    ship.position.x,
                    ship.position.y + this.canvas.height
                )
            );
        }
        if (ship.position.y + shieldRadius > this.canvas.height) {
            positions.push(
                new Vector2(
                    ship.position.x,
                    ship.position.y - this.canvas.height
                )
            );
        }

        // Draw shield circle at all calculated positions
        for (const pos of positions) {
            this.ctx.save();
            this.ctx.strokeStyle = shieldColor;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(pos.x, pos.y, shieldRadius, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.restore();
        }
    }
}
