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
import { ZoneChoiceScreen } from "~/ui/ZoneChoiceScreen";
import { ShopUI } from "~/ui/ShopUI";
import { UIStackManager } from "~/ui/UIStackManager";

import { GameState } from "./GameState";
import { EntityManager } from "./EntityManager";
import { WeaponSystem } from "./WeaponSystem";
import { ShieldSystem } from "./ShieldSystem";
import { CollisionSystem } from "./CollisionSystem";
import { GiftSystem } from "./GiftSystem";
import { ShopSystem } from "./ShopSystem";
import { InputHandler } from "./InputHandler";
import { AISystem } from "./AISystem";
import { MessageSystem } from "./MessageSystem";
import { DebugRenderer } from "./DebugRenderer";
import { ZoneSystem } from "./ZoneSystem";
import { NebulaSystem } from "./NebulaSystem";
import { LocalStorage } from "~/utils/LocalStorage";
import { HUDRenderer } from "~/ui/HUDRenderer";
import { generateScreenshotFilename } from "~/utils/screenshot";

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
    private zoneChoiceScreen: ZoneChoiceScreen;
    private shopUI: ShopUI;
    private scaleManager: ScaleManager;
    private uiStackManager: UIStackManager;

    // Extracted systems
    private entityManager: EntityManager;
    private weaponSystem: WeaponSystem;
    private shieldSystem: ShieldSystem;
    private collisionSystem: CollisionSystem;
    private giftSystem: GiftSystem;
    private shopSystem: ShopSystem;
    private inputHandler: InputHandler;
    private aiSystem: AISystem;
    private messageSystem: MessageSystem;
    private debugRenderer: DebugRenderer;
    private zoneSystem: ZoneSystem;
    private nebulaSystem: NebulaSystem;
    private hudRenderer: HUDRenderer;

    // Game state
    private levelAnimationStarted = false;
    private levelStartTime = 0;
    private lastTime = 0;
    private running = false;
    private gameOverSoundPlayed = false;
    private debugMode = false;

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
        this.zoneChoiceScreen = new ZoneChoiceScreen(
            canvas,
            ctx,
            this.gameState
        );
        this.scaleManager = new ScaleManager(canvas.width, canvas.height);
        this.uiStackManager = new UIStackManager();

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
        this.messageSystem = new MessageSystem();
        this.collisionSystem = new CollisionSystem(
            this.audio,
            this.particles,
            this.gameState,
            this.entityManager,
            this.weaponSystem,
            this.shieldSystem,
            this.messageSystem,
            this.scaleManager
        );
        this.giftSystem = new GiftSystem(
            this.audio,
            this.gameState,
            this.entityManager,
            canvas
        );
        this.shopSystem = new ShopSystem(this.gameState);
        this.shopUI = new ShopUI(canvas, ctx, this.gameState, this.shopSystem);
        this.inputHandler = new InputHandler(
            this.input,
            this.gameState,
            this.weaponSystem,
            this.shieldSystem,
            this.entityManager,
            this.uiStackManager,
            this.menuManager,
            this.levelCompleteAnimation,
            this.zoneChoiceScreen,
            this.shopUI
        );
        this.aiSystem = new AISystem(this.entityManager, this.gameState);
        this.debugRenderer = new DebugRenderer(
            this.entityManager,
            this.gameState,
            this.scaleManager
        );
        this.zoneSystem = new ZoneSystem(this.gameState);
        this.nebulaSystem = new NebulaSystem(canvas.width, canvas.height);
        this.hudRenderer = new HUDRenderer(ctx);

        // Listen for canvas resize events
        this.canvasManager.onResize(() => this.handleCanvasResize());

        this.gameState.init(); // Initialize high score

        // Set up bonus timer expiration callback
        this.gameState.setOnBonusTimerExpired(() => {
            const playerShip = this.entityManager
                .getShips()
                .find((ship) => ship.playerId === "player");
            if (playerShip) {
                this.messageSystem.createBonusTimerExpiredMessage(
                    playerShip.position,
                    this.canvas.width,
                    this.canvas.height
                );
            }
        });

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

        // Initialize nebula for starting zone
        this.nebulaSystem.initializeForZone(this.gameState.zone);

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

        // Update nebula system with new canvas dimensions
        this.nebulaSystem.updateCanvasSize(
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

    /**
     * Get the current game state (for testing)
     */
    getGameState(): GameState {
        return this.gameState;
    }

    // Pause toggling is now handled by InputHandler

    start(): void {
        this.running = true;

        // Load debug settings from localStorage
        this.loadDebugSettings();

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

        // Handle input processing through InputHandler (including zone choice screen)
        this.inputHandler.processInput(
            currentTime,
            () => this.showGameOver(),
            () => this.restart(),
            () => this.handleScreenshotInput()
        );

        // Handle debug mode toggle
        if (this.input.debugToggle) {
            this.debugMode = !this.debugMode;
        }

        // Update level completion animation
        this.levelCompleteAnimation.update(currentTime);

        // Check if animation completed and advance to next level
        if (!this.levelCompleteAnimation.active && this.levelAnimationStarted) {
            this.advanceToNextLevel();
            this.levelAnimationStarted = false;
        }

        // Skip updates if game is over, paused, level animation is playing, or zone choice is active
        if (
            this.gameState.gameOver ||
            this.inputHandler.isPausedState() ||
            this.levelCompleteAnimation.active ||
            this.zoneChoiceScreen.active
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

        // Update message system
        this.messageSystem.update(currentTime);

        // Update nebula system
        this.nebulaSystem.update(deltaTime, currentTime);

        // Check all collisions through CollisionSystem
        this.collisionSystem.checkAllCollisions(currentTime);

        // Update explosion zones (decrement remaining frames and remove expired)
        this.entityManager.updateExplosionZones();

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
        // Check if we have a debug zone preference before resetting
        const debugZone = LocalStorage.getDebugZone();

        // Reset game state
        this.gameState.reset();

        // If debug zone is set, immediately set it instead of starting at zone 1
        if (debugZone) {
            this.gameState.setZoneAndLevel(debugZone, 1);
        }

        // Clear all entities and reinitialize
        this.entityManager.clearAllEntities();
        this.init();

        // Reset systems
        this.weaponSystem.reset();
        this.shieldSystem.resetShieldState();
        this.giftSystem.reset();
        this.inputHandler.reset();
        this.messageSystem.clearAllMessages();

        // Initialize nebula for starting zone (which could be debug zone now)
        this.nebulaSystem.initializeForZone(this.gameState.zone);

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

        // Calculate and award currency for level completion
        const currencyReward = this.gameState.calculateLevelCurrencyReward();
        if (currencyReward > 0) {
            this.gameState.addCurrency(currencyReward);
        }

        // Start level completion animation
        this.levelCompleteAnimation.start(
            this.gameState.absoluteLevel,
            completionTime
        );
        // Add to UI stack
        this.uiStackManager.showLevelComplete(this.levelCompleteAnimation);
        this.levelAnimationStarted = true;
    }

    private advanceToNextLevel(): void {
        // Clean up all entities except the ship before starting new level
        this.entityManager.clearAllExceptShips();

        // Advance to next level
        this.gameState.nextLevel();

        // Check if we should show the zone choice screen
        if (this.gameState.shouldShowChoiceScreen()) {
            this.showZoneChoiceScreen();
            return;
        }

        // Continue with normal level progression
        this.spawnLevelAsteroids();

        // Start timing the new level
        this.levelStartTime = performance.now();
    }

    private spawnLevelAsteroids(): void {
        // Apply zone-specific effects before spawning
        this.zoneSystem.applyZoneEffects();

        // Spawn asteroids based on current zone configuration
        const asteroidCount = this.zoneSystem.calculateAsteroidCount();

        for (let i = 0; i < asteroidCount; i++) {
            this.createAsteroid();
        }
    }

    private showZoneChoiceScreen(): void {
        // Add to UI stack with choice callback
        this.uiStackManager.showZoneChoice(this.zoneChoiceScreen, (choice) => {
            this.handleZoneChoice(choice as "continue" | "next_zone" | "shop");
        });
    }

    private showShopUI(): void {
        // TODO: Implement proper zone continuation after shop closes
        // The UIStackManager should handle this via events or callbacks
        // Add to UI stack with onClose callback for game state changes
        this.uiStackManager.showShop(this.shopUI, () => {
            // When shop is closed, continue with current zone
            this.gameState.continueCurrentZone();

            // Initialize nebula for the zone
            this.nebulaSystem.initializeForZone(this.gameState.zone);

            // Spawn asteroids for the new level
            this.spawnLevelAsteroids();

            // Start timing the new level
            this.levelStartTime = performance.now();
        });
    }

    private handleZoneChoice(choice: "continue" | "next_zone" | "shop"): void {
        switch (choice) {
            case "continue":
                // Reset level to 1 and continue in current zone
                this.gameState.continueCurrentZone();
                break;
            case "next_zone":
                // Advance to next zone
                this.gameState.advanceToNextZone();
                break;
            case "shop":
                // Open shop interface
                this.showShopUI();
                return; // Don't proceed with zone initialization yet
        }

        // Initialize nebula for the new zone
        this.nebulaSystem.initializeForZone(this.gameState.zone);

        // Spawn asteroids for the new level
        this.spawnLevelAsteroids();

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

        // Draw nebula layer (above entities, below HUD)
        this.renderNebula();

        // Draw particles
        this.particles.render(this.ctx);

        // Draw debug visuals if enabled
        this.debugRenderer.render(this.ctx, this.debugMode);

        // Draw fuel gauge
        this.renderFuelGauge();

        // Draw weapon HUD
        this.renderWeaponHUD();

        // Draw animated messages
        this.renderMessages();

        // Draw main HUD elements
        this.renderMainHUD();

        // Draw game over screen if needed
        if (this.gameState.gameOver) {
            this.showGameOver();
        }

        // Draw all UI components via the UI stack
        this.uiStackManager.render();
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
            } else if (obj.type === "explosionZone") {
                Shapes.drawExplosionZone({
                    ctx: this.ctx,
                    position: pos,
                    radius: obj.explosionRadius,
                    remainingFrames: obj.remainingFrames,
                    maxFrames: WEAPONS.MISSILES.EXPLOSION_DURATION_FRAMES,
                    color: obj.color,
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
        const backgroundPadding = 4;

        this.ctx.save();

        // Draw semi-transparent black background for better readability in nebula zones
        if (this.zoneSystem.hasNebulaEffects()) {
            this.ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
            this.ctx.beginPath();
            this.ctx.roundRect(
                gaugeX - backgroundPadding,
                gaugeY - backgroundPadding,
                gaugeWidth + backgroundPadding * 2,
                gaugeHeight + backgroundPadding * 2,
                cornerRadius + 2
            );
            this.ctx.fill();
        }

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

        // Draw semi-transparent background for weapon HUD in nebula zones
        if (this.zoneSystem.hasNebulaEffects()) {
            const backgroundPadding = 8;
            const hudWidth = WEAPONS.HUD.ICON_SIZE + backgroundPadding * 2;
            const hudHeight =
                weapons.length * WEAPONS.HUD.ICON_SPACING +
                WEAPONS.HUD.ICON_SIZE +
                backgroundPadding * 2;

            this.ctx.save();
            this.ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
            this.ctx.beginPath();
            this.ctx.roundRect(
                hudPosition.x - WEAPONS.HUD.ICON_SIZE / 2 - backgroundPadding,
                hudPosition.y - WEAPONS.HUD.ICON_SIZE / 2 - backgroundPadding,
                hudWidth,
                hudHeight,
                4
            );
            this.ctx.fill();
            this.ctx.restore();
        }

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
        const shieldRadius = shipRadius + SHIELD.RADIUS_OFFSET;

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

        // Determine stroke width based on shield state
        const strokeWidth = shieldInfo.isRecharging
            ? SHIELD.STROKE_WIDTH_RECHARGING
            : SHIELD.STROKE_WIDTH_CHARGED;

        // Draw shield circle at all calculated positions
        for (const pos of positions) {
            this.ctx.save();
            this.ctx.strokeStyle = shieldColor;
            this.ctx.lineWidth = strokeWidth;
            this.ctx.beginPath();
            this.ctx.arc(pos.x, pos.y, shieldRadius, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.restore();
        }
    }

    /**
     * Render animated messages
     */
    private renderMessages(): void {
        const activeMessages = this.messageSystem.getActiveMessages();
        Shapes.drawActiveMessages(this.ctx, activeMessages, this.scaleManager);
    }

    /**
     * Render nebula effects for zones that have them
     */
    private renderNebula(): void {
        // Check if current zone has nebula effects
        if (this.zoneSystem.hasNebulaEffects()) {
            const particles = this.nebulaSystem.getParticles();
            Shapes.drawNebulaLayer(this.ctx, particles, this.scaleManager);
        }
    }

    // NOTE: renderStatusHUD removed - HUD is now rendered via HUDRenderer

    /**
     * Get MessageSystem for external access
     */
    getMessageSystem(): MessageSystem {
        return this.messageSystem;
    }

    /**
     * Debug method to directly load a specific zone (bypasses normal progression)
     */
    setDebugZone(zone: number): void {
        // Validate zone
        const zoneConfig = this.zoneSystem.getZoneConfig(zone);
        if (!zoneConfig) {
            console.warn(`Invalid zone: ${zone}`);
            return;
        }

        // Clean up current state
        this.entityManager.clearAllExceptShips();
        this.particles.clear();
        this.nebulaSystem.clear();

        // Set new zone and reset level
        this.gameState.setZoneAndLevel(zone, 1);

        // Initialize zone-specific systems
        this.nebulaSystem.initializeForZone(zone);

        // Start new level with proper asteroid generation
        this.initializeLevel();
    }

    /**
     * Get available zones for debugging
     */
    getAvailableZones(): Array<{
        zone: number;
        name: string;
        hasNebula: boolean;
    }> {
        return this.zoneSystem.getAvailableZones().map((zoneInfo) => ({
            zone: zoneInfo.zone,
            name: zoneInfo.config.name,
            hasNebula: zoneInfo.config.hasNebula || false,
        }));
    }

    /**
     * Get debug mode state
     */
    getDebugMode(): boolean {
        return this.debugMode;
    }

    /**
     * Set debug mode state (for localStorage persistence)
     */
    setDebugMode(enabled: boolean): void {
        this.debugMode = enabled;
    }

    /**
     * Show shop UI for debugging purposes (does not affect game state when closed)
     */
    showShopUIForDebugging(): void {
        // eslint-disable-next-line no-console
        console.log("Game: showShopUIForDebugging() called");
        // For debugging, simply show the shop without affecting game state
        // This allows testing the shop without needing to complete zones
        // The UIStackManager will handle closing when user presses escape or "Done"
        this.uiStackManager.showShop(this.shopUI);
        // eslint-disable-next-line no-console
        console.log(
            "Game: shopUI active status after show:",
            this.shopUI.active
        );
    }

    /**
     * Load debug settings from localStorage on startup
     */
    private loadDebugSettings(): void {
        // Load debug graphics toggle
        this.debugMode = LocalStorage.getDebugGraphics();

        // Load debug gift setting
        const debugGift = LocalStorage.getDebugGifts();
        if (debugGift && debugGift !== "none") {
            this.setDebugNextGift(debugGift as GiftType);
        }

        // Load debug zone preference and apply if set
        // Note: If we're already in the debug zone (e.g., after restart), no need to reload
        const debugZone = LocalStorage.getDebugZone();
        if (debugZone && debugZone !== this.gameState.zone) {
            // Use setTimeout to delay zone loading until after game initialization
            setTimeout(() => {
                this.setDebugZone(debugZone);
            }, 100);
        }
    }

    /**
     * Initialize level with proper asteroid generation
     */
    private initializeLevel(): void {
        // Generate asteroids for the level
        const asteroidCount = this.zoneSystem.calculateAsteroidCount();
        for (let i = 0; i < asteroidCount; i++) {
            this.createAsteroid();
        }

        // Record level start time
        this.levelStartTime = performance.now();
    }

    /**
     * Render main HUD elements using the HUDRenderer
     */
    private renderMainHUD(): void {
        const playerState = this.gameState.getPlayerState("player");
        if (!playerState) return;

        this.hudRenderer.renderHUD(
            {
                score: this.gameState.score,
                scoreStatus: this.gameState.scoreStatus,
                lives: playerState.lives,
                zoneLevel: this.gameState.zoneLevel,
                levelTimeRemaining: this.gameState.levelTimeRemaining,
                currency: this.gameState.currency,
                highScore: this.gameState.highScore,
            },
            this.canvas.width,
            this.canvas.height
        );
    }

    /**
     * Screenshot functionality
     */

    /**
     * Capture the current game canvas as a data URL
     */
    captureScreenshot(format: string = "image/png", quality?: number): string {
        if (quality !== undefined) {
            return this.canvas.toDataURL(format, quality);
        }
        return this.canvas.toDataURL(format);
    }

    /**
     * Generate timestamp string for filenames
     */
    generateTimestamp(): string {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");
        const hours = String(now.getHours()).padStart(2, "0");
        const minutes = String(now.getMinutes()).padStart(2, "0");
        const seconds = String(now.getSeconds()).padStart(2, "0");

        return `${year}-${month}-${day}-${hours}-${minutes}-${seconds}`;
    }

    /**
     * Download screenshot with automatic filename generation
     */
    downloadScreenshot(
        filename?: string,
        format: string = "image/png",
        quality?: number
    ): void {
        try {
            const dataURL = this.captureScreenshot(format, quality);

            // Generate filename if not provided
            if (!filename) {
                filename = generateScreenshotFilename(
                    format,
                    this.gameState.score,
                    this.gameState.absoluteLevel
                );
            }

            // Create download link
            const link = document.createElement("a");
            link.style.display = "none";
            link.download = filename;
            link.href = dataURL;

            // Add to DOM, click, and remove
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("Failed to download screenshot:", error);
        }
    }

    /**
     * Handle screenshot input - capture and download
     */
    handleScreenshotInput(): void {
        this.downloadScreenshot(undefined, "image/png");
    }
}
